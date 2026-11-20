package com.ascension.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** What the coach's home adds to the client list: how the key lifts are moving and which meets are near. */
public final class CoachHomeDtos {

    private CoachHomeDtos() {
    }

    /**
     * The exercise a client trained most in the last six weeks and its best set there. {@code e1rm} is the
     * Epley estimate of that set; {@code trend} compares the best estimate of the last three weeks with the
     * three before, and is null when either half has no sets. {@code customName} is only set for the
     * client's own exercises; the catalogue ones are named by the app.
     */
    public record KeyLift(UUID linkId, String exerciseId, String customName, String workoutId, LocalDate date,
                          BigDecimal weight, BigDecimal reps, BigDecimal e1rm, BigDecimal trend) {
    }

    public record Meet(UUID linkId, UUID id, String name, LocalDate date) {
    }

    public record Home(List<KeyLift> lifts, List<Meet> meets) {
    }
}
