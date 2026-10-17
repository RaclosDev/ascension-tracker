package com.ascension.controller;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.WeekSummaryDTO;
import com.ascension.service.NutritionLogService;
import com.ascension.util.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.getWeeklyCalories(userEmail));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<FoodLogDTO>> getFoodLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.getFoodLogsByDate(userEmail, date));
    }

    @GetMapping("/logs/recent")
    public ResponseEntity<List<FoodLogDTO>> getRecentFoodLogs(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.getRecentDistinctFoods(userEmail));
    }

    @PostMapping("/logs")
    public ResponseEntity<FoodLogDTO> addFoodLog(@Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.addFoodLog(userEmail, dto));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        nutritionLogService.deleteFoodLog(userEmail, id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<FoodLogDTO> updateFoodLog(@PathVariable Long id, @Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        dto.setId(id);
        return ResponseEntity.ok(nutritionLogService.updateFoodLog(userEmail, dto));
    }

    @GetMapping("/my-foods")
    public ResponseEntity<List<SavedFoodDTO>> getSavedFoods(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.getSavedFoods(userEmail));
    }

    @PostMapping("/my-foods")
    public ResponseEntity<SavedFoodDTO> addSavedFood(@Valid @RequestBody SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(nutritionLogService.addSavedFood(userEmail, dto));
    }

    @PutMapping("/my-foods/{id}")
    public ResponseEntity<SavedFoodDTO> updateSavedFood(@PathVariable Long id, @Valid @RequestBody SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        dto.setId(id);
        return ResponseEntity.ok(nutritionLogService.updateSavedFood(userEmail, dto));
    }

    @DeleteMapping("/my-foods/{id}")
    public ResponseEntity<Void> deleteSavedFood(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = SecurityUtils.extractEmail(jwt);
        if (userEmail == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        nutritionLogService.deleteSavedFood(userEmail, id);
        return ResponseEntity.ok().build();
    }
}
