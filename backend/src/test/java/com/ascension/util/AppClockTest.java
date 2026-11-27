package com.ascension.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AppClockTest {
    @Test
    void justAfterMidnightInSpainIsAlreadyTheNextDayEvenThoughUtcIsNot() {
        // 2026-11-27 23:30 UTC = 2026-11-28 00:30 in Madrid (CET, UTC+1)
        Clock utc = Clock.fixed(Instant.parse("2026-11-27T23:30:00Z"), ZoneOffset.UTC);

        assertThat(LocalDate.now(utc)).isEqualTo(LocalDate.of(2026, 11, 27));
        assertThat(AppClock.today(utc)).isEqualTo(LocalDate.of(2026, 11, 28));
    }

    @Test
    void duringSummerTimeTwoHoursOfOffsetApply() {
        // 2026-07-14 22:30 UTC = 2026-07-15 00:30 in Madrid (CEST, UTC+2)
        Clock utc = Clock.fixed(Instant.parse("2026-07-14T22:30:00Z"), ZoneOffset.UTC);

        assertThat(AppClock.today(utc)).isEqualTo(LocalDate.of(2026, 7, 15));
    }

    @Test
    void middayIsTheSameDayInBothZones() {
        Clock utc = Clock.fixed(Instant.parse("2026-11-27T12:00:00Z"), ZoneOffset.UTC);

        assertThat(AppClock.today(utc)).isEqualTo(LocalDate.of(2026, 11, 27));
    }
}
