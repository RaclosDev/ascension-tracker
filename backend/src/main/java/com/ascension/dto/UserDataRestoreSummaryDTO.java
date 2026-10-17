package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDataRestoreSummaryDTO {
    private String mode;
    private int workoutsRestored;
    private int customExercisesRestored;
    private int workoutTemplatesRestored;
    private int foodLogsRestored;
    private int mealsRestored;
    private int recipesRestored;
    private int savedFoodsRestored;
    private int stepsEntriesRestored;
    private int weightEntriesRestored;
    private boolean settingsRestored;
    private Instant restoredAt;
}
