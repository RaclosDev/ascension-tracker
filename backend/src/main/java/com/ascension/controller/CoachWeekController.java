package com.ascension.controller;

import com.ascension.dto.CoachWeekDtos.*;
import com.ascension.service.CoachWeekService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/coach/clients/{linkId}/weeks/{week}")
public class CoachWeekController {
    private final CoachWeekService service;

    @GetMapping
    public ResponseEntity<Saved> get(@PathVariable UUID linkId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.get(email, linkId, week));
    }

    @PutMapping
    public ResponseEntity<Saved> save(@PathVariable UUID linkId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @Valid @RequestBody Save request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.save(email, linkId, week, request));
    }

    @PostMapping("/publish")
    public ResponseEntity<Saved> publish(@PathVariable UUID linkId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week,
            @Valid @RequestBody Publish request, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.publish(email, linkId, week, request));
    }
}
