package com.ascension.controller;

import com.ascension.service.PushNotificationService;
import nl.martijndwars.webpush.Subscription;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.ascension.util.SecurityUtils;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushNotificationService pushService;

    public PushController(PushNotificationService pushService) {
        this.pushService = pushService;
    }

    @GetMapping("/vapid-key")
    public ResponseEntity<Map<String, String>> getVapidKey() {
        return ResponseEntity.ok(Map.of("publicKey", pushService.getVapidPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubscriptionRequest request
    ) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(401).build();
        Subscription sub = new Subscription(
                request.endpoint,
                new Subscription.Keys(request.keys.p256dh, request.keys.auth)
        );
        pushService.saveSubscription(email, sub);
        return ResponseEntity.ok().build();
    }

    /**
     * Without an endpoint, removes every subscription and cancels the pending rest timer.
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody(required = false) UnsubscribeRequest request
    ) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(401).build();
        if (request != null && request.endpoint != null && !request.endpoint.isBlank()) {
            pushService.removeSubscriptionByEndpoint(request.endpoint, email);
        } else {
            pushService.removeSubscription(email);
            pushService.cancelRestNotification(email);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rest-timer")
    public ResponseEntity<Void> scheduleRest(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody RestTimerRequest request
    ) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(401).build();
        if (request.delaySec > 0) {
            pushService.scheduleRestNotification(email, request.delaySec);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/rest-timer/cancel")
    public ResponseEntity<Void> cancelRest(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(401).build();
        pushService.cancelRestNotification(email);
        return ResponseEntity.ok().build();
    }

    // Request DTOs

    public static class SubscriptionRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(max = 600)
        @jakarta.validation.constraints.Pattern(
                regexp = "^https://(fcm\\.googleapis\\.com|updates\\.push\\.services\\.mozilla\\.com|[a-z0-9-]+(\\.[a-z0-9-]+)*\\.push\\.apple\\.com|[a-z0-9-]+(\\.[a-z0-9-]+)*\\.notify\\.windows\\.com)/\\S*$",
                message = "Invalid push service endpoint"
        )
        public String endpoint;

        @jakarta.validation.constraints.NotNull
        @Valid
        public KeysData keys;
    }

    public static class KeysData {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(max = 200)
        public String p256dh;

        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Size(max = 200)
        public String auth;
    }

    public static class RestTimerRequest {
        @jakarta.validation.constraints.Min(1)
        @jakarta.validation.constraints.Max(3600)
        public int delaySec;
    }

    public static class UnsubscribeRequest {
        @jakarta.validation.constraints.Size(max = 600)
        public String endpoint;
    }
}

