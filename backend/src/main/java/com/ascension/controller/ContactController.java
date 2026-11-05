package com.ascension.controller;

import com.ascension.dto.ContactDtos.NewContactRequest;
import com.ascension.service.ContactRequestService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Any signed-in user can ask about plans, e.g. a custom plan for more clients. */
@RestController
@RequestMapping("/api/contact-requests")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRequestService contactRequestService;

    @PostMapping
    public ResponseEntity<Void> create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NewContactRequest request) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        contactRequestService.create(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
