package com.ascension.controller;

import com.ascension.service.auth.EmailVerificationService;
import com.ascension.service.auth.EmailVerificationService.Status;
import com.ascension.util.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Whether the signed-in account has verified its email, and the notice left by a takeover. */
@RestController
@RequestMapping("/api/account/email")
public class AccountEmailController {

    private final EmailVerificationService verification;

    public AccountEmailController(EmailVerificationService verification) {
        this.verification = verification;
    }

    @GetMapping
    public ResponseEntity<Status> status(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(verification.status(email));
    }

    @PostMapping("/resend")
    public ResponseEntity<Void> resend(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        verification.resend(email);
        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/notice")
    public ResponseEntity<Void> dismissNotice(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        verification.dismissNotice(email);
        return ResponseEntity.noContent().build();
    }
}
