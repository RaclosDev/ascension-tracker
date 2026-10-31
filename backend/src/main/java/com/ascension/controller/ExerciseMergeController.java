package com.ascension.controller;

import com.ascension.service.ExerciseMergeService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/api/workouts/exercises")
public class ExerciseMergeController {
    private final ExerciseMergeService service;
    public record Request(@NotBlank @Size(max = 255) String targetExerciseId) { }

    @PostMapping("/{sourceId}/merge")
    public ResponseEntity<ExerciseMergeService.Result> merge(@AuthenticationPrincipal Jwt jwt,
            @PathVariable @Size(max = 255) String sourceId, @Valid @RequestBody Request request) {
        String email = SecurityUtils.extractEmail(jwt);
        if (email == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(service.merge(email, sourceId, request.targetExerciseId()));
    }
}
