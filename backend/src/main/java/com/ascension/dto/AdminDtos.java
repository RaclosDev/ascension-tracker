package com.ascension.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Back-office shapes: the coaches and their plans, for setting a plan by hand after a transfer. */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record AdminStatus(boolean admin) {
    }

    public record PlanInfo(String id, int maxClients, int aiDailyLimit) {
    }

    public record AdminCoach(UUID coachId, String name, String email, String plan, String status,
                             String effectivePlan, int maxClients, int activeClients,
                             Instant trialEndsAt, Instant currentPeriodEnd) {
    }

    public record CoachPlans(List<PlanInfo> plans, List<AdminCoach> coaches) {
    }

    /**
     * {@code paidUntil} is the last paid day (Europe/Madrid). A paid plan also records the payment:
     * {@code amountCents} is the total received (VAT included) and {@code vatRatePct} the VAT rate it
     * carries. None of these are used for the free plan.
     */
    public record PlanChange(@NotBlank @Size(max = 20) String plan, LocalDate paidUntil,
                             @Min(1) @Max(10_000_000) Integer amountCents,
                             @DecimalMin("0") @DecimalMax("100") BigDecimal vatRatePct,
                             @Pattern(regexp = "TRANSFER|CASH|CARD|OTHER") String method,
                             @Size(max = 100) String reference) {
    }
}
