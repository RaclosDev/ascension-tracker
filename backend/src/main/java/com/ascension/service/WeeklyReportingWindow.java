package com.ascension.service;

import com.ascension.util.AppClock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

final class WeeklyReportingWindow {
    private WeeklyReportingWindow() { }

    static LocalDate start(LocalDate firstDate) {
        LocalDate earliest = AppClock.today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(519);
        // Clamp before adjusting, since LocalDate.MIN cannot move backwards.
        return (firstDate.isBefore(earliest) ? earliest : firstDate)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }
}
