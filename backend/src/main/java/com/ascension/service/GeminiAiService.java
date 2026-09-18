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

    @Value("${GEMINI_API_KEY:}")
    private String geminiApiKey;

    @Value("${GEMINI_MODEL:}")
    private String geminiModel;

    private final NutritionService nutritionService;
    private RestTemplate restTemplate;
    @PostConstruct
    public void init() {
        this.restTemplate = builder.setConnectTimeout(Duration.ofSeconds(5)).setReadTimeout(Duration.ofSeconds(25)).build();
    }

    private final RestTemplateBuilder builder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile String cachedWorkingUrl = null;
    private volatile List<String> cachedModelCandidates = null;

    private String executeGeminiPrompt(String prompt) {
        return executeGeminiPrompt(prompt, null, null);
    }

    private String executeGeminiPrompt(String prompt, String base64Image, String mimeType) {
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }

        String apiKey = geminiApiKey.trim();

        // 1. Try cached working URL first (fastest path)
        if (cachedWorkingUrl != null) {
            try {
                return cleanJsonResponse(callApiEndpoint(cachedWorkingUrl, prompt, base64Image, mimeType));
            } catch (Exception e) {
                cachedWorkingUrl = null; // Invalidate on failure
            }
        }

        // 2. Build model candidates (cached after first discovery)
        List<String> modelCandidates;
        if (cachedModelCandidates != null) {
            modelCandidates = cachedModelCandidates;
        } else {
            modelCandidates = discoverModels(apiKey);
            cachedModelCandidates = modelCandidates;
        }

        // 3. Try candidates (only v1beta since that's what Google uses)
        Exception lastException = null;
        for (String modelName : modelCandidates) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
            try {
                String responseText = callApiEndpoint(url, prompt, base64Image, mimeType);
                cachedWorkingUrl = url;
                return cleanJsonResponse(responseText);
            } catch (Exception e) {
                lastException = e;
            }
        }

        // 4. Last resort: invalidate cache and retry discovery
        cachedModelCandidates = null;
        modelCandidates = discoverModels(apiKey);
        cachedModelCandidates = modelCandidates;
        for (String modelName : modelCandidates) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
            try {
                String responseText = callApiEndpoint(url, prompt, base64Image, mimeType);
                cachedWorkingUrl = url;
                return cleanJsonResponse(responseText);
            } catch (Exception e) {
                lastException = e;
            }
        }

        throw new RuntimeException("No working Gemini model endpoint found. Last error: " + (lastException != null ? lastException.getMessage() : "Unknown"));
    }

    private List<String> discoverModels(String apiKey) {
        List<String> candidates = new ArrayList<>();

        // User-specified model takes priority
        if (geminiModel != null && !geminiModel.trim().isEmpty()) {
            candidates.add(geminiModel.trim());
        }

        // Query ListModels API
        try {
            String listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
            ResponseEntity<String> listResp = restTemplate.getForEntity(listUrl, String.class);
            if (listResp.getStatusCode().is2xxSuccessful() && listResp.getBody() != null) {
                JsonNode root = objectMapper.readTree(listResp.getBody());
                JsonNode modelsNode = root.path("models");
                // Prefer flash models (fastest), then pro
                List<String> flash = new ArrayList<>();
                List<String> other = new ArrayList<>();
                if (modelsNode.isArray()) {
                    for (JsonNode mNode : modelsNode) {
                        String name = mNode.path("name").asText();
                        JsonNode methods = mNode.path("supportedGenerationMethods");
                        boolean supportsGen = false;
                        if (methods.isArray()) {
                            for (JsonNode meth : methods) {
                                if ("generateContent".equals(meth.asText())) { supportsGen = true; break; }
                            }
                        }
                        if (supportsGen && name.startsWith("models/")) {
                            String modelName = name.substring("models/".length());
                            if (!candidates.contains(modelName)) {
                                if (modelName.contains("flash")) flash.add(modelName);
                                else other.add(modelName);
                            }
                        }
                    }
                }
                candidates.addAll(flash);
                candidates.addAll(other);
            }
        } catch (Exception e) { log.warn("Exception ignored during model discovery", e); }

        // Hardcoded fallbacks
        for (String d : List.of("gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash")) {
            if (!candidates.contains(d)) candidates.add(d);
        }

        return candidates;
    }

    private String callApiEndpoint(String url, String prompt) throws Exception {
        return callApiEndpoint(url, prompt, null, null);
    }

    private String callApiEndpoint(String url, String prompt, String base64Image, String mimeType) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        
        List<Map<String, Object>> partsList = new ArrayList<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        partsList.add(textPart);

        if (base64Image != null && mimeType != null) {
            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", mimeType);
            inlineData.put("data", base64Image);
            
            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("inline_data", inlineData);
            partsList.add(imagePart);
        }

        Map<String, Object> content = new HashMap<>();
        content.put("parts", partsList);

        requestBody.put("contents", List.of(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("response_mime_type", "application/json");
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        JsonNode rootNode = objectMapper.readTree(response.getBody());
        String responseText = rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();

        return cleanJsonResponse(responseText);
    }

    private String cleanJsonResponse(String responseText) {
        if (responseText == null) return "";
        String text = responseText.trim();

        if (text.startsWith("```json")) {
            text = text.substring(7).trim();
        } else if (text.startsWith("```")) {
            text = text.substring(3).trim();
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3).trim();
        }

        int firstBrace = text.indexOf('{');
        int firstBracket = text.indexOf('[');

        int startIdx = -1;
        if (firstBrace != -1 && firstBracket != -1) {
            startIdx = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            startIdx = firstBrace;
        } else if (firstBracket != -1) {
            startIdx = firstBracket;
        }

        int lastBrace = text.lastIndexOf('}');
        int lastBracket = text.lastIndexOf(']');
        int endIdx = Math.max(lastBrace, lastBracket);

        if (startIdx != -1 && endIdx != -1 && endIdx >= startIdx) {
            text = text.substring(startIdx, endIdx + 1).trim();
        }

        return text;
    }

    public List<FoodLogDTO> processNaturalLanguageLog(String userEmail, String text, String base64Image, int defaultMealIndex, LocalDate date) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }

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
                    return "\"" + f.getName() + "\"" + (f.getBrand() != null && !f.getBrand().isEmpty() ? " (" + f.getBrand() + ")" : "") +
                           " [" + f.getKcalPer100g() + " kcal, " + f.getProteinPer100g() + "g P, " + f.getCarbsPer100g() + "g C, " + f.getFatPer100g() + "g F per 100g" + serving + "]";
                })
                .reduce((a, b) -> a + "; " + b)
                .orElse("None");

        String contextRecipes = recipes.stream()
                .map(r -> "\"" + r.getName() + "\" [" + r.getTotalKcal() + " kcal, " + r.getTotalProtein() + "g P, " + r.getTotalCarbs() + "g C, " + r.getTotalFat() + "g F total]")
                .reduce((a, b) -> a + "; " + b)
                .orElse("None");

        String defaultMealDesc = (defaultMealIndex >= 0 && defaultMealIndex < availableMeals.size())
                ? "index " + defaultMealIndex + " (\"" + availableMeals.get(defaultMealIndex).getName() + "\")"
                : "NONE (automatic distribution across all meals)";

        String prompt = "You are an expert nutritionist AI API for a food tracking app.\n" +
                "The user describes what they ate (this could be a single meal or multiple meals / their entire day):\n" +
                "\"" + text + "\"\n\n" +
                (base64Image != null && !base64Image.isEmpty() ? "USER ATTACHED AN IMAGE: Identify the food in the image, estimate its weight/grams, and use it as the primary log entry.\n\n" : "") +
                "CONFIGURED MEALS IN THE APP (assign each food to an integer 'mealIndex'):\n" +
                mealsContext.toString() + "\n" +
                "Default meal requested: " + defaultMealDesc + ".\n\n" +
                "CRITICAL: The user has these SAVED FOODS (macros per 100g). You MUST use these when the user's text matches (even partially). Use their EXACT macros, do NOT estimate:\n" + contextFoods + "\n\n" +
                "The user also has these SAVED RECIPES (macros per entire recipe):\n" + contextRecipes + "\n\n" +
                "RULES FOR FOODS & MACROS:\n" +
                "1. ALWAYS match against saved foods/recipes FIRST. Even partial matches count (e.g. user says 'natillas lidl' and saved food is 'Natillas Proteína Chocolate' with brand 'Lidl' -> USE IT).\n" +
                "2. When a saved food has a serving size (e.g. serving=125g/envase), use that as the default quantity if the user says '1 natilla' or just mentions the food without specifying grams.\n" +
                "3. Use the EXACT name from the saved food as the product name.\n" +
                "4. For foods NOT in the saved list, estimate macros from standard databases (USDA). Use a short, clean Spanish product name.\n" +
                "5. Quantity must always be in grams.\n" +
                "6. IMPORTANT: All macros must be based on the RAW/UNCOOKED weight of the food (en crudo). For example, if the user says '200g of rice', the macros should be for 200g of raw rice, not cooked rice.\n\n" +
                "RULES FOR MEAL ASSIGNMENT ('mealIndex'):\n" +
                "7. MULTI-MEAL / FULL DAY DETECTION: If the user describes foods for different times of day (e.g. 'desayuno / para desayunar', 'comida / almuerzo / a mediodía', 'merienda / por la tarde', 'cena / para cenar', 'snack / picoteo'), assign each item to its corresponding mealIndex according to the CONFIGURED MEALS list above.\n" +
                "8. EXPLICIT MEAL MENTION: If the text indicates that a food belongs to a specific meal (e.g. 'para cenar una tortilla...'), ALWAYS use that meal's index, overriding any default meal.\n" +
                "9. SINGLE MEAL WITH DEFAULT: If the user describes foods without specifying any meal, and a valid default meal was requested (" + (defaultMealIndex >= 0 ? "index " + defaultMealIndex : "none") + "), use that mealIndex for all items.\n" +
                "10. AUTO-ROUTING IF NO DEFAULT: If default meal is NONE and no meal is specified in text, classify each food into the most logical mealIndex based on common dietary habits (e.g. eggs/toast/coffee/cereals -> Desayuno, meat/pasta/rice/legumes -> Comida, salad/fish/light soup -> Cena, fruits/protein bar/shake/nuts -> Snacks).\n\n" +
                "OUTPUT FORMAT: Return STRICTLY a valid JSON array of objects (no markdown, no extra text):\n" +
                "[{\"mealIndex\": 0, \"product\": \"Food Name\", \"quantity\": 200, \"kcal\": 300.5, \"protein\": 25.0, \"carbs\": 30.0, \"fat\": 10.0}]";

        try {
            String responseText;
            if (base64Image != null && !base64Image.isEmpty()) {
                responseText = executeGeminiPrompt(prompt, base64Image, "image/jpeg");
            } else {
                responseText = executeGeminiPrompt(prompt);
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
                    
                    // Add it to the database
                    FoodLogDTO saved = nutritionService.addFoodLog(userEmail, dto);
                    addedLogs.add(saved);
                }
            }

            return addedLogs;

        } catch (Exception e) {
            log.error("Error in GeminiAiService", e);
            throw new RuntimeException("Failed to process with AI: " + e.getMessage());
        }
    }

    public SavedFoodDTO processNaturalLanguageFood(String userEmail, String text) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }

        String prompt = "You are an AI nutritionist API. The user wants to create a custom saved food based on this text: \"" + text + "\".\n\n" +
                "Your task is to identify the name of the food, the brand (if mentioned), and estimate its macros per 100g of RAW/UNCOOKED product (en crudo) based on standard nutritional databases. " +
                "IMPORTANT: Always provide macros for the raw/uncooked version. For example, rice macros should be for dry raw rice, not cooked rice. Chicken macros should be for raw chicken, not cooked.\n" +
                "If it's a known branded product, use its real macros. If the user specifies the macros in the text (e.g. 'tiene 20g de proteina y 100 kcal por 100g'), USE THOSE VALUES strictly.\n\n" +
                "ALSO determine if the product has a standard serving/unit size (e.g. a yogurt cup is 125g, a protein bar is 60g, a can of tuna is 80g). " +
                "If yes, include servingSize (grams per unit) and servingLabel (e.g. 'envase', 'unidad', 'lata', 'barrita'). If not applicable, set both to null.\n\n" +
                "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                "{\"name\": \"Food Name\", \"brand\": \"Brand or empty string\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";

        try {
            String responseText = executeGeminiPrompt(prompt);

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
            throw new RuntimeException("Failed to process food with AI: " + e.getMessage());
        }
    }

    public Map<String, Object> processNutritionalLabel(String userEmail, MultipartFile file) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }
        try {
            String base64Image = java.util.Base64.getEncoder().encodeToString(file.getBytes());
            String mimeType = file.getContentType();

            String prompt = "You are an AI nutritionist API. The user uploaded an image of a nutritional label. " +
                            "Extract the nutritional information per 100g (or per 100ml). " +
                            "IMPORTANT: You MUST return a JSON object with the exact keys: 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'. " +
                            "If you can read the product name or brand, include 'name' and 'brand' as well. " +
                            "If you see a serving size (e.g. 1 envase = 125g), include 'servingSize' (in grams) and 'servingLabel'. " +
                            "If any value is missing or unreadable, default to 0 for macros and null/empty string for text.\n\n" +
                            "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                            "{\"name\": \"Food Name\", \"brand\": \"Brand\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";

            String responseText = executeGeminiPrompt(prompt, base64Image, mimeType);
            
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
            throw new RuntimeException("Failed to process nutritional label: " + e.getMessage());
        }
    }

    public Map<String, Object> generateMealAssistantResponse(
            String userEmail,
            String promptText,
            String base64Image,
            LocalDate date,
            Integer targetMealIndex,
            List<Map<String, String>> chatHistory) {
        if (geminiApiKey == null || geminiApiKey.isEmpty()) {
            throw new RuntimeException("GEMINI_API_KEY is not configured.");
        }

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
                "\"" + promptText + "\"\n\n" +
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
                responseText = executeGeminiPrompt(prompt, base64Image, "image/jpeg");
            } else {
                responseText = executeGeminiPrompt(prompt);
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
            throw new RuntimeException("Error en asistente de IA: " + e.getMessage());
        }
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}

