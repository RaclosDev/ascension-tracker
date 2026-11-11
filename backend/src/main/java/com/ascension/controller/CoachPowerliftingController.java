package com.ascension.controller;

import com.ascension.dto.PowerliftingDtos.Saved;
import com.ascension.dto.PowerliftingDtos.SaveRequest;
import com.ascension.service.PowerliftingService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/coach/clients/{linkId}/powerlifting")
@RequiredArgsConstructor
public class CoachPowerliftingController {
    private final PowerliftingService powerlifting;

    @GetMapping
    public ResponseEntity<Saved> get(@PathVariable UUID linkId, @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(powerlifting.get(email, linkId));
    }

    @PutMapping
    public ResponseEntity<Saved> save(@PathVariable UUID linkId, @Valid @RequestBody SaveRequest request,
                                    @AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(powerlifting.save(email, linkId, request));
    }
}
