package com.ascension.controller;

import com.ascension.config.AdminProperties;
import com.ascension.dto.AdminDtos.AdminCoach;
import com.ascension.dto.AdminDtos.AdminStatus;
import com.ascension.dto.AdminDtos.CoachPlans;
import com.ascension.dto.AdminDtos.PlanChange;
import com.ascension.dto.ContactDtos.AdminContactRequest;
import com.ascension.service.CoachSubscriptionService;
import com.ascension.service.ContactRequestService;
import com.ascension.util.PiiMasker;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Back office: coaches' plans, set by hand while billing is a monthly bank transfer. */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminProperties adminProperties;
    private final CoachSubscriptionService subscriptionService;
    private final ContactRequestService contactRequestService;

    @GetMapping("/me")
    public ResponseEntity<AdminStatus> me(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(new AdminStatus(adminProperties.isAdmin(email)));
    }

    @GetMapping("/coaches")
    public ResponseEntity<CoachPlans> coaches(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return ResponseEntity.ok(subscriptionService.adminOverview());
    }

    @PutMapping("/coaches/{coachId}/plan")
    public ResponseEntity<AdminCoach> setPlan(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID coachId,
                                              @Valid @RequestBody PlanChange change) {
        String admin = requireAdmin(jwt);
        AdminCoach updated = subscriptionService.setPlan(coachId, change);
        log.info("Admin {} set coach {} to plan {} until {}", PiiMasker.maskEmail(admin), coachId,
                updated.plan(), updated.currentPeriodEnd());
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/contact-requests")
    public ResponseEntity<List<AdminContactRequest>> contactRequests(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return ResponseEntity.ok(contactRequestService.listForAdmin());
    }

    @PutMapping("/contact-requests/{id}/handled")
    public ResponseEntity<Void> setHandled(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                           @RequestBody HandledChange change) {
        requireAdmin(jwt);
        contactRequestService.setHandled(id, change.handled());
        return ResponseEntity.noContent().build();
    }

    public record HandledChange(boolean handled) {
    }

    private String requireAdmin(Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (!adminProperties.isAdmin(email)) {
            throw new SecurityException("Solo para administradores");
        }
        return email;
    }
}
