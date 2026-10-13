package com.ascension.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutImportSummaryDTO {
    private int importedWorkouts;
    private int createdExercises;
    private int totalSets;
}
