package com.ascension.controller;

import com.ascension.dto.WorkoutPreferencesDTO;
import com.ascension.service.WorkoutPreferencesService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/workout-preferences")
@RequiredArgsConstructor
public class WorkoutPreferencesController {

    private final WorkoutPreferencesService workoutPreferencesService;

    @GetMapping
    public ResponseEntity<WorkoutPreferencesDTO> getPreferences(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutPreferencesService.getPreferences(userEmail));
    }

    @PutMapping
    public ResponseEntity<WorkoutPreferencesDTO> updatePreferences(
            @Valid @RequestBody WorkoutPreferencesDTO dto, 
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutPreferencesService.updatePreferences(userEmail, dto));
    }
}
