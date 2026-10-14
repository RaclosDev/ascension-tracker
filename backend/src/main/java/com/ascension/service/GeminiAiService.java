package com.ascension.service;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.MacrosDTO;
import com.ascension.dto.MealDTO;
import com.ascension.dto.RecipeDTO;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.service.ai.AiJsonParser;
import com.ascension.service.ai.GeminiApiClient;
import com.ascension.service.ai.NutritionPromptBuilder;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    private final GeminiApiClient apiClient;
    private final NutritionService nutritionService;
    private final NutritionLogService nutritionLogService;
    private final RecipeService recipeService;
    private final MacroCalculatorService macroCalculatorService;
    private final NutritionPromptBuilder promptBuilder;
    private final AiJsonParser jsonParser;

    public String getActiveModelName() {
        return apiClient.getActiveModelName();
    }

    public List<FoodLogDTO> processNaturalLanguageLog(String userEmail, String text, String base64Image, int defaultMealIndex, LocalDate date) {
        // Fetch user's custom foods, recipes, and meals for context
        List<SavedFoodDTO> savedFoods = nutritionLogService.getSavedFoods(userEmail);
        List<RecipeDTO> recipes = recipeService.getRecipes(userEmail);
        List<MealDTO> availableMeals = nutritionService.getMeals(userEmail);

        StringBuilder mealsContext = new StringBuilder();
        for (int i = 0; i < availableMeals.size(); i++) {
            MealDTO m = availableMeals.get(i);
            mealsContext.append("- index ").append(i).append(": \"").append(m.getName()).append("\"\n");
        }

        String contextFoods = savedFoods.stream()
                .map(f -> {
                    String serving = "";
                    if (f.getServingSize() != null && f.getServingSize() > 0) {
                        serving = ", serving=" + f.getServingSize() + "g/" + (f.getServingLabel() != null ? f.getServingLabel() : "unidad");
                    }
                    String exactName = f.getName() + (f.getBrand() != null && !f.getBrand().equalsIgnoreCase("Genérico") && !f.getBrand().equalsIgnoreCase("Generico") && !f.getBrand().isEmpty() ? " (" + f.getBrand() + ")" : "");
                    return "[EXACT_NAME: \"" + exactName + "\"] -> [" + f.getKcalPer100g() + " kcal, " + f.getProteinPer100g() + "g P, " + f.getCarbsPer100g() + "g C, " + f.getFatPer100g() + "g F per 100g" + serving + "]";
                })
                .reduce((a, b) -> a + ";\n" + b)
                .orElse("None");

        String contextRecipes = recipes.stream()
                .map(r -> "[EXACT_NAME: \"" + r.getName() + " (Receta)\"] -> [" + r.getTotalKcal() + " kcal, " + r.getTotalProtein() + "g P, " + r.getTotalCarbs() + "g C, " + r.getTotalFat() + "g F total]")
                .reduce((a, b) -> a + ";\n" + b)
                .orElse("None");

        String defaultMealDesc = (defaultMealIndex >= 0 && defaultMealIndex < availableMeals.size())
                ? "index " + defaultMealIndex + " (\"" + availableMeals.get(defaultMealIndex).getName() + "\")"
                : "NONE (automatic distribution across all meals)";

        String prompt = promptBuilder.buildFoodLogPrompt(text, base64Image, mealsContext, defaultMealDesc, contextFoods, contextRecipes, defaultMealIndex);

        try {
            String responseText;
            if (base64Image != null && !base64Image.isEmpty()) {
                String cleanBase64 = base64Image.contains(",") ? base64Image.substring(base64Image.indexOf(",") + 1) : base64Image;
                byte[] decoded = Base64.getDecoder().decode(cleanBase64);
                String mimeType = validateAndGetMimeType(decoded);
                responseText = apiClient.executePrompt(prompt, cleanBase64, mimeType);
            } else {
                responseText = apiClient.executePrompt(prompt);
            }

            List<FoodLogDTO> parsedLogs = jsonParser.parseFoodLogs(responseText, defaultMealIndex, availableMeals.size(), date, savedFoods);
            List<FoodLogDTO> addedLogs = new ArrayList<>();
            for (FoodLogDTO dto : parsedLogs) {
                FoodLogDTO saved = nutritionLogService.addFoodLog(userEmail, dto);
                addedLogs.add(saved);
            }
            return addedLogs;

        } catch (com.ascension.exception.ExternalApiException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new com.ascension.exception.AiProcessingException("Failed to process with AI", e);
        }
    }

    public SavedFoodDTO processNaturalLanguageFood(String userEmail, String text) {
        String prompt = promptBuilder.buildSavedFoodPrompt(text);

        try {
            String responseText = apiClient.executePrompt(prompt);
            SavedFoodDTO dto = jsonParser.parseSavedFood(responseText);
            return nutritionLogService.addSavedFood(userEmail, dto);

        } catch (com.ascension.exception.ExternalApiException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new com.ascension.exception.AiProcessingException("Failed to process food with AI", e);
        }
    }

    public Map<String, Object> processNutritionalLabel(String userEmail, MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();
            String mimeType = validateAndGetMimeType(fileBytes);
            String base64Image = Base64.getEncoder().encodeToString(fileBytes);

            String prompt = promptBuilder.buildSavedFoodFromImagePrompt();
            String responseText = apiClient.executePrompt(prompt, base64Image, mimeType);

            return jsonParser.parseNutritionalLabel(responseText);
        } catch (com.ascension.exception.ExternalApiException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new com.ascension.exception.AiProcessingException("Failed to process nutritional label", e);
        }
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generateMealAssistantResponse(
            String userEmail,
            String promptText,
            String base64Image,
            LocalDate date,
            Integer targetMealIndex,
            List<Map<String, String>> chatHistory) {

        // 1. Get targets
        MacrosDTO targetMacros = macroCalculatorService.getMacros(userEmail);
        int targetKcal = targetMacros.getKcal() != null ? targetMacros.getKcal() : 2000;
        double targetProtein = targetMacros.getProtein() != null ? targetMacros.getProtein() : 150.0;
        double targetCarbs = targetMacros.getCarbs() != null ? targetMacros.getCarbs() : 200.0;
        double targetFat = targetMacros.getFat() != null ? targetMacros.getFat() : 60.0;

        // 2. Get today's consumed
        List<FoodLogDTO> todayLogs = nutritionLogService.getFoodLogsByDate(userEmail, date);
        double consumedKcal = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
        for (FoodLogDTO l : todayLogs) {
            consumedKcal += l.getKcal();
            consumedProtein += l.getProtein();
            consumedCarbs += l.getCarbs();
            consumedFat += l.getFat();
        }

        // 3. Compute remaining
        double remKcal = targetKcal - consumedKcal;
        double remProtein = Math.round((targetProtein - consumedProtein) * 10.0) / 10.0;
        double remCarbs = Math.round((targetCarbs - consumedCarbs) * 10.0) / 10.0;
        double remFat = Math.round((targetFat - consumedFat) * 10.0) / 10.0;

        // 4. Meals context
        List<MealDTO> availableMeals = nutritionService.getMeals(userEmail);
        StringBuilder mealsContext = new StringBuilder();
        int resolvedMealIndex = -1;
        String resolvedMealName = "Cena";
        for (int i = 0; i < availableMeals.size(); i++) {
            MealDTO m = availableMeals.get(i);
            mealsContext.append("- index ").append(i).append(": \"").append(m.getName()).append("\"\n");
            if (m.getName().toLowerCase().contains("cena") && resolvedMealIndex == -1) {
                resolvedMealIndex = i;
                resolvedMealName = m.getName();
            }
        }
        if (targetMealIndex != null && targetMealIndex >= 0 && targetMealIndex < availableMeals.size()) {
            resolvedMealIndex = targetMealIndex;
            resolvedMealName = availableMeals.get(targetMealIndex).getName();
        } else if (resolvedMealIndex == -1 && !availableMeals.isEmpty()) {
            resolvedMealIndex = Math.min(2, availableMeals.size() - 1);
            resolvedMealName = availableMeals.get(resolvedMealIndex).getName();
        }

        // 5. User saved foods and recipes
        List<SavedFoodDTO> savedFoods = nutritionLogService.getSavedFoods(userEmail);
        List<RecipeDTO> recipes = recipeService.getRecipes(userEmail);

        String contextFoods = savedFoods.stream()
                .map(f -> {
                    String serving = "";
                    if (f.getServingSize() != null && f.getServingSize() > 0) {
                        serving = ", serving=" + f.getServingSize() + "g/" + (f.getServingLabel() != null ? f.getServingLabel() : "unidad");
                    }
                    return "\"" + f.getName() + "\"" + (f.getBrand() != null && !f.getBrand().isEmpty() ? " (" + f.getBrand() + ")" : "") +
                            " [" + f.getKcalPer100g() + " kcal, " + f.getProteinPer100g() + "g P, " + f.getCarbsPer100g() + "g C, " + f.getFatPer100g() + "g F per 100g" + serving + "]";
                })
                .reduce((a, b) -> a + "; " + b)
                .orElse("None");

        String contextRecipes = recipes.stream()
                .map(r -> "\"" + r.getName() + "\" [" + r.getTotalKcal() + " kcal, " + r.getTotalProtein() + "g P, " + r.getTotalCarbs() + "g C, " + r.getTotalFat() + "g F total]")
                .reduce((a, b) -> a + "; " + b)
                .orElse("None");

        // 6. Chat History (if any)
        StringBuilder historyContext = new StringBuilder();
        if (chatHistory != null && !chatHistory.isEmpty()) {
            historyContext.append("PREVIOUS CONVERSATION HISTORY:\n");
            for (Map<String, String> turn : chatHistory) {
                String role = turn.get("role");
                String content = turn.get("content");
                if (role != null && content != null) {
                    historyContext.append(role.toUpperCase()).append(": ").append(content).append("\n");
                }
            }
            historyContext.append("\n");
        }

        String prompt = promptBuilder.buildMealAssistantPrompt(
                targetKcal, targetProtein, targetCarbs, targetFat,
                consumedKcal, consumedProtein, consumedCarbs, consumedFat,
                remKcal, remProtein, remCarbs, remFat,
                mealsContext.toString(), resolvedMealIndex, resolvedMealName,
                contextFoods, contextRecipes, historyContext.toString(),
                promptText, base64Image
        );

        try {
            String responseText;
            if (base64Image != null && !base64Image.isEmpty()) {
                String cleanBase64 = base64Image.contains(",") ? base64Image.substring(base64Image.indexOf(",") + 1) : base64Image;
                byte[] decoded = Base64.getDecoder().decode(cleanBase64);
                String mimeType = validateAndGetMimeType(decoded);
                responseText = apiClient.executePrompt(prompt, cleanBase64, mimeType);
            } else {
                responseText = apiClient.executePrompt(prompt);
            }

            return jsonParser.parseMealAssistantResponse(
                    responseText, date, resolvedMealIndex, resolvedMealName,
                    remKcal, remProtein, remCarbs, remFat,
                    targetKcal, targetProtein, targetCarbs, targetFat,
                    consumedKcal, consumedProtein, consumedCarbs, consumedFat
            );
        } catch (com.ascension.exception.ExternalApiException | IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new com.ascension.exception.AiProcessingException("Error en asistente de IA", e);
        }
    }

    private String validateAndGetMimeType(byte[] data) {
        if (data == null || data.length < 12) {
            throw new IllegalArgumentException("Invalid image file: missing or too small");
        }
        boolean isJpeg = data[0] == (byte) 0xFF && data[1] == (byte) 0xD8 && data[2] == (byte) 0xFF;
        boolean isPng = data[0] == (byte) 0x89 && data[1] == (byte) 0x50 && data[2] == (byte) 0x4E && data[3] == (byte) 0x47;
        boolean isWebp = data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F' &&
                         data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';

        if (!isJpeg && !isPng && !isWebp) {
            throw new IllegalArgumentException("Unsupported image format. Only JPEG, PNG, and WEBP are allowed.");
        }

        if (isJpeg || isPng) {
            try {
                java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(data));
                if (img == null) {
                    throw new IllegalArgumentException("Corrupt image data: structure is invalid");
                }
            } catch (Exception e) {
                throw new IllegalArgumentException("Corrupt image data: " + e.getMessage());
            }
            return isJpeg ? "image/jpeg" : "image/png";
        }

        return "image/webp";
    }
}
