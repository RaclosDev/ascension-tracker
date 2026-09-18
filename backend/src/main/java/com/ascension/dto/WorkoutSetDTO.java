package com.ascension.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutSetDTO {
    private String id;
    private String type;
    private String weight;
    private String reps;
    private String distance;
    private String duration;
    private String rpe;
    private Boolean completed;
}
