package com.ascension.dto;

import java.time.Instant;

/** A coach's plan as the coach sees it, and as it goes into their data export. */
public final class CoachSubscriptionDtos {

    private CoachSubscriptionDtos() {
    }

    /**
     * {@code plan} and {@code status} are what is stored; {@code effectivePlan} is the plan whose
     * limits apply right now (the free plan once a trial or paid period has run out).
     */
    public record Subscription(String plan, String status, String effectivePlan, int maxClients,
                               int activeClients, int aiDailyLimit, Instant trialEndsAt,
                               Instant currentPeriodEnd) {
    }

    public record PlanOffer(String id, int maxClients, int aiDailyLimit, int monthlyPriceEur, int annualPriceEur) {
    }

    /** The plans on offer and, when configured, the account to pay by bank transfer. */
    public record Billing(java.util.List<PlanOffer> plans, int annualMonths, String transferHolder,
                          String transferIban) {
    }

    public record SubscriptionExport(String plan, String status, Instant trialEndsAt, Instant currentPeriodEnd,
                                     String stripeCustomerId, String stripeSubscriptionId,
                                     Instant createdAt, Instant updatedAt) {
    }
}
