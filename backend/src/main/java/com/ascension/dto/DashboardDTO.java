package com.ascension.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardDTO {
    private Double currentWeight;
    private Double currentWeeklyAverage;
    private Double totalLost;
    private Double remaining;
    private Double progress;
    private String estimatedDate;
    private Double avgWeeklyChange;
    private Integer weeksActive;
    private Double bestWeekDelta;
    private String bestWeekDate;
    private Integer streak;
    private List<StreakDay> streakDays;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StreakDay {
        private LocalDate date;
        private boolean hasData;
    }
}
