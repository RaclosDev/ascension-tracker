package com.ascension.controller;

import com.ascension.dto.MacrosDTO;
import com.ascension.dto.MealDTO;
import com.ascension.service.GeminiAiService;
import com.ascension.service.NutritionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
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
    public ResponseEntity<List<MealDTO>> updateMeals(@Valid @RequestBody List<MealDTO> meals, @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        return ResponseEntity.ok(nutritionService.updateMeals(meals, userEmail));
    }

    @PostMapping("/meals")
    public ResponseEntity<MealDTO> addMeal(@Valid @RequestBody MealDTO meal, @AuthenticationPrincipal Jwt jwt) {
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
    public ResponseEntity<FoodLogDTO> addFoodLog(@Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addFoodLog(jwt.getClaimAsString("email"), dto));
    }

    @DeleteMapping("/logs/{id}")
    public ResponseEntity<Void> deleteFoodLog(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        nutritionService.deleteFoodLog(jwt.getClaimAsString("email"), id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/logs/{id}")
    public ResponseEntity<FoodLogDTO> updateFoodLog(@PathVariable Long id, @Valid @RequestBody FoodLogDTO dto, @AuthenticationPrincipal Jwt jwt) {
        dto.setId(id);
        return ResponseEntity.ok(nutritionService.updateFoodLog(jwt.getClaimAsString("email"), dto));
    }

    // --- Saved Foods ---
    @GetMapping("/my-foods")
    public ResponseEntity<List<com.ascension.dto.SavedFoodDTO>> getSavedFoods(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.getSavedFoods(jwt.getClaimAsString("email")));
    }

    @PostMapping("/my-foods")
    public ResponseEntity<com.ascension.dto.SavedFoodDTO> addSavedFood(@Valid @RequestBody com.ascension.dto.SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addSavedFood(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/my-foods/{id}")
    public ResponseEntity<com.ascension.dto.SavedFoodDTO> updateSavedFood(@PathVariable Long id, @Valid @RequestBody com.ascension.dto.SavedFoodDTO dto, @AuthenticationPrincipal Jwt jwt) {
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
    public ResponseEntity<com.ascension.dto.RecipeDTO> addRecipe(@Valid @RequestBody com.ascension.dto.RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(nutritionService.addRecipe(jwt.getClaimAsString("email"), dto));
    }

    @PutMapping("/recipes/{id}")
    public ResponseEntity<com.ascension.dto.RecipeDTO> updateRecipe(@PathVariable Long id, @Valid @RequestBody com.ascension.dto.RecipeDTO dto, @AuthenticationPrincipal Jwt jwt) {
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
        if (image != null && image.getSize() > 4 * 1024 * 1024) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "La imagen no puede superar los 4 MB."));
        }
        try {
            var result = geminiAiService.processNutritionalLabel(jwt.getClaimAsString("email"), image);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
        } catch (Exception e) {
            log.error("Nutrition endpoint error", e);
            throw new com.ascension.exception.AiProcessingException("Error procesando la solicitud en la IA", e);
        }
    }

    @PostMapping("/ai/log")
    public ResponseEntity<?> addFoodLogWithAi(
            @Valid @RequestBody com.ascension.dto.AiLogRequestDTO request, 
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String text = request.getText();
            int mealIndex = request.getMealIndex() != null ? request.getMealIndex() : -1;
            LocalDate date = LocalDate.parse(request.getDate());
            String base64Image = request.getBase64Image();
            if (base64Image != null && base64Image.length() > 4 * 1024 * 1024 * 1.35) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE)
                        .body(Map.of("error", "La imagen no puede superar los 4 MB."));
            }
            
            var result = geminiAiService.processNaturalLanguageLog(jwt.getClaimAsString("email"), text, base64Image, mealIndex, date);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
        } catch (Exception e) {
            log.error("Nutrition endpoint error", e);
            throw new com.ascension.exception.AiProcessingException("Error procesando la solicitud en la IA", e);
        }
    }

    @PostMapping("/ai/food")
    public ResponseEntity<?> addSavedFoodWithAi(
            @Valid @RequestBody com.ascension.dto.AiFoodRequestDTO request, 
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String text = request.getText();
            var result = geminiAiService.processNaturalLanguageFood(jwt.getClaimAsString("email"), text);
            return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
        } catch (Exception e) {
            log.error("Nutrition endpoint error", e);
            throw new com.ascension.exception.AiProcessingException("Error procesando la solicitud en la IA", e);
        }
    }

    @GetMapping("/ai/assistant-summary")
    public ResponseEntity<?> getAssistantSummary(
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        return ResponseEntity.ok(nutritionService.getAssistantSummary(userEmail, targetDate));
    }

    @PostMapping("/ai/assistant-chat")
    public ResponseEntity<?> assistantChat(
            @Valid @RequestBody com.ascension.dto.AiChatRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userEmail = jwt.getClaimAsString("email");
            String message = request.getMessage();
            String dateStr = request.getDate();
            LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
            Integer mealIndex = request.getMealIndex();
            List<Map<String, String>> chatHistory = request.getChatHistory();
            String base64Image = request.getBase64Image();
            if (base64Image != null && base64Image.length() > 4 * 1024 * 1024 * 1.35) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE)
                        .body(Map.of("error", "La imagen no puede superar los 4 MB."));
            }

            return ResponseEntity.ok(geminiAiService.generateMealAssistantResponse(userEmail, message, base64Image, date, mealIndex, chatHistory));
        } catch (Exception e) {
            log.error("Nutrition endpoint error", e);
            throw new com.ascension.exception.AiProcessingException("Error en asistente IA", e);
        }
    }

    @PostMapping("/ai/assistant-apply")
    public ResponseEntity<?> applyAssistantFoods(
            @Valid @RequestBody com.ascension.dto.AiApplyRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String userEmail = jwt.getClaimAsString("email");
            LocalDate date = LocalDate.parse(request.getDate());
            int mealIndex = request.getMealIndex() != null ? request.getMealIndex() : 2;

            List<Map<String, Object>> foods = request.getFoods();
            
            return ResponseEntity.ok(nutritionService.applyAssistantFoods(userEmail, date, mealIndex, foods));
        } catch (Exception e) {
            log.error("Nutrition endpoint error", e);
            throw new com.ascension.exception.AiProcessingException("Error guardando alimentos", e);
        }
    }
}




