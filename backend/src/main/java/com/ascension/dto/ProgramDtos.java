package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Training programs: what a coach prescribes, day by day. */
public final class ProgramDtos {

    private ProgramDtos() {
    }

    public record ProgramSummary(UUID id, String name, int weeks, int dayCount, Instant updatedAt) {
    }

    /** Request and response body: the builder always saves the whole program at once. */
    public record Program(
            UUID id,
            @NotBlank(message = "El programa necesita un nombre") @Size(max = 120) String name,
            @Size(max = 2000) String notes,
            @NotNull @Min(1) @Max(52) Integer weeks,
            @NotNull @Size(max = 140, message = "Demasiados días en el programa") List<@Valid @NotNull Day> days,
            Instant updatedAt) {
    }

    public record Day(
            @NotNull @Min(1) @Max(52) Integer week,
            @NotNull @Min(1) @Max(7) Integer dayIndex,
            @NotBlank(message = "Cada día necesita un nombre") @Size(max = 120) String name,
            @Size(max = 2000) String notes,
            @NotNull @Size(max = 30, message = "Demasiados ejercicios en un día") List<@Valid @NotNull Exercise> exercises) {
    }

    public record Exercise(
            @NotBlank @Size(max = 255) String exerciseId,
            @Size(max = 255) String exerciseName,
            @Size(max = 255) String variantGrip,
            @Size(max = 255) String variantMachine,
            @NotNull @Min(1) @Max(20) Integer sets,
            @Min(1) @Max(100) Integer repsMin,
            @Min(1) @Max(100) Integer repsMax,
            @DecimalMin("1.0") @DecimalMax("10.0") BigDecimal targetRpe,
            @Min(0) @Max(10) Integer targetRir,
            @Min(0) @Max(900) Integer restSeconds,
            @Size(max = 60) String loadHint,
            @Min(1) @Max(20) Integer supersetGroup,
            @Size(max = 500) String notes) {
    }
}
