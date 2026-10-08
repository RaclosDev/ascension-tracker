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
import com.ascension.model.PushSubscription;
import com.ascension.repository.PushSubscriptionRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Value("${app.push.vapid-public-key:CHANGE_ME}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:CHANGE_ME}")
    private String vapidPrivateKey;

    @Value("${app.push.vapid-subject:CHANGE_ME}")
    private String vapidSubject;

    private PushService pushService;

    @Autowired
    private PushSubscriptionRepository subscriptionRepo;

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

    @Transactional
    public void saveSubscription(String userEmail, Subscription subscription) {
        subscriptionRepo.findByUserEmail(userEmail).ifPresentOrElse(
            sub -> {
                sub.setEndpoint(subscription.endpoint);
                sub.setP256dh(subscription.keys.p256dh);
                sub.setAuth(subscription.keys.auth);
                subscriptionRepo.save(sub);
            },
            () -> {
                PushSubscription sub = PushSubscription.builder()
                        .userEmail(userEmail)
                        .endpoint(subscription.endpoint)
                        .p256dh(subscription.keys.p256dh)
                        .auth(subscription.keys.auth)
                        .build();
                subscriptionRepo.save(sub);
            }
        );
    }

    @Transactional
    public void removeSubscription(String userEmail) {
        subscriptionRepo.deleteByUserEmail(userEmail);
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
        if (pushService == null) return;
        PushSubscription dbSub = subscriptionRepo.findByUserEmail(userEmail).orElse(null);
        if (dbSub == null) return;

        try {
            ObjectMapper mapper = new ObjectMapper();
            String payload = mapper.writeValueAsString(Map.of(
                    "title", title,
                    "body", body
            ));

            Notification notification = new Notification(
                    dbSub.getEndpoint(),
                    dbSub.getP256dh(),
                    dbSub.getAuth(),
                    payload,
                    nl.martijndwars.webpush.Urgency.HIGH
            );
            pushService.send(notification);
        } catch (Exception e) {
            log.error("Failed to send push to {}", userEmail, e);
            if (e.getMessage() != null && e.getMessage().contains("410")) {
                removeSubscription(userEmail);
            }
        }
    }
}
