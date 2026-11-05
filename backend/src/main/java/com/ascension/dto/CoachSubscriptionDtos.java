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

    public record SubscriptionExport(String plan, String status, Instant trialEndsAt, Instant currentPeriodEnd,
                                     String stripeCustomerId, String stripeSubscriptionId,
                                     Instant createdAt, Instant updatedAt) {
    }
}
