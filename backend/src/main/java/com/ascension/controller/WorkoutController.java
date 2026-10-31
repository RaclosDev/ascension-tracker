package com.ascension.controller;

import com.ascension.dto.*;
import com.ascension.service.CustomExerciseService;
import com.ascension.service.WorkoutService;
import com.ascension.service.WorkoutTemplateService;
import com.ascension.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/workouts")
@RequiredArgsConstructor
public class WorkoutController {

    private final WorkoutService workoutService;
    private final WorkoutTemplateService workoutTemplateService;
    private final CustomExerciseService customExerciseService;

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<WorkoutDTO>> getHistory(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "La página debe ser mayor o igual a 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "El tamaño de página debe ser al menos 1") @Max(value = 100, message = "El tamaño de página no puede exceder 100") int size) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.getWorkoutHistory(userEmail, page, size));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<WorkoutDTO>> getRecent(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam @Min(value = 0, message = "El parámetro 'since' no puede ser negativo") Long since) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.getRecentWorkouts(userEmail, since));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkoutDTO> getDetail(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.getWorkoutDetail(userEmail, id));
    }

    @PostMapping
    public ResponseEntity<WorkoutDTO> saveWorkout(
            @Valid @RequestBody WorkoutDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.saveWorkout(userEmail, dto));
    }

    @PostMapping("/import")
    public ResponseEntity<WorkoutImportSummaryDTO> importWorkouts(
            @Valid @RequestBody WorkoutImportRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.importWorkouts(userEmail, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkoutDTO> updateWorkout(
            @PathVariable String id,
            @Valid @RequestBody WorkoutDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.updateWorkout(userEmail, id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkout(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        workoutService.deleteWorkout(userEmail, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<WorkoutStatsDTO> getStats(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.getStats(userEmail));
    }

    @GetMapping("/exercise-history/{exerciseId}")
    public ResponseEntity<List<WorkoutExerciseDTO>> getExerciseHistory(
            @PathVariable String exerciseId,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutService.getExerciseHistory(userEmail, exerciseId));
    }

    @GetMapping("/templates")
    public ResponseEntity<List<WorkoutTemplateDTO>> getTemplates(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutTemplateService.getTemplates(userEmail));
    }

    @PostMapping("/templates")
    public ResponseEntity<WorkoutTemplateDTO> saveTemplate(
            @Valid @RequestBody WorkoutTemplateDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(workoutTemplateService.saveTemplate(userEmail, dto));
    }

    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        workoutTemplateService.deleteTemplate(userEmail, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/custom-exercises")
    public ResponseEntity<List<CustomExerciseDTO>> getCustomExercises(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(customExerciseService.getCustomExercises(userEmail));
    }

    @PostMapping("/custom-exercises")
    public ResponseEntity<CustomExerciseDTO> saveCustomExercise(
            @Valid @RequestBody CustomExerciseDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(customExerciseService.saveCustomExercise(userEmail, dto));
    }

    @PutMapping("/custom-exercises/{id}")
    public ResponseEntity<CustomExerciseDTO> updateCustomExercise(
            @PathVariable String id,
            @Valid @RequestBody CustomExerciseDTO dto,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(customExerciseService.updateCustomExercise(userEmail, id, dto));
    }

    @DeleteMapping("/custom-exercises/{id}")
    public ResponseEntity<Void> deleteCustomExercise(
            @PathVariable String id,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        customExerciseService.deleteCustomExercise(userEmail, id);
        return ResponseEntity.noContent().build();
    }
}
