package com.ascension.controller;

import com.ascension.dto.MacrosDTO;
import com.ascension.dto.MealDTO;
import com.ascension.service.GeminiAiService;
import com.ascension.service.NutritionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import com.ascension.dto.FoodLogDTO;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/api/nutrition")
@RequiredArgsConstructor
public class NutritionController {

    private final NutritionService nutritionService;
    private final GeminiAiService geminiAiService;

    @GetMapping("/macros")
    public ResponseEntity<MacrosDTO> getMacros(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getMacros(jwt.getClaimAsString("email")));
    }

    @GetMapping("/meals")
    public ResponseEntity<List<MealDTO>> getMeals(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.getMeals(userEmail));
    }

    @PutMapping("/meals")
    public ResponseEntity<List<MealDTO>> updateMeals(@RequestBody List<MealDTO> meals, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.updateMeals(meals, userEmail));
    }

    @PostMapping("/meals")
    public ResponseEntity<MealDTO> addMeal(@RequestBody MealDTO meal, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.addMeal(meal, userEmail));
    }

    @DeleteMapping("/meals/{id}")
    public ResponseEntity<Void> deleteMeal(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        nutritionService.deleteMeal(id, userEmail);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/meals/reset")
    public ResponseEntity<List<MealDTO>> resetDefaultMeals(@AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.resetDefaultMeals(userEmail));
    }

    @GetMapping("/calories/weekly")
    public ResponseEntity<List<com.ascension.dto.WeekSummaryDTO>> getWeeklyCalories(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getWeeklyCalories(jwt.getClaimAsString("email")));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<FoodLogDTO>> getFoodLogs(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getFoodLogsByDate(jwt.getClaimAsString("email"), date));
    }

    @GetMapping("/logs/recent")
    public ResponseEntity<List<FoodLogDTO>> getRecentFoodLogs(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getRecentDistinctFoods(jwt.getClaimAsString("email")));
    }

    @PostMapping("/logs")
    public ResponseEntity<FoodLogDTO> addFoodLog(@RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addFoodLog(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionService.deleteFoodLog(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<FoodLogDTO> updateFoodLog(@PathVariable Long id, @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionService.updateFoodLog(jwt.getClaimAsString("email"), dto));
    }

    // --- Saved Foods ---
    @GetMapping("/my-foods")
    public ResponseEntity<List<com.ascension.dto.SavedFoodDTO>> getSavedFoods(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getSavedFoods(jwt.getClaimAsString("email")));
    }

    @PostMapping("/my-foods")
    public ResponseEntity<com.ascension.dto.SavedFoodDTO> addSavedFood(@RequestBody com.ascension.dto.SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addSavedFood(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/my-foods/{id}")
    public ResponseEntity<com.ascension.dto.SavedFoodDTO> updateSavedFood(@PathVariable Long id, @RequestBody com.ascension.dto.SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionService.updateSavedFood(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/my-foods/{id}")
    public ResponseEntity<Void> deleteSavedFood(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionService.deleteSavedFood(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }

    // --- Recipes ---
    @GetMapping("/recipes")
    public ResponseEntity<List<com.ascension.dto.RecipeDTO>> getRecipes(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getRecipes(jwt.getClaimAsString("email")));
    }

    @PostMapping("/recipes")
    public ResponseEntity<com.ascension.dto.RecipeDTO> addRecipe(@RequestBody com.ascension.dto.RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addRecipe(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/recipes/{id}")
    public ResponseEntity<com.ascension.dto.RecipeDTO> updateRecipe(@PathVariable Long id, @RequestBody com.ascension.dto.RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionService.updateRecipe(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/recipes/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionService.deleteRecipe(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }
    // --- AI ---
    @PostMapping("/ai/ocr")
    public ResponseEntity<?> scanNutritionalLabel(
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            return ResponseEntity.ok(geminiAiService.processNutritionalLabel(jwt.getClaimAsString("email"), image));
        } catch (Exception e) {
            log.error("Nutrition endpoint error: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @PostMapping("/ai/log")
    public ResponseEntity<?> addFoodLogWithAi(
            @RequestBody Map<String, Object> payload, 
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String text = (String) payload.get("text");
            Number mealIndexNum = (Number) payload.get("mealIndex");
            int mealIndex = mealIndexNum != null ? mealIndexNum.intValue() : -1;
            LocalDate date = LocalDate.parse((String) payload.get("date"));
            String base64Image = (String) payload.get("base64Image");
            
            return ResponseEntity.ok(geminiAiService.processNaturalLanguageLog(jwt.getClaimAsString("email"), text, base64Image, mealIndex, date));
        } catch (Exception e) {
            log.error("Nutrition endpoint error: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @PostMapping("/ai/food")
    public ResponseEntity<?> addSavedFoodWithAi(
            @RequestBody Map<String, Object> payload, 
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String text = (String) payload.get("text");
            return ResponseEntity.ok(geminiAiService.processNaturalLanguageFood(jwt.getClaimAsString("email"), text));
        } catch (Exception e) {
            log.error("Nutrition endpoint error: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.badRequest().body(Map.of("error", msg));
        }
    }

    @GetMapping("/ai/assistant-summary")
    public ResponseEntity<?> getAssistantSummary(
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        MacrosDTO targetMacros = nutritionService.getMacros(userEmail);
        List<FoodLogDTO> logs = nutritionService.getFoodLogsByDate(userEmail, targetDate);

        double consumedKcal = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
        for (FoodLogDTO l : logs) {
            consumedKcal += l.getKcal();
            consumedProtein += l.getProtein();
            consumedCarbs += l.getCarbs();
            consumedFat += l.getFat();
        }

        int targetKcal = targetMacros.getKcal() != null ? targetMacros.getKcal() : 2000;
        double targetProtein = targetMacros.getProtein() != null ? targetMacros.getProtein() : 150.0;
        double targetCarbs = targetMacros.getCarbs() != null ? targetMacros.getCarbs() : 200.0;
        double targetFat = targetMacros.getFat() != null ? targetMacros.getFat() : 60.0;

        Map<String, Object> summary = new HashMap<>();
        summary.put("target", Map.of("kcal", targetKcal, "protein", targetProtein, "carbs", targetCarbs, "fat", targetFat));
        summary.put("consumed", Map.of("kcal", Math.round(consumedKcal), "protein", round1(consumedProtein), "carbs", round1(consumedCarbs), "fat", round1(consumedFat)));
        summary.put("remaining", Map.of(
                "kcal", Math.round(targetKcal - consumedKcal),
                "protein", round1(targetProtein - consumedProtein),
                "carbs", round1(targetCarbs - consumedCarbs),
                "fat", round1(targetFat - consumedFat)
        ));
        summary.put("date", targetDate.toString());
        summary.put("meals", nutritionService.getMeals(userEmail));

        return ResponseEntity.ok(summary);
    }

    @PostMapping("/ai/assistant-chat")
    public ResponseEntity<?> assistantChat(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userEmail = jwt.getClaimAsString("email");
            String message = (String) payload.get("message");
            String dateStr = (String) payload.get("date");
            LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
            Number mealIndexNum = (Number) payload.get("mealIndex");
            Integer mealIndex = mealIndexNum != null ? mealIndexNum.intValue() : null;
            List<Map<String, String>> chatHistory = (List<Map<String, String>>) payload.get("chatHistory");
            String base64Image = (String) payload.get("base64Image");

            return ResponseEntity.ok(geminiAiService.generateMealAssistantResponse(userEmail, message, base64Image, date, mealIndex, chatHistory));
        } catch (Exception e) {
            log.error("Nutrition endpoint error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error en asistente IA"));
        }
    }

    @PostMapping("/ai/assistant-apply")
    public ResponseEntity<?> applyAssistantFoods(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userEmail = jwt.getClaimAsString("email");
            LocalDate date = LocalDate.parse((String) payload.get("date"));
            Number mealIndexNum = (Number) payload.get("mealIndex");
            int mealIndex = mealIndexNum != null ? mealIndexNum.intValue() : 2;

            List<Map<String, Object>> foods = (List<Map<String, Object>>) payload.get("foods");
            List<FoodLogDTO> added = new ArrayList<>();
            if (foods != null) {
                for (Map<String, Object> f : foods) {
                    FoodLogDTO dto = new FoodLogDTO();
                    dto.setDate(date);
                    Number fMeal = (Number) f.get("mealIndex");
                    dto.setMealIndex(fMeal != null ? fMeal.intValue() : mealIndex);
                    dto.setProduct((String) f.get("product"));
                    dto.setQuantity(((Number) f.get("quantity")).doubleValue());
                    dto.setKcal(((Number) f.get("kcal")).doubleValue());
                    dto.setProtein(((Number) f.get("protein")).doubleValue());
                    dto.setCarbs(((Number) f.get("carbs")).doubleValue());
                    dto.setFat(((Number) f.get("fat")).doubleValue());
                    if (f.containsKey("portionsJson") && f.get("portionsJson") != null) {
                        dto.setPortionsJson((String) f.get("portionsJson"));
                    }

                    added.add(nutritionService.addFoodLog(userEmail, dto));
                }
            }
            return ResponseEntity.ok(added);
        } catch (Exception e) {
            log.error("Nutrition endpoint error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error guardando alimentos"));
        }
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}




