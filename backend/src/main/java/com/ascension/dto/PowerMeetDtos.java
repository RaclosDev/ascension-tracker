package com.ascension.dto;

import com.ascension.dto.PowerliftingDtos.Equipment;
import com.ascension.dto.PowerliftingDtos.Lift;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class PowerMeetDtos {
    private PowerMeetDtos() { }
    public enum Result { PENDING, VALID, INVALID, WITHDRAWN }
    public enum Rules { CUSTOM, IPF_2026 }
    public record Attempt(
            @NotNull Lift lift, @Min(1) @Max(3) int number,
            @DecimalMin("0.01") @DecimalMax("1500") BigDecimal plannedKg,
            @DecimalMin("0.01") @DecimalMax("1500") BigDecimal actualKg,
            @NotNull Result result, boolean recordAttempt) { }
    public record Block(
            @NotNull UUID id, @NotBlank @Size(max = 80) String name,
            @NotNull LocalDate start, @NotNull LocalDate end,
            @NotBlank @Size(max = 500) String goal) { }
    public record Content(
            @NotBlank @Size(max = 120) String name, @NotNull LocalDate date,
            @NotNull Equipment equipment, @NotNull @Size(max = 100) String federation,
            @NotNull @Size(max = 80) String category, @NotNull Rules rules,
            @DecimalMin("0.01") @DecimalMax("4500") BigDecimal targetTotal,
            @NotNull @Size(max = 2000) String notes, boolean archived,
            @NotNull @Size(max = 30) List<@NotNull @Valid Block> blocks,
            @NotNull @Size(min = 9, max = 9) List<@NotNull @Valid Attempt> attempts) { }
    public record Saved(UUID id, UUID linkId, Content content, int version, Instant updatedAt) { }
    public record SaveRequest(@NotNull @Valid Content content, @NotNull @Min(0) Integer expectedVersion) { }
}
