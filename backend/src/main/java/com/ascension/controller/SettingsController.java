package com.ascension.controller;

import com.ascension.dto.UserSettingsDTO;
import com.ascension.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDTO> getSettings(@AuthenticationPrincipal Jwt jwt) {
        UserSettingsDTO dto = settingsService.getSettings(jwt.getClaimAsString("email"));
        // 🔥 CRITICAL SHIELD: Prevent old PWA from downloading the empty state and overwriting mobile data
        dto.setWorkoutData(null);
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<UserSettingsDTO> updateSettings(@RequestBody UserSettingsDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(settingsService.updateSettings(jwt.getClaimAsString("email"), dto));
    }
}
