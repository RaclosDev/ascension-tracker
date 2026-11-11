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
        var schedule = new com.ascension.dto.CoachScheduleDtos.Schedule(7, java.time.LocalTime.of(18, 0), "Europe/Madrid", false);
        var followup = new com.ascension.dto.CoachScheduleDtos.Followup(schedule,
                since.atStartOfDay(java.time.ZoneId.of("Europe/Madrid")).toInstant(), null);
        int missing = CoachScheduleService.missing(followup, lastCheckinWeek,
                TODAY.atTime(12, 0).atZone(java.time.ZoneId.of("Europe/Madrid")).toInstant());
        return new Facts(UUID.randomUUID(), since, nutrition, lastWorkout, null, null, null, missing, 0,
                foodDays, null, null, null, false, false);
    }

    private static Facts weights(Double recent, Double earlier, Double goal) {
        return new Facts(UUID.randomUUID(), LONG_AGO, false, TODAY, null, null, null, 0, 0,
                0, recent, earlier, goal, false, false);
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
    void missingCheckinsRespectTheFirstScheduledDeadline() {
        // Linked this week: nothing is due yet, and the link date counts as activity.
        ClientStatus fresh = ClientStatusService.evaluate(facts(TODAY.minusDays(1), null, null, true, 0), TODAY);
        assertThat(fresh.level()).isEqualTo(Level.GREEN);
        assertThat(fresh.lastActivity()).isNull();

        // The first scheduled deadline must leave at least seven days after joining.
        assertThat(ClientStatusService.evaluate(facts(LocalDate.of(2026, 10, 28), TODAY, null, false, 0), TODAY)
                .signals()).isEmpty();

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

    @Test
    void reportsTheWeightChangeOnlyWithWeightsFromBothWeeks() {
        assertThat(ClientStatusService.evaluate(weights(84.26, 85.0, 75.0), TODAY).weightChange()).isEqualTo(-0.7);
        assertThat(ClientStatusService.evaluate(weights(65.6, 65.0, null), TODAY).weightChange()).isEqualTo(0.6);
        assertThat(ClientStatusService.evaluate(weights(84.8, null, 75.0), TODAY).weightChange()).isNull();
    }

    @Test
    void weightStallsWhenItBarelyMovesTowardsAGoalStillFarAway() {
        Signal stalled = new Signal(Reason.WEIGHT_STALLED, Level.AMBER, 3);
        // Cutting from 85 to 75: 0.2 kg in three weeks is a stall, 0.5 kg is progress, gaining is a stall.
        assertThat(ClientStatusService.evaluate(weights(84.8, 85.0, 75.0), TODAY).signals()).containsExactly(stalled);
        assertThat(ClientStatusService.evaluate(weights(84.5, 85.0, 75.0), TODAY).level()).isEqualTo(Level.GREEN);
        assertThat(ClientStatusService.evaluate(weights(85.4, 85.0, 75.0), TODAY).signals()).containsExactly(stalled);
        // Bulking towards 70 works the other way round.
        assertThat(ClientStatusService.evaluate(weights(65.1, 65.0, 70.0), TODAY).signals()).containsExactly(stalled);
        assertThat(ClientStatusService.evaluate(weights(65.6, 65.0, 70.0), TODAY).level()).isEqualTo(Level.GREEN);
        // Near the goal, without a goal or without weights from both weeks: nothing to say.
        assertThat(ClientStatusService.evaluate(weights(75.5, 75.5, 75.0), TODAY).level()).isEqualTo(Level.GREEN);
        assertThat(ClientStatusService.evaluate(weights(84.8, 85.0, null), TODAY).level()).isEqualTo(Level.GREEN);
        assertThat(ClientStatusService.evaluate(weights(84.8, null, 75.0), TODAY).level()).isEqualTo(Level.GREEN);
    }

    @Test
    void aClientTheCoachCanPlanButHasNothingAssignedIsToPlan() {
        Facts base = facts(LONG_AGO, TODAY.minusDays(1), LocalDate.of(2026, 10, 26), true, 6);
        Facts noPlans = new Facts(base.linkId(), base.since(), true, base.lastWorkout(), null, null, null,
                base.missingCheckins(), 0, 6, null, null, null, true, true);
        ClientStatus status = ClientStatusService.evaluate(noPlans, TODAY);
        assertThat(status.level()).isEqualTo(Level.AMBER);
        assertThat(status.signals()).containsExactly(new Signal(Reason.NO_PROGRAM, Level.AMBER, 0),
                new Signal(Reason.NO_NUTRITION_PLAN, Level.AMBER, 0));
    }
}
