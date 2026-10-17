package com.ascension.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDataExportDTO {

    @Builder.Default
    private String version = "1.0";

    private Instant exportedAt;
    private String userEmail;

    private List<WorkoutDTO> workouts;
    private List<CustomExerciseDTO> customExercises;
    private List<WorkoutTemplateDTO> workoutTemplates;
    private List<FoodLogDTO> foodLogs;
    private List<MealDTO> meals;
    private List<RecipeDTO> recipes;
    private List<SavedFoodDTO> savedFoods;
    private List<StepsEntryDTO> stepsEntries;
    private List<WeightEntryDTO> weightEntries;
    private UserSettingsDTO userSettings;
}
