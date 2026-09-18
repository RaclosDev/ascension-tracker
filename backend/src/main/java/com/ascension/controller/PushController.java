package com.ascension.controller;

import com.ascension.service.PushNotificationService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    /**
     * Returns the VAPID public key so the frontend can subscribe.
     */
    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getVapidPublicKey()));
    }

    /**
     * Save a push subscription for the authenticated user.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody SubscriptionRequest request
    ) {
        String email = jwt.getClaimAsString("email");
        Subscription sub = new Subscription(
                request.endpoint,
                new Subscription.Keys(request.keys.p256dh, request.keys.auth)
        );
        pushService.saveSubscription(email, sub);
        return ResponseEntity.ok().build();
    }

    /**
     * Unsubscribe.
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        pushService.removeSubscription(email);
        pushService.cancelRestNotification(email);
        return ResponseEntity.ok().build();
    }

    /**
     * Schedule a rest timer notification after `delaySec` seconds.
     */
    @PostMapping("/rest-timer")
    public ResponseEntity<Void> scheduleRest(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody RestTimerRequest request
    ) {
        String email = jwt.getClaimAsString("email");
        if (request.delaySec > 0) {
            pushService.scheduleRestNotification(email, request.delaySec);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Cancel a pending rest timer notification.
     */
    @PostMapping("/rest-timer/cancel")
    public ResponseEntity<Void> cancelRest(@AuthenticationPrincipal Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        pushService.cancelRestNotification(email);
        return ResponseEntity.ok().build();
    }

    // ---- DTOs ----

    public static class SubscriptionRequest {
        public String endpoint;
        public KeysData keys;
    }

    public static class KeysData {
        public String p256dh;
        public String auth;
    }

    public static class RestTimerRequest {
        public int delaySec;
    }
}
