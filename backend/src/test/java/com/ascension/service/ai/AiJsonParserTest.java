package com.ascension.service.ai;

import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.SavedFoodDTO;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AiJsonParserTest {

    private final AiJsonParser parser = new AiJsonParser(JsonMapper.builder().build());

    @Test
    void capsHallucinatedPer100gValuesToPhysicalLimits() throws Exception {
        SavedFoodDTO food = parser.parseSavedFood("""
                {"name":"Galleta","kcalPer100g":4800,"proteinPer100g":250,"carbsPer100g":60,"fatPer100g":20}
                """);

        assertThat(food.getKcalPer100g()).isEqualTo(900.0);
        assertThat(food.getProteinPer100g()).isEqualTo(100.0);
        assertThat(food.getCarbsPer100g()).isEqualTo(60.0);
    }

    @Test
    void capsLabelValuesToPhysicalLimits() throws Exception {
        Map<String, Object> label = parser.parseNutritionalLabel("""
                {"kcalPer100g":12000,"proteinPer100g":10,"carbsPer100g":500,"fatPer100g":5}
                """);

        assertThat(label.get("kcalPer100g")).isEqualTo(900.0);
        assertThat(label.get("carbsPer100g")).isEqualTo(100.0);
    }

    @Test
    void capsLoggedPortionMacrosToWhatItsWeightCanHold() throws Exception {
        List<FoodLogDTO> logs = parser.parseFoodLogs("""
                [{"mealIndex":0,"product":"Arroz","quantity":50,"kcal":3000,"protein":80,"carbs":40,"fat":1}]
                """, 0, 3, LocalDate.of(2026, 11, 6), List.of());

        FoodLogDTO log = logs.get(0);
        assertThat(log.getKcal()).isEqualTo(450.0);
        assertThat(log.getProtein()).isEqualTo(50.0);
        assertThat(log.getCarbs()).isEqualTo(40.0);
        assertThat(log.getFat()).isEqualTo(1.0);
    }
}
