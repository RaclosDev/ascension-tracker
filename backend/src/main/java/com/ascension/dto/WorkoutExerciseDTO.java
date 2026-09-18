package com.ascension.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkoutExerciseDTO {
    private String id;
    private String exerciseId;
    private String notes;
    private String supersetId;
    private List<WorkoutSetDTO> sets;
}
