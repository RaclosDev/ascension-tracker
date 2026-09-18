package com.ascension.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutDTO {
    private String id;
    private String name;
    private Long startedAt;
    private Long finishedAt;
    private String notes;
    private List<WorkoutExerciseDTO> exercises;
}
