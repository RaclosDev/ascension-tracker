package com.ascension.controller;

import com.ascension.dto.CoachSettingsDtos.Settings;
import com.ascension.service.CoachSettingsService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coach/settings")
@RequiredArgsConstructor
public class CoachSettingsController {
    private final CoachSettingsService settings;

    @GetMapping
    public ResponseEntity<Settings> get(@AuthenticationPrincipal Jwt jwt) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(settings.get(email));
    }

    @PutMapping
    public ResponseEntity<Settings> save(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody Settings request) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(settings.save(email, request));
    }
}
