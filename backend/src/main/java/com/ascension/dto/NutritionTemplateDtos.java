package com.ascension.dto;

import com.ascension.dto.NutritionPlanDtos.DayTargets;
import com.ascension.dto.NutritionPlanDtos.PlanRequest;
import com.ascension.dto.NutritionPlanDtos.PlannedMeal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class NutritionTemplateDtos {
    private NutritionTemplateDtos() { }

    public record Content(DayTargets training, DayTargets rest, String notes, List<PlannedMeal> meals) { }

    public record Template(UUID id, String name, Content content, int version, Instant updatedAt) { }

    public record Summary(UUID id, String name, int trainingKcal, int restKcal, int version, Instant updatedAt) { }

    public record SaveRequest(
            @NotBlank @Size(max = 120) String name,
            @Valid @NotNull PlanRequest plan,
            @Min(1) Integer expectedVersion) { }
}
