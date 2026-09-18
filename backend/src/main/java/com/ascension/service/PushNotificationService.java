package com.ascension.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.Security;
import java.util.Map;
import java.util.concurrent.*;
import org.springframework.beans.factory.annotation.Autowired;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Value("${app.push.vapid-public-key}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key}")
    private String vapidPrivateKey;

    @Value("${app.push.vapid-subject}")
    private String vapidSubject;

    private PushService pushService;

    private final ConcurrentHashMap<String, Subscription> subscriptions = new ConcurrentHashMap<>();

    // Scheduled executor for delayed push notifications
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    // Track active timers per user so we can cancel them
    private final ConcurrentHashMap<String, ScheduledFuture<?>> activeTimers = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        Security.addProvider(new BouncyCastleProvider());
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
        } catch (Exception e) {
            log.error("Failed to initialize PushService", e);
        }
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    public void saveSubscription(String userEmail, Subscription subscription) {
        subscriptions.put(userEmail, subscription);
    }

    public void removeSubscription(String userEmail) {
        subscriptions.remove(userEmail);
    }

    /**
     * Schedule a push notification to fire after `delaySec` seconds.
     * Cancels any existing timer for this user.
     */
    public void scheduleRestNotification(String userEmail, int delaySec) {
        // Cancel any existing timer
        cancelRestNotification(userEmail);

        ScheduledFuture<?> future = scheduler.schedule(() -> {
            sendPush(userEmail, "¡Descanso terminado!", "Es hora de la siguiente serie. 💪");
            activeTimers.remove(userEmail);
        }, delaySec, TimeUnit.SECONDS);

        activeTimers.put(userEmail, future);
    }

    /**
     * Cancel the pending rest notification for a user (e.g. when they skip rest).
     */
    public void cancelRestNotification(String userEmail) {
        ScheduledFuture<?> existing = activeTimers.remove(userEmail);
        if (existing != null) {
            existing.cancel(false);
        }
    }

    private void sendPush(String userEmail, String title, String body) {
        // 2. Send standard Web Push
        Subscription sub = subscriptions.get(userEmail);
        if (sub == null || pushService == null) return;

        try {
            ObjectMapper mapper = new ObjectMapper();
            String payload = mapper.writeValueAsString(Map.of(
                    "title", title,
                    "body", body
            ));

            Notification notification = new Notification(
                    sub.endpoint,
                    sub.keys.p256dh,
                    sub.keys.auth,
                    payload,
                    nl.martijndwars.webpush.Urgency.HIGH
            );
            pushService.send(notification);
        } catch (Exception e) {
            log.error("Failed to send push to {}", userEmail, e);
            // If subscription is invalid (410 Gone), remove it
            if (e.getMessage() != null && e.getMessage().contains("410")) {
                subscriptions.remove(userEmail);
            }
        }
    }
}
