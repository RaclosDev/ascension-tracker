package com.ascension.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    /** {@code paidUntil} is the last paid day (Europe/Madrid); not used for the free plan. */
    public record PlanChange(@NotBlank @Size(max = 20) String plan, LocalDate paidUntil) {
    }
}
