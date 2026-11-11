package com.ascension.service;

import com.ascension.dto.CoachScheduleDtos.Followup;
import com.ascension.dto.CoachScheduleDtos.Schedule;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import static org.assertj.core.api.Assertions.assertThat;

class CoachScheduleServiceTest {
    private final Schedule madrid = new Schedule(7, LocalTime.of(18, 0), "Europe/Madrid", false);
    private final Instant started = Instant.parse("2026-09-01T10:00:00Z");

    @Test void firstDeadlineLeavesAFullWeekAndUsesLocalTimeAcrossDst() {
        Instant joined = Instant.parse("2026-10-20T10:00:00Z");
        assertThat(CoachScheduleService.nextDue(madrid, joined, joined))
                .isEqualTo(Instant.parse("2026-11-01T17:00:00Z"));
        assertThat(CoachScheduleService.deadline(madrid, LocalDate.parse("2026-10-19")).toInstant())
                .isEqualTo(Instant.parse("2026-10-25T17:00:00Z"));
    }

    @Test void aReviewIsNotOverdueBeforeItsLocalDeadlineAndSendingItClearsTheGap() {
        Followup followup = new Followup(madrid, started, null);
        Instant due = Instant.parse("2026-11-08T17:00:00Z");
        assertThat(CoachScheduleService.missing(followup, LocalDate.parse("2026-10-26"), due.minusSeconds(1))).isZero();
        assertThat(CoachScheduleService.missing(followup, LocalDate.parse("2026-10-26"), due)).isEqualTo(1);
        assertThat(CoachScheduleService.missing(followup, LocalDate.parse("2026-11-02"), due)).isZero();
        assertThat(CoachScheduleService.missing(followup, null, due)).isEqualTo(2);
    }

    @Test void pauseStopsDeadlinesAndRemindersAndResumeStartsWithGrace() {
        Instant now = Instant.parse("2026-11-08T18:00:00Z");
        Schedule paused = new Schedule(7, LocalTime.of(18, 0), "Europe/Madrid", true);
        Followup followup = new Followup(paused, started, null);
        assertThat(CoachScheduleService.nextDue(paused, started, now)).isNull();
        assertThat(CoachScheduleService.missing(followup, null, now)).isZero();
        assertThat(CoachScheduleService.reminderDue(followup, now)).isFalse();
        assertThat(CoachScheduleService.missing(new Followup(madrid, now, null), null, now)).isZero();
    }

    @Test void dateLineAndDstGapUseTheNamedTimeZone() {
        Schedule island = new Schedule(1, LocalTime.of(8, 0), "Pacific/Kiritimati", false);
        assertThat(CoachScheduleService.deadline(island, LocalDate.parse("2026-11-09")).toInstant())
                .isEqualTo(Instant.parse("2026-11-08T18:00:00Z"));
        Schedule gap = new Schedule(7, LocalTime.of(2, 30), "Europe/Madrid", false);
        assertThat(CoachScheduleService.deadline(gap, LocalDate.parse("2026-03-23")).getHour()).isEqualTo(3);
    }
}
