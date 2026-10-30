package com.ascension.controller;

import com.ascension.dto.UserSettingsDTO;
import com.ascension.service.SettingsService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public ResponseEntity<UserSettingsDTO> getSettings(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        UserSettingsDTO dto = settingsService.getSettings(userEmail);
        if (dto == null) {
            return ResponseEntity.noContent().build();
        }
        // Strip workoutData so an old PWA cannot download the empty state and overwrite mobile data.
        dto.setWorkoutData(null);
        return ResponseEntity.ok(dto);
    }

    @PutMapping
    public ResponseEntity<UserSettingsDTO> updateSettings(@Valid @RequestBody UserSettingsDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(settingsService.updateSettings(userEmail, dto));
    }
}
