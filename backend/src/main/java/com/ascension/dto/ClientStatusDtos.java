package com.ascension.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** The coach's traffic light: who needs attention today and why. */
public final class ClientStatusDtos {

    private ClientStatusDtos() {
    }

    public enum Level { GREEN, AMBER, RED }

    /**
     * Why a client is not green. {@code value} is the number behind it: days without logging,
     * weeks without a check-in, days with food logged in the last week or weeks the weight has stalled.
     */
    public enum Reason { INACTIVE, CHECKIN_MISSING, FEW_FOOD_LOGS, WEIGHT_STALLED, NO_PROGRAM, NO_NUTRITION_PLAN }

    public record Signal(Reason reason, Level level, int value) {
    }

    /** {@code lastActivity} only counts what the client shares with this coach. */
    public record ClientStatus(UUID linkId, Level level, LocalDate lastActivity, int pendingReplies,
                               List<Signal> signals) {
    }
}
