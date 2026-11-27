package com.ascension.util;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Single place that decides what "today" is. The server runs in UTC, but the app's users are in Spain:
 * between 00:00 and 02:00 local time a UTC clock still reports the previous day.
 */
public final class AppClock {

    public static final ZoneId ZONE = ZoneId.of("Europe/Madrid");

    private AppClock() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalDate today(java.time.Clock clock) {
        return LocalDate.now(clock.withZone(ZONE));
    }
}
