package com.ascension.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class PowerliftingDtos {
    private PowerliftingDtos() { }

    public enum Lift { SQUAT, BENCH, DEADLIFT }
    public enum Equipment { CLASSIC, EQUIPPED, OTHER }
    public enum Context { TRAINING, COMPETITION }

    public record Maxes(
            @DecimalMin("0.01") @DecimalMax("1500") BigDecimal squat,
            @DecimalMin("0.01") @DecimalMax("1500") BigDecimal bench,
            @DecimalMin("0.01") @DecimalMax("1500") BigDecimal deadlift) { }

    public record Mark(
            @NotNull UUID id,
            @NotNull Lift lift,
            @NotNull @DecimalMin("0.01") @DecimalMax("1500") BigDecimal kg,
            @NotNull @PastOrPresent LocalDate date,
            @NotNull Context context,
            @NotNull @Size(max = 200) String reference) { }

    public record Profile(
            boolean enabled,
            @NotNull Equipment equipment,
            @NotNull @Size(max = 100) String federation,
            @NotNull @Valid Maxes trainingMax,
            @NotNull @Size(max = 200) List<@NotNull @Valid Mark> marks,
            @NotNull @Size(max = 2000) String notes) { }

    public record Saved(UUID linkId, Profile profile, int version, Instant updatedAt) { }

    public record SaveRequest(@NotNull @Valid Profile profile, @NotNull @Min(0) Integer expectedVersion) { }
}
