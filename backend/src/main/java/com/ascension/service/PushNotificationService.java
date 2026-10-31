package com.ascension.service;

import com.ascension.model.PushSubscription;
import com.ascension.model.RestTimer;
import com.ascension.repository.PushSubscriptionRepository;
import tools.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import nl.martijndwars.webpush.Urgency;
import org.apache.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Long scheduleRestNotification(String userEmail, int delaySec) {
        return restTimerService.scheduleTimer(userEmail, delaySec).getId();
    }

    public void cancelRestNotification(String userEmail) {
        restTimerService.cancelTimers(userEmail);
    }

    /**
     * Claims due timers with FOR UPDATE SKIP LOCKED and hands HTTP delivery to pushExecutor,
     * so the scheduler thread never blocks on a push.
     */
    @Scheduled(fixedDelayString = "${app.push.timer-poll-delay-ms:1000}")
    public void pollDueTimers() {
        List<RestTimer> dueTimers = restTimerService.claimDueTimers(Instant.now(), 50);
        for (RestTimer timer : dueTimers) {
            try {
                pushExecutor.submit(() -> {
                    try {
                        if (!restTimerService.renewClaim(timer)) return;
                        boolean delivered = sendPush(timer.getUserEmail(), "¡Descanso terminado!",
                                "Es hora de la siguiente serie.", timer);
                        restTimerService.finishDelivery(timer, delivered);
                    } catch (Exception e) {
                        restTimerService.finishDelivery(timer, false);
                        log.error("Failed to deliver rest timer push notification for user {}", com.ascension.util.PiiMasker.maskEmail(timer.getUserEmail()), e);
                    }
                });
            } catch (java.util.concurrent.RejectedExecutionException e) {
                log.warn("Push executor rejected timer {}, reverting status to PENDING", timer.getId());
                try {
                    restTimerService.finishDelivery(timer, false);
                } catch (Exception re) {
                    log.error("Failed to revert timer {} to PENDING", timer.getId(), re);
                }
            }
        }
    }

    @Scheduled(cron = "${app.push.timer-cleanup-cron:0 0 3 * * *}")
    public void cleanupOldRestTimers() {
        try {
            restTimerService.purgeOldTimers(Instant.now().minus(1, java.time.temporal.ChronoUnit.DAYS));
        } catch (Exception e) {
            log.error("Failed to execute rest timer cleanup job", e);
        }
    }

    public void sendPush(String userEmail, String title, String body) {
        sendPush(userEmail, title, body, null);
    }

    private boolean sendPush(String userEmail, String title, String body, RestTimer timer) {
        if (pushService == null) {
            log.warn("PushService is not initialized. Skipping push to {}", com.ascension.util.PiiMasker.maskEmail(userEmail));
            return false;
        }

        List<PushSubscription> subscriptions = subscriptionRepo.findByUserEmail(userEmail);
        if (subscriptions.isEmpty()) {
            log.debug("No push subscriptions found for {}", com.ascension.util.PiiMasker.maskEmail(userEmail));
            return true;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(Map.of(
                    "title", title,
                    "body", body,
                    "tag", timer == null ? "ascension-rest-timer" : "ascension-rest-timer-" + timer.getId()
            ));
        } catch (Exception e) {
            log.error("Failed to serialize push payload for {}", com.ascension.util.PiiMasker.maskEmail(userEmail), e);
            return false;
        }

        boolean delivered = true;
        for (PushSubscription sub : subscriptions) {
            if (timer != null && !restTimerService.renewClaim(timer)) return false;
            delivered = deliverToSubscription(sub, payload) && delivered;
        }
        return delivered;
    }

    private boolean deliverToSubscription(PushSubscription sub, String payload) {
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
                log.warn("Subscription {} returned HTTP {}, removing dead endpoint", sub.getId(), statusCode);
                removeSubscriptionByEndpoint(sub.getEndpoint());
                return true;
            } else if (statusCode >= 200 && statusCode < 300) {
                log.debug("Push successfully delivered to subscription {}", sub.getId());
                return true;
            } else {
                log.warn("Push to subscription {} returned unexpected HTTP status {}", sub.getId(), statusCode);
            }
        } catch (TimeoutException te) {
            log.warn("Push delivery to subscription {} timed out after {}s", sub.getId(), httpTimeoutSec);
        } catch (Exception e) {
            Throwable cause = (e instanceof ExecutionException || e instanceof CompletionException) && e.getCause() != null
                    ? e.getCause()
                    : e;
            log.error("Failed to send push to subscription {}: {}", sub.getId(), cause.getMessage());
        }
        return false;
    }

    private HttpResponse executePushSend(Notification notification) throws Exception {
        Future<HttpResponse> future = pushService.sendAsync(notification);
        if (future == null) throw new IllegalStateException("Push provider did not return an asynchronous result");
        try {
            return future.get(httpTimeoutSec, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            throw e;
        } catch (InterruptedException e) {
            future.cancel(true);
            Thread.currentThread().interrupt();
            throw e;
        }
    }
}
