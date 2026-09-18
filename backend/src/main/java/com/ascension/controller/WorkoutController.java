package com.ascension.controller;

import com.ascension.dto.*;
import com.ascension.service.WorkoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<WorkoutDTO>> getHistory(
            @AuthenticationPrincipal Jwt jwt,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "0") int page,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(workoutService.getWorkoutHistory(jwt.getClaimAsString("email"), page, size));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<WorkoutDTO>> getRecent(
            @AuthenticationPrincipal Jwt jwt,
            @org.springframework.web.bind.annotation.RequestParam Long since) {
        return ResponseEntity.ok(workoutService.getRecentWorkouts(jwt.getClaimAsString("email"), since));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutDTO> getDetail(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.getWorkoutDetail(jwt.getClaimAsString("email"), id));
    }

    @PostMapping
    public ResponseEntity<WorkoutDTO> saveWorkout(
            @RequestBody WorkoutDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.saveWorkout(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutDTO> updateWorkout(
            @PathVariable String id,
            @RequestBody WorkoutDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.updateWorkout(jwt.getClaimAsString("email"), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkout(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        workoutService.deleteWorkout(jwt.getClaimAsString("email"), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<WorkoutStatsDTO> getStats(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.getStats(jwt.getClaimAsString("email")));
    }

    @GetMapping("/exercise-history/{exerciseId}")
    public ResponseEntity<List<WorkoutExerciseDTO>> getExerciseHistory(
            @PathVariable String exerciseId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.getExerciseHistory(jwt.getClaimAsString("email"), exerciseId));
    }

    // --- Templates ---
    @GetMapping("/templates")
    public ResponseEntity<List<WorkoutTemplateDTO>> getTemplates(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.getTemplates(jwt.getClaimAsString("email")));
    }

    @PostMapping("/templates")
    public ResponseEntity<WorkoutTemplateDTO> saveTemplate(
            @RequestBody WorkoutTemplateDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.saveTemplate(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        workoutService.deleteTemplate(jwt.getClaimAsString("email"), id);
        return ResponseEntity.noContent().build();
    }

    // --- Custom Exercises ---
    @GetMapping("/custom-exercises")
    public ResponseEntity<List<CustomExerciseDTO>> getCustomExercises(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.getCustomExercises(jwt.getClaimAsString("email")));
    }

    @PostMapping("/custom-exercises")
    public ResponseEntity<CustomExerciseDTO> saveCustomExercise(
            @RequestBody CustomExerciseDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(workoutService.saveCustomExercise(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/custom-exercises/{id}")
    public ResponseEntity<Void> deleteCustomExercise(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        workoutService.deleteCustomExercise(jwt.getClaimAsString("email"), id);
        return ResponseEntity.noContent().build();
    }
}
