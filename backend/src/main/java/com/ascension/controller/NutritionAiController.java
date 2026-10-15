package com.ascension.controller;

import com.ascension.dto.AiApplyRequestDTO;
import com.ascension.dto.AiChatRequestDTO;
import com.ascension.dto.AiFoodRequestDTO;
import com.ascension.dto.AiLogRequestDTO;
import com.ascension.service.GeminiAiService;
import com.ascension.service.MacroCalculatorService;
import com.ascension.service.NutritionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/nutrition/ai")
@RequiredArgsConstructor
public class NutritionAiController {

    private final GeminiAiService geminiAiService;
    private final MacroCalculatorService macroCalculatorService;
    private final NutritionLogService nutritionLogService;

    @PostMapping("/ocr")
    public ResponseEntity<?> scanNutritionalLabel(
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal Jwt jwt) {
        var result = geminiAiService.processNutritionalLabel(jwt.getClaimAsString("email"), image);
        return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
    }

    @PostMapping("/log")
    public ResponseEntity<?> addFoodLogWithAi(
            @Valid @RequestBody AiLogRequestDTO request, 
            @AuthenticationPrincipal Jwt jwt) {
        String text = request.getText();
        int mealIndex = request.getMealIndex() != null ? request.getMealIndex() : -1;
        LocalDate date = LocalDate.parse(request.getDate());
        String base64Image = request.getBase64Image();
        
        var result = geminiAiService.processNaturalLanguageLog(jwt.getClaimAsString("email"), text, base64Image, mealIndex, date);
        return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
    }

    @PostMapping("/food")
    public ResponseEntity<?> addSavedFoodWithAi(
            @Valid @RequestBody AiFoodRequestDTO request, 
            @AuthenticationPrincipal Jwt jwt) {
        String text = request.getText();
        var result = geminiAiService.processNaturalLanguageFood(jwt.getClaimAsString("email"), text);
        return ResponseEntity.ok().header("X-AI-Model", geminiAiService.getActiveModelName()).body(result);
    }

    @GetMapping("/assistant-summary")
    public ResponseEntity<?> getAssistantSummary(
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(macroCalculatorService.getAssistantSummary(userEmail, targetDate));
    }

    @PostMapping("/assistant-chat")
    public ResponseEntity<?> assistantChat(
            @Valid @RequestBody AiChatRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        String message = request.getMessage();
        String dateStr = request.getDate();
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();
        Integer mealIndex = request.getMealIndex();
        List<AiChatRequestDTO.ChatMessageDTO> chatHistory = request.getChatHistory();
        String base64Image = request.getBase64Image();

        return ResponseEntity.ok(geminiAiService.generateMealAssistantResponse(userEmail, message, base64Image, date, mealIndex, chatHistory));
    }

    @PostMapping("/assistant-apply")
    public ResponseEntity<?> applyAssistantFoods(
            @Valid @RequestBody AiApplyRequestDTO request,
            @AuthenticationPrincipal Jwt jwt) {
        String userEmail = jwt.getClaimAsString("email");
        LocalDate date = LocalDate.parse(request.getDate());
        int mealIndex = request.getMealIndex() != null ? request.getMealIndex() : 2;

        List<AiApplyRequestDTO.AppliedFoodItemDTO> foods = request.getFoods();
        return ResponseEntity.ok(nutritionLogService.applyAssistantFoods(userEmail, date, mealIndex, foods));
    }
}
