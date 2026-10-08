package com.ascension.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutStatsDTO {
    private long totalWorkouts;
    private long totalDurationSeconds;
    private double totalVolume;
    private long totalSets;
}
