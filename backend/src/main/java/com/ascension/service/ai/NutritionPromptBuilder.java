package com.ascension.service.ai;

import org.springframework.stereotype.Component;

@Component
public class NutritionPromptBuilder {

    public static final int MAX_USER_INPUT_LENGTH = 2000;

    /**
     * Sanitizes user-controlled input before embedding it into AI prompts.
     * Strips control characters and line breaks, normalizes whitespace, escapes quotes,
     * and truncates to the maximum allowed length.
     *
     * NOTE: Regex filtering of 'IGNORE ALL...' or similar override patterns is NOT a complete
     * or reliable defense against prompt injection and MUST NOT be solely relied upon.
     * Structural data boundaries (such as XML-style delimiters like &lt;user_data&gt; ... &lt;/user_data&gt;)
     * combined with input sanitization provide proper structural encapsulation.
     */
    public String sanitizeUserInput(String input) {
        if (input == null) return "";
        // 1. Remove control characters (ASCII 0x00-0x1F except none, plus 0x7F) and newlines/carriage returns
        String sanitized = input.replaceAll("[\\x00-\\x1F\\x7F\\r\\n]", " ");
        // 2. Collapse multiple whitespace into a single space
        sanitized = sanitized.replaceAll("\\s+", " ").trim();
        // 3. Truncate
        if (sanitized.length() > MAX_USER_INPUT_LENGTH) {
            sanitized = sanitized.substring(0, MAX_USER_INPUT_LENGTH);
        }
        // 4. Escape quotes & backslashes
        sanitized = sanitized.replace("\\", "\\\\").replace("\"", "'");
        // 5. Escape structural XML delimiter characters < and > to prevent tag breakout
        sanitized = sanitized.replace("<", "&lt;").replace(">", "&gt;");
        // 6. Heuristic pattern filter (retained for defense-in-depth, but not relied upon)
        sanitized = sanitized.replaceAll("(?i)(IGNORE|OVERRIDE|FORGET|DISREGARD)(\\s+(ALL|PREVIOUS|ABOVE|PRIOR))+\\s+(INSTRUCTIONS?|RULES?|PROMPTS?)", "[filtered]");
        return sanitized;
    }

    public String buildFoodLogPrompt(String text, String base64Image, StringBuilder mealsContext, String defaultMealDesc, String contextFoods, String contextRecipes, int defaultMealIndex) {
        return buildFoodLogPrompt(text, base64Image, mealsContext != null ? mealsContext.toString() : "", defaultMealDesc, contextFoods, contextRecipes, defaultMealIndex);
    }

    public String buildFoodLogPrompt(String text, String base64Image, String mealsContext, String defaultMealDesc, String contextFoods, String contextRecipes, int defaultMealIndex) {
        return "You are an expert nutritionist AI API for a food tracking app.\n" +
                "The user describes what they ate (this could be a single meal or multiple meals / their entire day) delimited within data tags:\n" +
                "<user_data>" + sanitizeUserInput(text) + "</user_data>\n\n" +
                (base64Image != null && !base64Image.isEmpty() ? "USER ATTACHED AN IMAGE: Identify the food in the image, estimate its weight/grams, and use it as the primary log entry.\n\n" : "") +
                "CONFIGURED MEALS IN THE APP (assign each food to an integer 'mealIndex'):\n" +
                mealsContext + "\n" +
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

    public String buildSavedFoodPrompt(String text) {
        return "You are an AI nutritionist API. The user wants to create a custom saved food based on this user input delimited within data tags:\n" +
                "<user_data>" + sanitizeUserInput(text) + "</user_data>\n\n" +
                "Your task is to identify the name of the food, the brand (if mentioned), and estimate its macros per 100g of RAW/UNCOOKED product (en crudo) based on standard nutritional databases. " +
                "IMPORTANT: Always provide macros for the raw/uncooked version. For example, rice macros should be for dry raw rice, not cooked rice. Chicken macros should be for raw chicken, not cooked.\n" +
                "If it's a known branded product, use its real macros. If the user specifies the macros in the text (e.g. 'tiene 20g de proteina y 100 kcal por 100g'), USE THOSE VALUES strictly.\n\n" +
                "ALSO determine if the product has a standard serving/unit size (e.g. a yogurt cup is 125g, a protein bar is 60g, a can of tuna is 80g). " +
                "If yes, include servingSize (grams per unit) and servingLabel (e.g. 'envase', 'unidad', 'lata', 'barrita'). If not applicable, set both to null.\n\n" +
                "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                "{\"name\": \"Food Name\", \"brand\": \"Brand or empty string\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";
    }

    public String buildSavedFoodFromImagePrompt() {
        return "You are an AI nutritionist API. The user uploaded an image of a nutritional label. " +
                "Extract the nutritional information per 100g (or per 100ml). " +
                "IMPORTANT: You MUST return a JSON object with the exact keys: 'kcalPer100g', 'proteinPer100g', 'carbsPer100g', 'fatPer100g'. " +
                "If you can read the product name or brand, include 'name' and 'brand' as well. " +
                "If you see a serving size (e.g. 1 envase = 125g), include 'servingSize' (in grams) and 'servingLabel'. " +
                "If any value is missing or unreadable, default to 0 for macros and null/empty string for text.\n\n" +
                "OUTPUT STRICTLY THIS JSON (no markdown, no extra text):\n" +
                "{\"name\": \"Food Name\", \"brand\": \"Brand\", \"kcalPer100g\": 300.5, \"proteinPer100g\": 25.0, \"carbsPer100g\": 30.0, \"fatPer100g\": 10.0, \"servingSize\": 125, \"servingLabel\": \"envase\"}";
    }

    public String buildMealAssistantPrompt(
            int targetKcal, double targetProtein, double targetCarbs, double targetFat,
            double consumedKcal, double consumedProtein, double consumedCarbs, double consumedFat,
            double remKcal, double remProtein, double remCarbs, double remFat,
            String mealsContext, int resolvedMealIndex, String resolvedMealName,
            String contextFoods, String contextRecipes, String historyContext,
            String promptText, String base64Image) {

        return "You are Ascension AI Nutrition & Macro Strategist, an elite performance nutrition and dietetics consultant.\n" +
                "The user is asking you for strategic meal planning and macro advice to hit their daily goals.\n\n" +
                "DAILY MACRO TARGETS:\n" +
                "- Total Target: " + targetKcal + " kcal | " + targetProtein + "g Protein | " + targetCarbs + "g Carbs | " + targetFat + "g Fat\n" +
                "- Consumed Today: " + Math.round(consumedKcal) + " kcal | " + round1(consumedProtein) + "g P | " + round1(consumedCarbs) + "g C | " + round1(consumedFat) + "g F\n" +
                "- REMAINING BUDGET TODAY: " + Math.round(remKcal) + " kcal | " + remProtein + "g Protein | " + remCarbs + "g Carbs | " + remFat + "g Fat\n\n" +
                "CONFIGURED MEALS IN THE APP:\n" +
                mealsContext + "\n" +
                "Default Meal suggested: index " + resolvedMealIndex + " (\"" + sanitizeUserInput(resolvedMealName) + "\")\n\n" +
                "USER'S SAVED FOODS:\n" +
                contextFoods + "\n\n" +
                "USER'S SAVED RECIPES:\n" +
                contextRecipes + "\n\n" +
                historyContext +
                "USER REQUEST:\n" +
                "<user_data>" + sanitizeUserInput(promptText) + "</user_data>\n\n" +
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
                "      \"mealName\": \"" + sanitizeUserInput(resolvedMealName) + "\",\n" +
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
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
