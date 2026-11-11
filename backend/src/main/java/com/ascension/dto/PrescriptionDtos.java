package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class PrescriptionDtos {
    private PrescriptionDtos() { }
    public record Load(@NotNull @Pattern(regexp = "KG|PERCENT_TM") String mode,
                       @NotNull @DecimalMin("0") @DecimalMax("2000") BigDecimal amount,
                       @NotNull @Pattern(regexp = "TOTAL|EACH") String unit,
                       @Pattern(regexp = "squat|bench|deadlift") String lift,
                       @DecimalMin("0.25") @DecimalMax("20") BigDecimal increment,
                       @DecimalMin("0") @DecimalMax("2000") BigDecimal referenceKg,
                       @DecimalMin("0") @DecimalMax("2000") BigDecimal resolvedKg,
                       LocalDate referenceDate) { }
    public record SetTarget(@NotNull @Pattern(regexp = "WORK|WARMUP|TOP|BACKOFF") String kind,
                            @Min(1) @Max(100) Integer reps,
                            @DecimalMin("1") @DecimalMax("10") BigDecimal rpe,
                            @Min(0) @Max(10) Integer rir,
                            @Valid Load load,
                            @Size(max = 500) String notes) { }
    public record Prescription(@Valid Load load, @Size(max = 20) List<@Valid @NotNull SetTarget> sets) { }
}
