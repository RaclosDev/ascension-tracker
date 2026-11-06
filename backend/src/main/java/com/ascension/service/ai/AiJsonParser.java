package com.ascension.service.ai;

import com.ascension.dto.AiDtos.MacroTotals;
import com.ascension.dto.AiDtos.MealAssistantResponse;
import com.ascension.dto.AiDtos.MealOption;
import com.ascension.dto.AiDtos.NutritionLabel;
import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiJsonParser {

    // Physical limits: pure fat has ~9 kcal/g, and no macro can weigh more than the food itself.
    static final double MAX_KCAL_PER_GRAM = 9.0;
    static final double MAX_KCAL_PER_100G = 100 * MAX_KCAL_PER_GRAM;
    static final double MAX_GRAMS_PER_100G = 100.0;

    private final ObjectMapper objectMapper;

    /** Reads a portion's macros, capped to what its quantity can physically hold, so a hallucinated value cannot be logged. */
    private void applyPortionMacros(FoodLogDTO dto, JsonNode node) {
        double grams = dto.getQuantity();
        dto.setKcal(sanitizeDouble(node.path("kcal").asDouble(0.0), 0.0, grams * MAX_KCAL_PER_GRAM, 0.0));
        dto.setProtein(sanitizeDouble(node.path("protein").asDouble(0.0), 0.0, grams, 0.0));
        dto.setCarbs(sanitizeDouble(node.path("carbs").asDouble(0.0), 0.0, grams, 0.0));
        dto.setFat(sanitizeDouble(node.path("fat").asDouble(0.0), 0.0, grams, 0.0));
    }

    public List<FoodLogDTO> parseFoodLogs(
            String responseText,
            int defaultMealIndex,
            int availableMealsCount,
            LocalDate date,
            List<SavedFoodDTO> savedFoods) throws JacksonException {

        JsonNode arrayNode = objectMapper.readTree(responseText);
        List<FoodLogDTO> dtoList = new ArrayList<>();

        if (arrayNode.isArray()) {
            for (JsonNode node : arrayNode) {
                FoodLogDTO dto = new FoodLogDTO();

                int assignedMeal = defaultMealIndex >= 0 ? defaultMealIndex : 0;
                if (node.has("mealIndex") && !node.path("mealIndex").isNull()) {
                    int candidate = node.path("mealIndex").asInt(-1);
                    if (candidate >= 0 && candidate < availableMealsCount) {
                        assignedMeal = candidate;
                    }
                }

                dto.setMealIndex(assignedMeal);
                dto.setDate(date);
                dto.setProduct(node.path("product").asString("Alimento"));
                dto.setQuantity(sanitizeDouble(node.path("quantity").asDouble(100.0), 0.1, 50000.0, 100.0));
                applyPortionMacros(dto, node);

                // Reconstruct portionsJson if it matches a SavedFood exactly
                String pName = dto.getProduct();
                if (savedFoods != null) {
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
                }

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    public SavedFoodDTO parseSavedFood(String responseText) throws JacksonException {
        JsonNode node = objectMapper.readTree(responseText);

        SavedFoodDTO dto = new SavedFoodDTO();
        dto.setName(node.path("name").asString());
        dto.setBrand(node.path("brand").asString());
        dto.setKcalPer100g(sanitizeDouble(node.path("kcalPer100g").asDouble(0.0), 0.0, MAX_KCAL_PER_100G, 0.0));
        dto.setProteinPer100g(sanitizeDouble(node.path("proteinPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0));
        dto.setCarbsPer100g(sanitizeDouble(node.path("carbsPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0));
        dto.setFatPer100g(sanitizeDouble(node.path("fatPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0));
        if (node.has("servingSize") && !node.path("servingSize").isNull()) {
            dto.setServingSize(sanitizeDouble(node.path("servingSize").asDouble(100.0), 0.1, 50000.0, 100.0));
        }
        if (node.has("servingLabel") && !node.path("servingLabel").isNull() && !node.path("servingLabel").asString().isEmpty()) {
            dto.setServingLabel(node.path("servingLabel").asString());
        }
        return dto;
    }

    public NutritionLabel parseNutritionalLabel(String responseText) throws JacksonException {
        JsonNode node = objectMapper.readTree(responseText);

        Double servingSize = node.has("servingSize") && !node.path("servingSize").isNull()
                ? sanitizeDouble(node.path("servingSize").asDouble(100.0), 0.1, 50000.0, 100.0)
                : null;
        String servingLabel = node.has("servingLabel") && !node.path("servingLabel").isNull()
                ? node.path("servingLabel").asString()
                : null;
        return new NutritionLabel(
                node.path("name").asString(""),
                node.path("brand").asString(""),
                sanitizeDouble(node.path("kcalPer100g").asDouble(0.0), 0.0, MAX_KCAL_PER_100G, 0.0),
                sanitizeDouble(node.path("proteinPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0),
                sanitizeDouble(node.path("carbsPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0),
                sanitizeDouble(node.path("fatPer100g").asDouble(0.0), 0.0, MAX_GRAMS_PER_100G, 0.0),
                servingSize,
                servingLabel);
    }

    public MealAssistantResponse parseMealAssistantResponse(
            String responseText,
            LocalDate date,
            int resolvedMealIndex,
            String resolvedMealName,
            double remKcal, double remProtein, double remCarbs, double remFat,
            int targetKcal, double targetProtein, double targetCarbs, double targetFat,
            double consumedKcal, double consumedProtein, double consumedCarbs, double consumedFat) throws JacksonException {

        JsonNode rootNode = objectMapper.readTree(responseText);

        String reply = rootNode.path("reply").asString("Aquí tienes las mejores opciones adaptadas a tus macros.");
        List<MealOption> options = new ArrayList<>();

        JsonNode optionsNode = rootNode.path("mealOptions");
        if (optionsNode.isArray() && optionsNode.size() > 0) {
            for (int i = 0; i < optionsNode.size(); i++) {
                JsonNode oNode = optionsNode.get(i);
                int mIdx = oNode.path("mealIndex").asInt(resolvedMealIndex);
                options.add(mealOption(
                        oNode.path("id").asString("opt-" + (i + 1)),
                        oNode.path("title").asString("Opción " + (i + 1)),
                        oNode.path("description").asString(""),
                        mIdx,
                        oNode.path("mealName").asString(resolvedMealName),
                        suggestedFoods(oNode.path("suggestedFoods"), date, mIdx)));
            }
        } else if (rootNode.has("suggestedFoods") && rootNode.path("suggestedFoods").isArray()) {
            // Older prompt shape: a single list of foods instead of options.
            int mIdx = rootNode.path("mealIndex").asInt(resolvedMealIndex);
            List<FoodLogDTO> foods = suggestedFoods(rootNode.path("suggestedFoods"), date, mIdx);
            if (!foods.isEmpty()) {
                options.add(mealOption("opt-1", "Opción Recomendada", "Adaptada a tus macros restantes.",
                        mIdx, rootNode.path("mealName").asString(resolvedMealName), foods));
            }
        }

        MealOption first = options.isEmpty() ? null : options.get(0);
        return new MealAssistantResponse(
                reply,
                options,
                first != null ? first.mealIndex() : resolvedMealIndex,
                first != null ? first.mealName() : resolvedMealName,
                first != null ? first.suggestedFoods() : List.of(),
                first != null ? first.totalMacros() : MacroTotals.ZERO,
                new MacroTotals(Math.round(remKcal), remProtein, remCarbs, remFat),
                new MacroTotals(targetKcal, targetProtein, targetCarbs, targetFat),
                new MacroTotals(Math.round(consumedKcal), round1(consumedProtein), round1(consumedCarbs),
                        round1(consumedFat)));
    }

    private List<FoodLogDTO> suggestedFoods(JsonNode foods, LocalDate date, int mealIndex) {
        List<FoodLogDTO> result = new ArrayList<>();
        if (!foods.isArray()) {
            return result;
        }
        for (JsonNode fNode : foods) {
            FoodLogDTO dto = new FoodLogDTO();
            dto.setDate(date);
            dto.setMealIndex(mealIndex);
            dto.setProduct(fNode.path("product").asString());
            dto.setQuantity(sanitizeDouble(fNode.path("quantity").asDouble(100.0), 0.1, 50000.0, 100.0));
            applyPortionMacros(dto, fNode);
            result.add(dto);
        }
        return result;
    }

    private MealOption mealOption(String id, String title, String description, int mealIndex, String mealName,
                                  List<FoodLogDTO> foods) {
        double kcal = 0, protein = 0, carbs = 0, fat = 0;
        for (FoodLogDTO food : foods) {
            kcal += food.getKcal();
            protein += food.getProtein();
            carbs += food.getCarbs();
            fat += food.getFat();
        }
        return new MealOption(id, title, description, mealIndex, mealName, foods,
                new MacroTotals(Math.round(kcal), round1(protein), round1(carbs), round1(fat)));
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    private double sanitizeDouble(double val, double min, double max, double fallback) {
        if (!Double.isFinite(val)) {
            return fallback;
        }
        return Math.max(min, Math.min(max, val));
    }
}
