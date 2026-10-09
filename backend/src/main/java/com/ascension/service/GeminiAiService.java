package com.ascension.service;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.MacrosDTO;
import com.ascension.dto.MealDTO;
import com.ascension.dto.RecipeDTO;
import com.ascension.dto.SavedFoodDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import org.springframework.web.client.RestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import java.time.Duration;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class GeminiAiService {
    

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);
    
    private final com.ascension.service.ai.GeminiApiClient apiClient;

    private final NutritionService nutritionService;
    

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_USER_INPUT_LENGTH = 2000;

    /**
     * Sanitize user input before embedding in AI prompts to mitigate prompt injection.
     */
    private String sanitizeUserInput(String input) {
        if (input == null) return "";
        String sanitized = input.trim();
        if (sanitized.length() > MAX_USER_INPUT_LENGTH) {
            sanitized = sanitized.substring(0, MAX_USER_INPUT_LENGTH);
        }
        // Escape quotes to prevent prompt structure breakout
        sanitized = sanitized.replace("\\", "\\\\").replace("\"", "'");
        // Strip patterns that look like system/prompt override attempts
        sanitized = sanitized.replaceAll("(?i)(IGNORE|OVERRIDE|FORGET|DISREGARD)\\s+(ALL|PREVIOUS|ABOVE|PRIOR)\\s+(INSTRUCTIONS?|RULES?|PROMPTS?)", "[filtered]");
        return sanitized;
    }


    
    public String getActiveModelName() {
        return apiClient.getActiveModelName();
    }

    public List<FoodLogDTO> processNaturalLanguageLog(String userEmail, String text, String base64Image, int defaultMealIndex, LocalDate date) {
        

        // Fetch user's custom foods, recipes, and meals for context
        List<SavedFoodDTO> savedFoods = nutritionService.getSavedFoods(userEmail);
        List<RecipeDTO> recipes = nutritionService.getRecipes(userEmail);
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
                    String exactName = f.getName() + (f.getBrand() != null && !f.getBrand().equalsIgnoreCase("Genérico") && !f.getBrand().isEmpty() ? " (" + f.getBrand() + ")" : "");
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

        String prompt = buildFoodLogPrompt(text, base64Image, mealsContext, defaultMealDesc, contextFoods.toString(), contextRecipes.toString(), defaultMealIndex);

        try {
            String responseText;
            if (base64Image != null && !base64Image.isEmpty()) {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64Image);
                String mimeType = validateAndGetMimeType(decoded);
                responseText = apiClient.executePrompt(prompt, base64Image, mimeType);
            } else {
                responseText = apiClient.executePrompt(prompt);
            }

            JsonNode arrayNode = objectMapper.readTree(responseText);
            List<FoodLogDTO> addedLogs = new ArrayList<>();

            if (arrayNode.isArray()) {
                for (JsonNode node : arrayNode) {
                    FoodLogDTO dto = new FoodLogDTO();
                    
                    int assignedMeal = defaultMealIndex >= 0 ? defaultMealIndex : 0;
                    if (node.has("mealIndex") && !node.path("mealIndex").isNull()) {
                        int candidate = node.path("mealIndex").asInt(-1);
                        if (candidate >= 0 && candidate < availableMeals.size()) {
                            assignedMeal = candidate;
                        }
                    }
                    
                    dto.setMealIndex(assignedMeal);
                    dto.setDate(date);
                    dto.setProduct(node.path("product").asText());
                    dto.setQuantity(node.path("quantity").asDouble());
                    dto.setKcal(node.path("kcal").asDouble());
                    dto.setProtein(node.path("protein").asDouble());
                    dto.setCarbs(node.path("carbs").asDouble());
                    dto.setFat(node.path("fat").asDouble());

                    // Reconstruct portionsJson if it matches a SavedFood exactly
                    String pName = dto.getProduct();
                    for (SavedFoodDTO sf : savedFoods) {
                        String exactName = sf.getName() + (sf.getBrand() != null && !sf.getBrand().equalsIgnoreCase("Genérico") && !sf.getBrand().isEmpty() ? " (" + sf.getBrand() + ")" : "");
                        if (exactName.equalsIgnoreCase(pName) && sf.getServingSize() != null && sf.getServingSize() > 0) {
                            String lbl = sf.getServingLabel() != null && !sf.getServingLabel().isEmpty() ? sf.getServingLabel() : "ud";
                            double sz = sf.getServingSize();
                            List<Map<String, Object>> portions = new ArrayList<>();
                            
                            if (lbl.equalsIgnoreCase("g")) {
                                portions.add(Map.of("label", "50g", "amount", 50));
                                portions.add(Map.of("label", "100g", "amount", 100));
                                portions.add(Map.of("label", "150g", "amount", 150));
                                portions.add(Map.of("label", "200g", "amount", 200));
                                portions.add(Map.of("label", "250g", "amount", 250));
                            } else {
                                if (sz <= 15) {
                                    portions.add(Map.of("label", "1 " + lbl, "amount", sz));
                                    portions.add(Map.of("label", "2 " + lbl, "amount", sz * 2));
                                    portions.add(Map.of("label", "3 " + lbl, "amount", sz * 3));
                                    portions.add(Map.of("label", "5 " + lbl, "amount", sz * 5));
                                    portions.add(Map.of("label", "10 " + lbl, "amount", sz * 10));
                                    portions.add(Map.of("label", "15 " + lbl, "amount", sz * 15));
                                } else if (sz <= 50) {
                                    portions.add(Map.of("label", "1 " + lbl, "amount", sz));
                                    portions.add(Map.of("label", "2 " + lbl, "amount", sz * 2));
                                    portions.add(Map.of("label", "3 " + lbl, "amount", sz * 3));
                                    portions.add(Map.of("label", "4 " + lbl, "amount", sz * 4));
                                    portions.add(Map.of("label", "5 " + lbl, "amount", sz * 5));
                                } else {
                                    portions.add(Map.of("label", "0.5 " + lbl, "amount", sz / 2.0));
                                    portions.add(Map.of("label", "1 " + lbl, "amount", sz));
                                    portions.add(Map.of("label", "2 " + lbl, "amount", sz * 2));
                                    portions.add(Map.of("label", "3 " + lbl, "amount", sz * 3));
                                    portions.add(Map.of("label", "4 " + lbl, "amount", sz * 4));
                                }
                            }
                            dto.setPortionsJson(objectMapper.writeValueAsString(portions));
                            break;
                        }
                    }
                    
                    // Add it to the database
                    FoodLogDTO saved = nutritionService.addFoodLog(userEmail, dto);
                    addedLogs.add(saved);
                }
            }

            return addedLogs;

        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new RuntimeException("Failed to process with AI");
        }
    }

    public SavedFoodDTO processNaturalLanguageFood(String userEmail, String text) {
        

        String prompt = buildSavedFoodPrompt(text);

        try {
            String responseText = apiClient.executePrompt(prompt);

            JsonNode node = objectMapper.readTree(responseText);
            
            SavedFoodDTO dto = new SavedFoodDTO();
            dto.setName(node.path("name").asText());
            dto.setBrand(node.path("brand").asText());
            dto.setKcalPer100g(node.path("kcalPer100g").asDouble());
            dto.setProteinPer100g(node.path("proteinPer100g").asDouble());
            dto.setCarbsPer100g(node.path("carbsPer100g").asDouble());
            dto.setFatPer100g(node.path("fatPer100g").asDouble());
            if (node.has("servingSize") && !node.path("servingSize").isNull()) {
                dto.setServingSize(node.path("servingSize").asDouble());
            }
            if (node.has("servingLabel") && !node.path("servingLabel").isNull() && !node.path("servingLabel").asText().isEmpty()) {
                dto.setServingLabel(node.path("servingLabel").asText());
            }
            
            // Add it to the database
            return nutritionService.addSavedFood(userEmail, dto);

        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new RuntimeException("Failed to process food with AI");
        }
    }

    public Map<String, Object> processNutritionalLabel(String userEmail, MultipartFile file) {
        
        try {
            byte[] fileBytes = file.getBytes();
            String mimeType = validateAndGetMimeType(fileBytes);
            String base64Image = java.util.Base64.getEncoder().encodeToString(fileBytes);

            String prompt = buildSavedFoodFromImagePrompt();

            String responseText = apiClient.executePrompt(prompt, base64Image, mimeType);
            
            JsonNode node = objectMapper.readTree(responseText);
            
            Map<String, Object> result = new HashMap<>();
            result.put("name", node.path("name").asText(""));
            result.put("brand", node.path("brand").asText(""));
            result.put("kcalPer100g", node.path("kcalPer100g").asDouble(0.0));
            result.put("proteinPer100g", node.path("proteinPer100g").asDouble(0.0));
            result.put("carbsPer100g", node.path("carbsPer100g").asDouble(0.0));
            result.put("fatPer100g", node.path("fatPer100g").asDouble(0.0));
            if (node.has("servingSize") && !node.path("servingSize").isNull()) {
                result.put("servingSize", node.path("servingSize").asDouble());
            }
            if (node.has("servingLabel") && !node.path("servingLabel").isNull()) {
                result.put("servingLabel", node.path("servingLabel").asText());
            }

            return result;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new RuntimeException("Failed to process nutritional label");
        }
    }

    public Map<String, Object> generateMealAssistantResponse(
            String userEmail,
            String promptText,
            String base64Image,
            LocalDate date,
            Integer targetMealIndex,
            List<Map<String, String>> chatHistory) {
        

        // 1. Get targets
        MacrosDTO targetMacros = nutritionService.getMacros(userEmail);
        int targetKcal = targetMacros.getKcal() != null ? targetMacros.getKcal() : 2000;
        double targetProtein = targetMacros.getProtein() != null ? targetMacros.getProtein() : 150.0;
        double targetCarbs = targetMacros.getCarbs() != null ? targetMacros.getCarbs() : 200.0;
        double targetFat = targetMacros.getFat() != null ? targetMacros.getFat() : 60.0;

        // 2. Get today's consumed
        List<FoodLogDTO> todayLogs = nutritionService.getFoodLogsByDate(userEmail, date);
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
        List<SavedFoodDTO> savedFoods = nutritionService.getSavedFoods(userEmail);
        List<RecipeDTO> recipes = nutritionService.getRecipes(userEmail);

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

        String prompt = "You are Ascension AI Nutrition & Macro Strategist, an elite performance nutrition and dietetics consultant.\n" +
                "The user is asking you for strategic meal planning and macro advice to hit their daily goals.\n\n" +
                "DAILY MACRO TARGETS:\n" +
                "- Total Target: " + targetKcal + " kcal | " + targetProtein + "g Protein | " + targetCarbs + "g Carbs | " + targetFat + "g Fat\n" +
                "- Consumed Today: " + Math.round(consumedKcal) + " kcal | " + round1(consumedProtein) + "g P | " + round1(consumedCarbs) + "g C | " + round1(consumedFat) + "g F\n" +
                "- REMAINING BUDGET TODAY: " + Math.round(remKcal) + " kcal | " + remProtein + "g Protein | " + remCarbs + "g Carbs | " + remFat + "g Fat\n\n" +
                "CONFIGURED MEALS IN THE APP:\n" +
                mealsContext.toString() + "\n" +
                "Default Meal suggested: index " + resolvedMealIndex + " (\"" + resolvedMealName + "\")\n\n" +
                "USER'S SAVED FOODS:\n" +
                contextFoods + "\n\n" +
                "USER'S SAVED RECIPES:\n" +
                contextRecipes + "\n\n" +
                historyContext.toString() +
                "USER REQUEST:\n" +
                "\"" + sanitizeUserInput(promptText) + "\"\n\n" +
                (base64Image != null && !base64Image.isEmpty() ? "USER ATTACHED AN IMAGE: Identify the food/label in the image, estimate its weight/macros if asked, and use it as the primary component of your meal options if applicable.\n\n" : "") +
                "CRITICAL INSTRUCTIONS:\n" +
                "1. NUTRITIONAL COACHING OVER COOKING: In 'reply', provide an expert, complete, and insightful nutritional breakdown in SPANISH. Explain the strategy behind the macros (satiety, muscle protein synthesis, glycemic impact, nocturnal digestion, micronutrients). DO NOT write lengthy cooking recipes or step-by-step culinary instructions.\n" +
                "2. MULTIPLE VARIED OPTIONS (CRITICAL): Provide 2 to 3 DISTINCT meal options in 'mealOptions' so the user has real flexibility:\n" +
                "   - Option 1 (Favoritos): Prioritize foods from user's saved foods list.\n" +
                "   - Option 2 (Rápida / Práctica): Using common accessible pantry staples (eggs, tuna, wraps, cottage cheese, rice bowls, etc.) ready in < 10 mins.\n" +
                "   - Option 3 (Alternativa Fresca / Diferente): Diverse protein source (white fish, salmon, tofu, Greek yogurt bowl, turkey/chicken, legumes) with fresh veggies.\n" +
                "   - Do NOT restrict yourself only to saved foods; offer varied, healthy alternatives that fit the remaining budget.\n" +
                "   - Calculate exact grams and macros for RAW/UNCOOKED weight (en crudo).\n" +
                "3. If general chat without meal request, return empty 'mealOptions' and answer conversationally.\n\n" +
                "4. NO EMOJIS: Do NOT use any emojis in your reply or in the meal options.\n\nOUTPUT FORMAT: Return STRICTLY a valid JSON object (no markdown, no extra text):\n" +
                "{\n" +
                "  \"reply\": \"Análisis nutricional estratégico y completo en español...\",\n" +
                "  \"mealOptions\": [\n" +
                "    {\n" +
                "      \"id\": \"opt-1\",\n" +
                "      \"title\": \"Opción 1: Clásica con tus Favoritos\",\n" +
                "      \"description\": \"Alta saciedad aprovechando tus alimentos habituales.\",\n" +
                "      \"mealIndex\": " + resolvedMealIndex + ",\n" +
                "      \"mealName\": \"" + resolvedMealName + "\",\n" +
                "      \"suggestedFoods\": [\n" +
                "        {\n" +
                "          \"product\": \"Pechuga de pollo\",\n" +
                "          \"quantity\": 180,\n" +
                "          \"kcal\": 216.0,\n" +
                "          \"protein\": 41.4,\n" +
                "          \"carbs\": 0.0,\n" +
                "          \"fat\": 4.5,\n" +
                "          \"mealIndex\": " + resolvedMealIndex + "\n" +
                "        }\n" +
                "      ],\n" +
                "      \"totalMacros\": { \"kcal\": 216, \"protein\": 41.4, \"carbs\": 0.0, \"fat\": 4.5 }\n" +
                "    }\n" +
                "  ]\n" +
                "}";

        try {
            String responseText;
            if (base64Image != null && !base64Image.isEmpty()) {
                byte[] decoded = java.util.Base64.getDecoder().decode(base64Image);
                String mimeType = validateAndGetMimeType(decoded);
                responseText = apiClient.executePrompt(prompt, base64Image, mimeType);
            } else {
                responseText = apiClient.executePrompt(prompt);
            }
            JsonNode rootNode = objectMapper.readTree(responseText);

            String reply = rootNode.path("reply").asText("Aquí tienes las mejores opciones adaptadas a tus macros.");
            List<Map<String, Object>> parsedOptions = new ArrayList<>();

            JsonNode optionsNode = rootNode.path("mealOptions");
            if (optionsNode.isArray() && optionsNode.size() > 0) {
                for (int i = 0; i < optionsNode.size(); i++) {
                    JsonNode oNode = optionsNode.get(i);
                    String optId = oNode.path("id").asText("opt-" + (i + 1));
                    String optTitle = oNode.path("title").asText("Opción " + (i + 1));
                    String optDesc = oNode.path("description").asText("");
                    int mIdx = oNode.path("mealIndex").asInt(resolvedMealIndex);
                    String mName = oNode.path("mealName").asText(resolvedMealName);

                    List<FoodLogDTO> optFoods = new ArrayList<>();
                    double optKcal = 0, optP = 0, optC = 0, optF = 0;

                    JsonNode fArray = oNode.path("suggestedFoods");
                    if (fArray.isArray()) {
                        for (JsonNode fNode : fArray) {
                            FoodLogDTO dto = new FoodLogDTO();
                            dto.setDate(date);
                            dto.setMealIndex(mIdx);
                            dto.setProduct(fNode.path("product").asText());
                            dto.setQuantity(fNode.path("quantity").asDouble(100.0));
                            dto.setKcal(fNode.path("kcal").asDouble(0.0));
                            dto.setProtein(fNode.path("protein").asDouble(0.0));
                            dto.setCarbs(fNode.path("carbs").asDouble(0.0));
                            dto.setFat(fNode.path("fat").asDouble(0.0));

                            optKcal += dto.getKcal();
                            optP += dto.getProtein();
                            optC += dto.getCarbs();
                            optF += dto.getFat();

                            optFoods.add(dto);
                        }
                    }

                    Map<String, Object> optionMap = new HashMap<>();
                    optionMap.put("id", optId);
                    optionMap.put("title", optTitle);
                    optionMap.put("description", optDesc);
                    optionMap.put("mealIndex", mIdx);
                    optionMap.put("mealName", mName);
                    optionMap.put("suggestedFoods", optFoods);
                    optionMap.put("totalMacros", Map.of(
                            "kcal", Math.round(optKcal),
                            "protein", round1(optP),
                            "carbs", round1(optC),
                            "fat", round1(optF)
                    ));

                    parsedOptions.add(optionMap);
                }
            } else if (rootNode.has("suggestedFoods") && rootNode.path("suggestedFoods").isArray()) {
                // Fallback for single option output
                int mIdx = rootNode.path("mealIndex").asInt(resolvedMealIndex);
                String mName = rootNode.path("mealName").asText(resolvedMealName);
                List<FoodLogDTO> optFoods = new ArrayList<>();
                double optKcal = 0, optP = 0, optC = 0, optF = 0;

                for (JsonNode fNode : rootNode.path("suggestedFoods")) {
                    FoodLogDTO dto = new FoodLogDTO();
                    dto.setDate(date);
                    dto.setMealIndex(mIdx);
                    dto.setProduct(fNode.path("product").asText());
                    dto.setQuantity(fNode.path("quantity").asDouble(100.0));
                    dto.setKcal(fNode.path("kcal").asDouble(0.0));
                    dto.setProtein(fNode.path("protein").asDouble(0.0));
                    dto.setCarbs(fNode.path("carbs").asDouble(0.0));
                    dto.setFat(fNode.path("fat").asDouble(0.0));

                    optKcal += dto.getKcal();
                    optP += dto.getProtein();
                    optC += dto.getCarbs();
                    optF += dto.getFat();

                    optFoods.add(dto);
                }

                if (!optFoods.isEmpty()) {
                    Map<String, Object> singleOpt = new HashMap<>();
                    singleOpt.put("id", "opt-1");
                    singleOpt.put("title", "Opción Recomendada");
                    singleOpt.put("description", "Adaptada a tus macros restantes.");
                    singleOpt.put("mealIndex", mIdx);
                    singleOpt.put("mealName", mName);
                    singleOpt.put("suggestedFoods", optFoods);
                    singleOpt.put("totalMacros", Map.of(
                            "kcal", Math.round(optKcal),
                            "protein", round1(optP),
                            "carbs", round1(optC),
                            "fat", round1(optF)
                    ));
                    parsedOptions.add(singleOpt);
                }
            }

            // Provide first option's foods as default for backward compatibility
            List<FoodLogDTO> defaultFoods = !parsedOptions.isEmpty() 
                    ? (List<FoodLogDTO>) parsedOptions.get(0).get("suggestedFoods") 
                    : List.of();
            Map<String, Object> defaultTotals = !parsedOptions.isEmpty() 
                    ? (Map<String, Object>) parsedOptions.get(0).get("totalMacros") 
                    : Map.of("kcal", 0, "protein", 0.0, "carbs", 0.0, "fat", 0.0);

            Map<String, Object> result = new HashMap<>();
            result.put("reply", reply);
            result.put("mealOptions", parsedOptions);
            result.put("mealIndex", !parsedOptions.isEmpty() ? parsedOptions.get(0).get("mealIndex") : resolvedMealIndex);
            result.put("mealName", !parsedOptions.isEmpty() ? parsedOptions.get(0).get("mealName") : resolvedMealName);
            result.put("suggestedFoods", defaultFoods);
            result.put("totalMacros", defaultTotals);
            result.put("remainingBudget", Map.of(
                    "kcal", Math.round(remKcal),
                    "protein", remProtein,
                    "carbs", remCarbs,
                    "fat", remFat
            ));
            result.put("targetMacros", Map.of(
                    "kcal", targetKcal,
                    "protein", targetProtein,
                    "carbs", targetCarbs,
                    "fat", targetFat
            ));
            result.put("consumedToday", Map.of(
                    "kcal", Math.round(consumedKcal),
                    "protein", round1(consumedProtein),
                    "carbs", round1(consumedCarbs),
                    "fat", round1(consumedFat)
            ));

            return result;
        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new RuntimeException("Error en asistente de IA");
        }
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }


    private String buildFoodLogPrompt(String text, String base64Image, StringBuilder mealsContext, String defaultMealDesc, String contextFoods, String contextRecipes, int defaultMealIndex) {
        return "You are an expert nutritionist AI API for a food tracking app.\n" +
                "The user describes what they ate (this could be a single meal or multiple meals / their entire day):\n" +
                "\"" + sanitizeUserInput(text) + "\"\n\n" +
                (base64Image != null && !base64Image.isEmpty() ? "USER ATTACHED AN IMAGE: Identify the food in the image, estimate its weight/grams, and use it as the primary log entry.\n\n" : "") +
                "CONFIGURED MEALS IN THE APP (assign each food to an integer 'mealIndex'):\n" +
                mealsContext.toString() + "\n" +
                "Default meal requested: " + defaultMealDesc + ".\n\n" +
                "CRITICAL: The user has these SAVED FOODS. You should prioritize these WHEN the user's text matches the specific food accurately. Use their EXACT macros:\n" + contextFoods + "\n\n" +
                "The user also has these SAVED RECIPES:\n" + contextRecipes + "\n\n" +
                "RULES FOR FOODS & MACROS:\n" +
                "1. SAVED FOODS MATCHING RULES:\n" +
                "   - STRICT MATCHING REQUIRED: Only match a saved food if the user's input clearly refers to the same specific product, cut, or preparation.\n" +
                "   - ALLOWED FLEXIBILITY: Match if the user just omits the brand or uses an abbreviation (e.g., user says 'natillas proteina' -> match 'Natillas Proteína Chocolate (Lidl)').\n" +
                "   - DO NOT MATCH DIFFERENT CUTS OR PREPARATIONS: This is CRITICAL. 'Pechuga de pollo' IS DIFFERENT from 'Pollo asado deshuesado'. 'Lomo de cerdo' (fresh meat) IS DIFFERENT from 'Lomo embuchado' (cured charcuterie). 'Atún al natural' IS DIFFERENT from 'Atún en aceite'. If the preparation, state (raw vs cured), or cut differs, DO NOT match the saved food.\n" +
                "   - DO NOT MATCH CONTRADICTING FLAVORS: If user asks for 'Fresa' but saved food is 'Vainilla', do not match.\n" +
                "   - STRICT BRAND MATCHING: If the user explicitly mentions a brand (e.g. 'Alipende', 'Danone'), DO NOT match it with a saved food from a completely different brand (e.g. 'Lidl', 'Hacendado'). Estimate from general knowledge instead.\n" +
                "   - NO HALLUCINATIONS: Do not guess or substitute items. If they ask for 2 items, output exactly 2 items. Do not duplicate items to fill space.\n" +
                "   - If no valid match is found among saved foods, estimate macros from standard databases instead.\n" +
                "2. When a matched saved food has a serving size (e.g. serving=125g/envase), use that as the default quantity if the user says '1 natilla' or just mentions the food without specifying grams.\n" +
                "3. CRITICAL: Use the EXACT_NAME exactly as it appears in brackets as the product name. DO NOT append quantities (like '4 unidades') to the product name. The name must remain pure.\n" +
                "4. For foods NOT in the saved list, estimate macros from standard databases (USDA). Use a short, clean Spanish product name without quantities in the name.\n" +
                "5. Quantity must always be in grams. Example: if user says 5 galletas and serving=10g, quantity is 50. DO NOT put '5 galletas' in the product name.\n" +
                "6. IMPORTANT: All macros must be based on the RAW/UNCOOKED weight of the food (en crudo).\n\n" +
                "RULES FOR MEAL ASSIGNMENT ('mealIndex'):\n" +
                "7. MULTI-MEAL / FULL DAY DETECTION: If the user describes foods for different times of day (e.g. 'desayuno / para desayunar', 'comida / almuerzo / a mediodía', 'merienda / por la tarde', 'cena / para cenar', 'snack / picoteo'), assign each item to its corresponding mealIndex according to the CONFIGURED MEALS list above.\n" +
                "8. EXPLICIT MEAL MENTION: If the text indicates that a food belongs to a specific meal (e.g. 'para cenar una tortilla...'), ALWAYS use that meal's index, overriding any default meal.\n" +
                "9. SINGLE MEAL WITH DEFAULT: If the user describes foods without specifying any meal, and a valid default meal was requested (" + (defaultMealIndex >= 0 ? "index " + defaultMealIndex : "none") + "), use that mealIndex for all items.\n" +
                "10. AUTO-ROUTING IF NO DEFAULT: If default meal is NONE and no meal is specified in text, classify each food into the most logical mealIndex based on common dietary habits (e.g. eggs/toast/coffee/cereals -> Desayuno, meat/pasta/rice/legumes -> Comida, salad/fish/light soup -> Cena, fruits/protein bar/shake/nuts -> Snacks).\n\n" +
                "OUTPUT FORMAT: Return STRICTLY a valid JSON array of objects (no markdown, no extra text):\n" +
                "[{\"mealIndex\": 0, \"product\": \"Food Name\", \"quantity\": 200, \"kcal\": 300.5, \"protein\": 25.0, \"carbs\": 30.0, \"fat\": 10.0}]";
    }








    private String buildSavedFoodPrompt(String text) {
        return "You are an AI nutritionist API. The user wants to create a custom saved food based on this text: \"" + sanitizeUserInput(text) + "\".\n\n" +
                "Your task is to identify the name of the food, the brand (if mentioned), and estimate its macros per 100g of RAW/UNCOOKED product (en crudo) based on standard nutritional databases. " +
                "IMPORTANT: Always provide macros for the raw/uncooked version. For example, rice macros should be for dry raw rice, not cooked rice. Chicken macros should be for raw chicken, not cooked.\n" +
                "If it's a known branded product, use its real macros. If the user specifies the macros in the text (e.g. 'tiene 20g de proteina y 100 kcal por 100g'), USE THOSE VALUES strictly.\n\n" +
                "ALSO determine if the product has a standard serving/unit size (e.g. a yogurt cup is 125g, a protein bar is 60g, a can of tuna is 80g). " +
                "If yes, include servingSize (grams per unit) and servingLabel (e.g. 'envase', 'unidad', 'lata', 'barrita'). If not applicable, set both to null.\n\n" +
                "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                "{\"name\": \"Food Name\", \"brand\": \"Brand or empty string\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";
    }


    private String buildSavedFoodFromImagePrompt() {
        return "You are an AI nutritionist API. The user uploaded an image of a nutritional label. " +
                "Extract the nutritional information per 100g (or per 100ml). " +
                "IMPORTANT: You MUST return a JSON object with the exact keys: 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'. " +
                "If you can read the product name or brand, include 'name' and 'brand' as well. " +
                "If you see a serving size (e.g. 1 envase = 125g), include 'servingSize' (in grams) and 'servingLabel'. " +
                "If any value is missing or unreadable, default to 0 for macros and null/empty string for text.\n\n" +
                "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                "{\"name\": \"Food Name\", \"brand\": \"Brand\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";
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
