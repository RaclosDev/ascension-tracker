package com.ascension.controller;

import com.ascension.dto.CoachSubscriptionDtos.Billing;
import com.ascension.dto.CoachSubscriptionDtos.PublicInfo;
import com.ascension.service.CoachSubscriptionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

/** What the signed-out landing and legal pages show: coach plan prices and the contact email. */
@RestController
@RequestMapping("/api/public/info")
public class PublicInfoController {

    private final CoachSubscriptionService subscriptionService;
    private final String contactEmail;

    public PublicInfoController(CoachSubscriptionService subscriptionService,
                                @Value("${app.contact-email:}") String contactEmail) {
        this.subscriptionService = subscriptionService;
        this.contactEmail = contactEmail == null || contactEmail.isBlank() ? null : contactEmail.trim();
    }

    @GetMapping
    public ResponseEntity<PublicInfo> info() {
        Billing billing = subscriptionService.billing();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(new PublicInfo(billing.plans(), billing.annualMonths(), contactEmail));
    }
}
