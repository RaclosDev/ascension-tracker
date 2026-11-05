package com.ascension.dto;

import com.ascension.dto.CoachDtos.Person;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
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
                                Instant createdAt) {
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
            @Size(max = 1000, message = "Las notas no pueden pasar de 1000 caracteres") String notes) {
    }

    /** {@code role} is CLIENT for plans set for the exporting user, COACH for plans they set. */
    public record PlanExport(UUID id, String role, Person other, DayTargets training, DayTargets rest, String notes,
                             String status, Instant createdAt, Instant endedAt) {
    }
}
