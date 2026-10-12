package com.ascension.controller;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.service.NutritionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class FoodLogController {

    private final NutritionLogService nutritionLogService;

    @GetMapping("/calories/weekly")
    public ResponseEntity<List<WeekSummaryDTO>> getWeeklyCalories(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.getWeeklyCalories(jwt.getClaimAsString("email")));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<FoodLogDTO>> getFoodLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.getFoodLogsByDate(jwt.getClaimAsString("email"), date));
    }

    @GetMapping("/logs/recent")
    public ResponseEntity<List<FoodLogDTO>> getRecentFoodLogs(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.getRecentDistinctFoods(jwt.getClaimAsString("email")));
    }

    @PostMapping("/logs")
    public ResponseEntity<FoodLogDTO> addFoodLog(@Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.addFoodLog(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionLogService.deleteFoodLog(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<FoodLogDTO> updateFoodLog(@PathVariable Long id, @Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionLogService.updateFoodLog(jwt.getClaimAsString("email"), dto));
    }

    @GetMapping("/my-foods")
    public ResponseEntity<List<SavedFoodDTO>> getSavedFoods(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.getSavedFoods(jwt.getClaimAsString("email")));
    }

    @PostMapping("/my-foods")
    public ResponseEntity<SavedFoodDTO> addSavedFood(@Valid @RequestBody SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionLogService.addSavedFood(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/my-foods/{id}")
    public ResponseEntity<SavedFoodDTO> updateSavedFood(@PathVariable Long id, @Valid @RequestBody SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionLogService.updateSavedFood(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/my-foods/{id}")
    public ResponseEntity<Void> deleteSavedFood(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionLogService.deleteSavedFood(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }
}
