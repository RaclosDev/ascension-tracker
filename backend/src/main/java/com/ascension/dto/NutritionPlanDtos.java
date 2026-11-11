package com.ascension.dto;

import com.ascension.dto.CoachDtos.Person;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** A coach's nutrition plan: grams per macro for training days and for rest days. */
public final class NutritionPlanDtos {

    private NutritionPlanDtos() {
    }

    public static final String TRAINING = "TRAINING";
    public static final String REST = "REST";

    /** Targets for one kind of day; kcal always follow from the grams. */
    public record DayTargets(int kcal, int protein, int carbs, int fat) {
        public static DayTargets of(int protein, int carbs, int fat) {
            return new DayTargets(protein * 4 + carbs * 4 + fat * 9, protein, carbs, fat);
        }
    }

    public record NutritionPlan(UUID id, Person coach, DayTargets training, DayTargets rest, String notes,
                                Instant createdAt, List<PlannedMeal> meals) {
    }

    /**
     * One prescribed meal: a copy of the coach's recipe and the servings. Macros are for all the
     * servings; {@code recipeId} is null once the coach deletes the recipe.
     */
    public record PlannedMeal(String dayType, String slotName, UUID recipeId, String name, String description,
                              double servings, int kcal, double protein, double carbs, double fat) {
    }

    public record MealRequest(
            @NotNull(message = "Indica el tipo de día") @Pattern(regexp = "TRAINING|REST",
                    message = "El tipo de día es TRAINING o REST") String dayType,
            @NotBlank(message = "Ponle nombre a la comida")
            @Size(max = 60, message = "El nombre de la comida no puede pasar de 60 caracteres") String slotName,
            @NotNull(message = "Elige una receta") UUID recipeId,
            @NotNull(message = "Indica las raciones")
            @DecimalMin(value = "0.25", message = "Mínimo un cuarto de ración")
            @DecimalMax(value = "10", message = "Máximo 10 raciones") Double servings,
            Instant expectedRecipeUpdatedAt) {
    }

    public record DayRequest(
            @NotNull(message = "Indica la proteína") @Min(value = 0, message = "Los gramos no pueden ser negativos")
            @Max(value = 1000, message = "Máximo 1000 g") Integer protein,
            @NotNull(message = "Indica los carbohidratos") @Min(value = 0, message = "Los gramos no pueden ser negativos")
            @Max(value = 1000, message = "Máximo 1000 g") Integer carbs,
            @NotNull(message = "Indica la grasa") @Min(value = 0, message = "Los gramos no pueden ser negativos")
            @Max(value = 1000, message = "Máximo 1000 g") Integer fat) {
    }

    public record PlanRequest(
            @Valid @NotNull(message = "Faltan los objetivos de día de entreno") DayRequest training,
            @Valid @NotNull(message = "Faltan los objetivos de día de descanso") DayRequest rest,
            @Size(max = 1000, message = "Las notas no pueden pasar de 1000 caracteres") String notes,
            @Size(max = 20, message = "Máximo 20 comidas pautadas") List<@Valid @NotNull MealRequest> meals) {
    }

    public record PublishRequest(@Valid @NotNull PlanRequest plan, UUID expectedPlanId) {
    }

    public record PlanVersion(UUID id, DayTargets training, DayTargets rest, String status,
                              Instant createdAt, Instant endedAt) {
    }

    /** What the client logged on one day. */
    public record Intake(int kcal, double protein, double carbs, double fat) {
    }

    /**
     * One day of adherence: {@code target} is null when no plan from this coach applied that day,
     * {@code intake} when nothing was logged.
     */
    public record AdherenceDay(LocalDate date, String dayType, DayTargets target, Intake intake, boolean onTarget) {
    }

    /**
     * A Monday-to-Sunday week up to today. Percentages compare the logged days that had a plan with
     * their targets; null when there is no such day.
     */
    public record AdherenceWeek(LocalDate weekStart, int plannedDays, int loggedDays, int onTargetDays,
                                Integer kcalPct, Integer proteinPct, List<AdherenceDay> days) {
    }

    /** {@code role} is CLIENT for plans set for the exporting user, COACH for plans they set. */
    public record PlanExport(UUID id, String role, Person other, DayTargets training, DayTargets rest, String notes,
                             String status, Instant createdAt, Instant endedAt, List<PlannedMeal> meals) {
    }
}
