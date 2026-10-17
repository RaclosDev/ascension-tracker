package com.ascension.service;

import com.ascension.model.PushSubscription;
import com.ascension.model.RestTimer;
import com.ascension.repository.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import nl.martijndwars.webpush.Urgency;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
public class PushNotificationService {

    @Value("${app.push.vapid-public-key:CHANGE_ME}")
    private String vapidPublicKey;

    @Value("${app.push.vapid-private-key:CHANGE_ME}")
    private String vapidPrivateKey;

    @Value("${app.push.vapid-subject:mailto:admin@example.com}")
    private String vapidSubject;

    @Value("${app.push.http-timeout-sec:10}")
    private int httpTimeoutSec;

    private PushService pushService;

    private final PushSubscriptionRepository subscriptionRepo;
    private final RestTimerService restTimerService;
    private final ThreadPoolTaskExecutor pushExecutor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PushNotificationService(
            PushSubscriptionRepository subscriptionRepo,
            RestTimerService restTimerService,
            @Qualifier("pushNotificationExecutor") ThreadPoolTaskExecutor pushExecutor,
            @Autowired(required = false) PushService pushService
    ) {
        this.subscriptionRepo = subscriptionRepo;
        this.restTimerService = restTimerService;
        this.pushExecutor = pushExecutor;
        this.pushService = pushService;
    }

    @PostConstruct
    public void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        if (this.pushService == null) {
            try {
                if (vapidPublicKey != null && !vapidPublicKey.isBlank() && !"CHANGE_ME".equals(vapidPublicKey)
                        && vapidPrivateKey != null && !vapidPrivateKey.isBlank() && !"CHANGE_ME".equals(vapidPrivateKey)) {
                    this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
                }
            } catch (Exception e) {
                log.warn("Failed to initialize default PushService: {}", e.getMessage());
            }
        }
    }

    public void setPushService(PushService pushService) {
        this.pushService = pushService;
    }

    public PushService getPushService() {
        return this.pushService;
    }

    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    @Transactional
    public void saveSubscription(String userEmail, Subscription subscription) {
        subscriptionRepo.findByEndpoint(subscription.endpoint).ifPresentOrElse(
                sub -> {
                    sub.setUserEmail(userEmail);
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

    @Transactional
    public void removeSubscriptionByEndpoint(String endpoint) {
        subscriptionRepo.deleteByEndpoint(endpoint);
    }

    @Transactional
    public void removeSubscriptionByEndpoint(String endpoint, String userEmail) {
        subscriptionRepo.deleteByEndpointAndUserEmail(endpoint, userEmail);
    }

    /**
     * Schedule a persisted rest notification to fire after `delaySec` seconds.
     * Cancels any pending rest timer for this user.
     */
    public void scheduleRestNotification(String userEmail, int delaySec) {
        restTimerService.scheduleTimer(userEmail, delaySec);
    }

    /**
     * Cancel the pending rest notification for a user (e.g. when they skip rest).
     */
    public void cancelRestNotification(String userEmail) {
        restTimerService.cancelTimers(userEmail);
    }

    /**
     * Poller @Scheduled: queries due timers using SELECT ... FOR UPDATE SKIP LOCKED
     * via RestTimerService, updates their status, and offloads HTTP push delivery
     * to pushExecutor without blocking or saturating the scheduler threads.
     */
    @Scheduled(fixedDelayString = "${app.push.timer-poll-delay-ms:1000}")
    public void pollDueTimers() {
        List<RestTimer> dueTimers = restTimerService.claimDueTimers(Instant.now(), 50);
        for (RestTimer timer : dueTimers) {
            try {
                pushExecutor.submit(() -> {
                    try {
                        sendPush(timer.getUserEmail(), "¡Descanso terminado!", "Es hora de la siguiente serie. 💪");
                    } catch (Exception e) {
                        log.error("Failed to deliver rest timer push notification for user {}", com.ascension.util.PiiMasker.maskEmail(timer.getUserEmail()), e);
                    }
                });
            } catch (java.util.concurrent.RejectedExecutionException e) {
                log.warn("Push executor rejected timer {}, reverting status to PENDING", timer.getId());
                try {
                    restTimerService.revertToPending(timer.getId());
                } catch (Exception re) {
                    log.error("Failed to revert timer {} to PENDING", timer.getId(), re);
                }
            }
        }
    }

    /**
     * Purges expired rest timers older than 24 hours daily at 03:00 AM.
     */
    @Scheduled(cron = "${app.push.timer-cleanup-cron:0 0 3 * * *}")
    public void cleanupOldRestTimers() {
        try {
            restTimerService.purgeOldTimers(Instant.now().minus(1, java.time.temporal.ChronoUnit.DAYS));
        } catch (Exception e) {
            log.error("Failed to execute rest timer cleanup job", e);
        }
    }

    public void sendPush(String userEmail, String title, String body) {
        if (pushService == null) {
            log.warn("PushService is not initialized. Skipping push to {}", com.ascension.util.PiiMasker.maskEmail(userEmail));
            return;
        }

        List<PushSubscription> subscriptions = subscriptionRepo.findByUserEmail(userEmail);
        if (subscriptions.isEmpty()) {
            log.debug("No push subscriptions found for {}", com.ascension.util.PiiMasker.maskEmail(userEmail));
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "body", body
            ));
        } catch (Exception e) {
            log.error("Failed to serialize push payload for {}", com.ascension.util.PiiMasker.maskEmail(userEmail), e);
            return;
        }

        for (PushSubscription sub : subscriptions) {
            deliverToSubscription(sub, payload);
        }
    }

    private void deliverToSubscription(PushSubscription sub, String payload) {
        try {
            Notification notification = new Notification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payload,
                    Urgency.HIGH
            );

            HttpResponse response = executePushSend(notification);
            int statusCode = (response != null && response.getStatusLine() != null)
                    ? response.getStatusLine().getStatusCode()
                    : -1;

            if (statusCode == 404 || statusCode == 410) {
                log.warn("Subscription {} returned HTTP {}, removing dead endpoint", sub.getEndpoint(), statusCode);
                removeSubscriptionByEndpoint(sub.getEndpoint());
            } else if (statusCode >= 200 && statusCode < 300) {
                log.debug("Push successfully delivered to endpoint {}", sub.getEndpoint());
            } else {
                log.warn("Push to endpoint {} returned unexpected HTTP status {}", sub.getEndpoint(), statusCode);
            }
        } catch (TimeoutException te) {
            log.warn("Push delivery to endpoint {} timed out after {}s", sub.getEndpoint(), httpTimeoutSec);
        } catch (Exception e) {
            Throwable cause = (e instanceof ExecutionException || e instanceof CompletionException) && e.getCause() != null
                    ? e.getCause()
                    : e;
            log.error("Failed to send push to endpoint {}: {}", sub.getEndpoint(), cause.getMessage());
            if (cause.getMessage() != null && (cause.getMessage().contains("410") || cause.getMessage().contains("404"))) {
                log.warn("Push endpoint {} failed with 404/410 in error message, removing dead endpoint", sub.getEndpoint());
                removeSubscriptionByEndpoint(sub.getEndpoint());
            }
        }
    }

    private HttpResponse executePushSend(Notification notification) throws Exception {
        Future<HttpResponse> future = null;
        try {
            future = pushService.sendAsync(notification);
        } catch (UnsupportedOperationException | NoSuchMethodError ignored) {
        }

        if (future != null) {
            try {
                return future.get(httpTimeoutSec, TimeUnit.SECONDS);
            } catch (TimeoutException te) {
                future.cancel(true);
                throw te;
            }
        } else {
            return pushService.send(notification);
        }
    }
}
