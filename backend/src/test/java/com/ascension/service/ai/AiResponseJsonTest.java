package com.ascension.service.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.ascension.dto.AiDtos.MealAssistantResponse;
import com.ascension.dto.AiDtos.NutritionLabel;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Pins the JSON the frontend reads from the AI endpoints, which used to be built from untyped maps. */
class AiResponseJsonTest {

    private final JsonMapper json = JsonMapper.builder().build();
    private final AiJsonParser parser = new AiJsonParser(json);

    @Test
    void labelOmitsServingFieldsTheLabelDoesNotHave() throws Exception {
        NutritionLabel label = parser.parseNutritionalLabel("""
                {"name":"Yogur","brand":"Marca","kcalPer100g":60,"proteinPer100g":4,"carbsPer100g":5,"fatPer100g":2}
                """);

        JsonNode node = json.readTree(json.writeValueAsString(label));

        assertThat(node.propertyNames()).containsExactlyInAnyOrder(
                "name", "brand", "kcalPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g");
        assertThat(node.path("kcalPer100g").asDouble()).isEqualTo(60.0);
    }

    @Test
    void assistantReplyKeepsItsShapeAndRepeatsTheFirstOption() throws Exception {
        MealAssistantResponse reply = parser.parseMealAssistantResponse("""
                {"reply":"Hola","mealOptions":[
                  {"id":"a","title":"Pollo","description":"d","mealIndex":2,"mealName":"Cena","suggestedFoods":[
                    {"product":"Pollo","quantity":150,"kcal":240,"protein":45,"carbs":0,"fat":5}]},
                  {"id":"b","title":"Huevos","suggestedFoods":[]}]}
                """, LocalDate.of(2026, 11, 6), 1, "Comida",
                500.4, 40, 50, 10, 2000, 150, 200, 60, 1500.6, 110, 150, 50);

        JsonNode node = json.readTree(json.writeValueAsString(reply));

        assertThat(node.propertyNames()).containsExactlyInAnyOrder("reply", "mealOptions", "mealIndex", "mealName",
                "suggestedFoods", "totalMacros", "remainingBudget", "targetMacros", "consumedToday");
        assertThat(node.path("mealOptions")).hasSize(2);
        assertThat(node.path("mealOptions").get(0).path("totalMacros").path("kcal").asLong()).isEqualTo(240);
        assertThat(node.path("mealIndex").asInt()).isEqualTo(2);
        assertThat(node.path("mealName").asString()).isEqualTo("Cena");
        assertThat(node.path("suggestedFoods")).hasSize(1);
        assertThat(node.path("remainingBudget").path("kcal").asLong()).isEqualTo(500);
        assertThat(node.path("consumedToday").path("kcal").asLong()).isEqualTo(1501);
        assertThat(node.path("targetMacros").path("protein").asDouble()).isEqualTo(150.0);
    }

    @Test
    void assistantReplyWithoutOptionsFallsBackToTheRequestedMeal() throws Exception {
        MealAssistantResponse reply = parser.parseMealAssistantResponse("{\"reply\":\"Nada\"}",
                LocalDate.of(2026, 11, 6), 1, "Comida", 0, 0, 0, 0, 2000, 150, 200, 60, 0, 0, 0, 0);

        assertThat(reply.mealOptions()).isEmpty();
        assertThat(reply.mealIndex()).isEqualTo(1);
        assertThat(reply.mealName()).isEqualTo("Comida");
        assertThat(reply.suggestedFoods()).isEmpty();
        assertThat(reply.totalMacros().kcal()).isZero();
    }
}
