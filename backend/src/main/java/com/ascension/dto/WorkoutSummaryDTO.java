package com.ascension.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSummaryDTO {
    private Long id;
    private String name;
    private String date;
    private Integer durationSeconds;
    private int exerciseCount;
    private int totalSets;
    private double totalVolume;
    private List<String> exerciseNames;
}
