package com.ascension.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class FatSecretResponseMapper {
    private static final Logger log = LoggerFactory.getLogger(FatSecretResponseMapper.class);
    private final ObjectMapper objectMapper;

    public FatSecretResponseMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String mapFatSecretToOpenFoodFacts(JsonNode root, boolean singleProduct) {
        try {
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("Unknown");
                log.error("FatSecret API Error: {}", errorMsg);
                throw new RuntimeException("FatSecret API Error: " + errorMsg);
            }
            ObjectNode openFoodFactsRoot = objectMapper.createObjectNode();
            
            if (singleProduct) {
                JsonNode food = root.path("food");
                if (food.isMissingNode()) return "{\"product\": null}";
                openFoodFactsRoot.set("product", mapSingleFood(food));
            } else {
                ArrayNode mappedProducts = objectMapper.createArrayNode();
                JsonNode foods = root.path("foods").path("food");
                if (foods.isArray()) {
                    for (JsonNode food : foods) mappedProducts.add(mapSingleFood(food));
                } else if (foods.isObject()) {
                    mappedProducts.add(mapSingleFood(foods));
                }
                openFoodFactsRoot.set("products", mappedProducts);
            }
            return objectMapper.writeValueAsString(openFoodFactsRoot);
        } catch (Exception e) {
            if (e instanceof RuntimeException) throw (RuntimeException) e;
            throw new RuntimeException("Error mapping FatSecret response: " + e.getMessage(), e);
        }
    }

    private ObjectNode mapSingleFood(JsonNode food) {
        ObjectNode product = objectMapper.createObjectNode();
        product.put("product_name", food.path("food_name").asText(""));
        product.put("brands", food.path("brand_name").asText(""));
        product.put("code", food.path("food_id").asText(""));
        
        ObjectNode nutriments = objectMapper.createObjectNode();
        JsonNode servings = food.path("servings").path("serving");
        
        if (!servings.isMissingNode()) {
            JsonNode targetServing = null;
            if (servings.isArray() && servings.size() > 0) {
                for (JsonNode serving : servings) {
                    String unit = serving.path("metric_serving_unit").asText("");
                    if (("g".equalsIgnoreCase(unit) || "ml".equalsIgnoreCase(unit)) && "100.000".equals(serving.path("metric_serving_amount").asText())) {
                        targetServing = serving;
                        break;
                    }
                }
                if (targetServing == null) targetServing = servings.get(0);
            } else if (servings.isObject()) {
                targetServing = servings;
            }

            if (targetServing != null) {
                double metricAmount = targetServing.path("metric_serving_amount").asDouble(100.0);
                double scale = metricAmount > 0 ? (100.0 / metricAmount) : 1.0;
                nutriments.put("energy-kcal_100g", targetServing.path("calories").asDouble(0) * scale);
                nutriments.put("proteins_100g", targetServing.path("protein").asDouble(0) * scale);
                nutriments.put("carbohydrates_100g", targetServing.path("carbohydrate").asDouble(0) * scale);
                nutriments.put("fat_100g", targetServing.path("fat").asDouble(0) * scale);
            }
        } else {
            String desc = food.path("food_description").asText("");
            double kcal = extractRegex(desc, "(?i)Calor[íi]as?\\s*:\\s*([0-9.]+)");
            double fat = extractRegex(desc, "(?i)Grasas?\\s*:\\s*([0-9.]+)");
            double carbs = extractRegex(desc, "(?i)Carbh?\\s*:\\s*([0-9.]+)");
            if (carbs == 0) carbs = extractRegex(desc, "(?i)Carbohidratos?\\s*:\\s*([0-9.]+)");
            double protein = extractRegex(desc, "(?i)Prot(?:e[íi]nas?)?\\s*:\\s*([0-9.]+)");
            
            if (kcal == 0 && fat == 0) { 
                kcal = extractRegex(desc, "(?i)Calories\\s*:\\s*([0-9.]+)");
                fat = extractRegex(desc, "(?i)Fat\\s*:\\s*([0-9.]+)");
                carbs = extractRegex(desc, "(?i)Carbs?\\s*:\\s*([0-9.]+)");
                protein = extractRegex(desc, "(?i)Protein\\s*:\\s*([0-9.]+)");
            }
            double weight = extractRegex(desc, "(?i)Por\\s+([0-9.]+)\\s*g");
            if (weight == 0) weight = extractRegex(desc, "(?i)Per\\s+([0-9.]+)\\s*g");
            double scale = weight > 0 ? (100.0 / weight) : 1.0;

            nutriments.put("energy-kcal_100g", kcal * scale);
            nutriments.put("proteins_100g", protein * scale);
            nutriments.put("carbohydrates_100g", carbs * scale);
            nutriments.put("fat_100g", fat * scale);
        }

        product.set("nutriments", nutriments);
        return product;
    }

    private double extractRegex(String text, String pattern) {
        try {
            Matcher m = Pattern.compile(pattern).matcher(text);
            return m.find() ? Double.parseDouble(m.group(1)) : 0;
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
