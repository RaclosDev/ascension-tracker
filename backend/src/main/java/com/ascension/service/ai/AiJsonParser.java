package com.ascension.service.ai;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AiJsonParser {

    private final ObjectMapper objectMapper;

    public List<FoodLogDTO> parseFoodLogs(
            String responseText,
            int defaultMealIndex,
            int availableMealsCount,
            LocalDate date,
            List<SavedFoodDTO> savedFoods) throws JsonProcessingException {

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
                dto.setProduct(node.path("product").asText());
                dto.setQuantity(node.path("quantity").asDouble());
                dto.setKcal(node.path("kcal").asDouble());
                dto.setProtein(node.path("protein").asDouble());
                dto.setCarbs(node.path("carbs").asDouble());
                dto.setFat(node.path("fat").asDouble());

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

    public SavedFoodDTO parseSavedFood(String responseText) throws JsonProcessingException {
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
        return dto;
    }

    public Map<String, Object> parseNutritionalLabel(String responseText) throws JsonProcessingException {
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
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseMealAssistantResponse(
            String responseText,
            LocalDate date,
            int resolvedMealIndex,
            String resolvedMealName,
            double remKcal, double remProtein, double remCarbs, double remFat,
            int targetKcal, double targetProtein, double targetCarbs, double targetFat,
            double consumedKcal, double consumedProtein, double consumedCarbs, double consumedFat) throws JsonProcessingException {

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
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
