package com.ascension.service;

import com.ascension.dto.ClientStatusDtos.ClientStatus;
import com.ascension.dto.ClientStatusDtos.Level;
import com.ascension.dto.ClientStatusDtos.Reason;
import com.ascension.dto.ClientStatusDtos.Signal;
import com.ascension.service.ClientStatusService.Facts;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ClientStatusServiceTest {

    /** A Thursday; this week's Monday is 2026-11-02. */
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 5);
    private static final LocalDate LONG_AGO = LocalDate.of(2026, 9, 1);

    private static Facts facts(LocalDate since, LocalDate lastWorkout, LocalDate lastCheckinWeek, boolean nutrition,
                               int foodDays) {
        return new Facts(UUID.randomUUID(), since, nutrition, lastWorkout, null, null, null, lastCheckinWeek, 0,
                foodDays);
    }

    @Test
    void anActiveClientWithLastWeeksCheckinIsGreen() {
        ClientStatus status = ClientStatusService.evaluate(
                facts(LONG_AGO, TODAY.minusDays(1), LocalDate.of(2026, 10, 26), true, 6), TODAY);
        assertThat(status.level()).isEqualTo(Level.GREEN);
        assertThat(status.signals()).isEmpty();
        assertThat(status.lastActivity()).isEqualTo(TODAY.minusDays(1));
    }

    @Test
    void inactivityTurnsAmberAtThreeDaysAndRedAtSeven() {
        LocalDate week = LocalDate.of(2026, 10, 26);
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY.minusDays(2), week, false, 0), TODAY).level())
                .isEqualTo(Level.GREEN);
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY.minusDays(3), week, false, 0), TODAY).signals())
                .containsExactly(new Signal(Reason.INACTIVE, Level.AMBER, 3));
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY.minusDays(9), week, false, 0), TODAY).signals())
                .containsExactly(new Signal(Reason.INACTIVE, Level.RED, 9));
    }

    @Test
    void missingCheckinsCountOnlyFinishedWeeksSinceTheLinkStarted() {
        // Linked this week: nothing is due yet, and the link date counts as activity.
        ClientStatus fresh = ClientStatusService.evaluate(facts(TODAY.minusDays(1), null, null, true, 0), TODAY);
        assertThat(fresh.level()).isEqualTo(Level.GREEN);
        assertThat(fresh.lastActivity()).isNull();

        // Linked last week without a check-in: one week missing.
        assertThat(ClientStatusService.evaluate(facts(LocalDate.of(2026, 10, 28), TODAY, null, false, 0), TODAY)
                .signals()).containsExactly(new Signal(Reason.CHECKIN_MISSING, Level.AMBER, 1));

        // Long linked, last check-in three weeks ago: capped at two, red.
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY, LocalDate.of(2026, 10, 12), false, 0), TODAY)
                .signals()).containsExactly(new Signal(Reason.CHECKIN_MISSING, Level.RED, 2));
    }

    @Test
    void fewFoodLogsOnlyCountWhenNutritionIsSharedForAWholeWeek() {
        LocalDate week = LocalDate.of(2026, 10, 26);
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY, week, true, 3), TODAY).signals())
                .containsExactly(new Signal(Reason.FEW_FOOD_LOGS, Level.AMBER, 3));
        assertThat(ClientStatusService.evaluate(facts(LONG_AGO, TODAY, week, false, 0), TODAY).level())
                .isEqualTo(Level.GREEN);
        assertThat(ClientStatusService.evaluate(facts(TODAY.minusDays(3), TODAY, week, true, 0), TODAY).level())
                .isEqualTo(Level.GREEN);
    }
}
