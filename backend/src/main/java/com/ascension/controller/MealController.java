package com.ascension.controller;

import com.ascension.dto.MealDTO;
import com.ascension.service.NutritionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/nutrition/meals")
@RequiredArgsConstructor
public class MealController {

    private final NutritionService nutritionService;

    @GetMapping
    public ResponseEntity<List<MealDTO>> getMeals(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.getMeals(userEmail));
    }

    @PutMapping
    public ResponseEntity<List<MealDTO>> updateMeals(@Valid @RequestBody List<MealDTO> meals, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.updateMeals(meals, userEmail));
    }

    @PostMapping
    public ResponseEntity<MealDTO> addMeal(@Valid @RequestBody MealDTO meal, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.addMeal(meal, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMeal(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        nutritionService.deleteMeal(id, userEmail);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset")
    public ResponseEntity<List<MealDTO>> resetDefaultMeals(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.resetDefaultMeals(userEmail));
    }
}
