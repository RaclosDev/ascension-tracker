package com.ascension.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/** Response bodies of the AI nutrition endpoints. Field names are the JSON the frontend reads. */
public final class AiDtos {

    private AiDtos() {
    }

    /** Calories and macros. Calories are whole numbers; macros keep decimals. */
    public record MacroTotals(long kcal, double protein, double carbs, double fat) {

        public static final MacroTotals ZERO = new MacroTotals(0, 0.0, 0.0, 0.0);
    }

    /** Values read from a photographed nutrition label. Serving fields are omitted when the label has none. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record NutritionLabel(
            String name,
            String brand,
            double kcalPer100g,
            double proteinPer100g,
            double carbsPer100g,
            double fatPer100g,
            Double servingSize,
            String servingLabel) {
    }

    /** One meal the assistant proposes, with the foods to log and their totals. */
    public record MealOption(
            String id,
            String title,
            String description,
            int mealIndex,
            String mealName,
            List<FoodLogDTO> suggestedFoods,
            MacroTotals totalMacros) {
    }

    /**
     * Assistant chat reply. The top-level mealIndex, mealName, suggestedFoods and totalMacros repeat
     * the first option for clients that predate multiple options.
     */
    public record MealAssistantResponse(
            String reply,
            List<MealOption> mealOptions,
            int mealIndex,
            String mealName,
            List<FoodLogDTO> suggestedFoods,
            MacroTotals totalMacros,
            MacroTotals remainingBudget,
            MacroTotals targetMacros,
            MacroTotals consumedToday) {
    }

    /** What the assistant panel shows before any question: today's target, intake and what is left. */
    public record AssistantSummary(
            MacroTotals target,
            MacroTotals consumed,
            MacroTotals remaining,
            String date,
            List<MealDTO> meals) {
    }
}
