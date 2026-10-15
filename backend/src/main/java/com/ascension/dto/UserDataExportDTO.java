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

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 10000, message = "Número máximo de entrenamientos excedido (10000)")
    private List<@jakarta.validation.Valid WorkoutDTO> workouts;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 2000, message = "Número máximo de ejercicios personalizados excedido (2000)")
    private List<@jakarta.validation.Valid CustomExerciseDTO> customExercises;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 1000, message = "Número máximo de plantillas excedido (1000)")
    private List<@jakarta.validation.Valid WorkoutTemplateDTO> workoutTemplates;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 20000, message = "Número máximo de registros de alimentos excedido (20000)")
    private List<@jakarta.validation.Valid FoodLogDTO> foodLogs;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 2000, message = "Número máximo de comidas excedido (2000)")
    private List<@jakarta.validation.Valid MealDTO> meals;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 2000, message = "Número máximo de recetas excedido (2000)")
    private List<@jakarta.validation.Valid RecipeDTO> recipes;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 2000, message = "Número máximo de alimentos guardados excedido (2000)")
    private List<@jakarta.validation.Valid SavedFoodDTO> savedFoods;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 10000, message = "Número máximo de registros de pasos excedido (10000)")
    private List<@jakarta.validation.Valid StepsEntryDTO> stepsEntries;

    @jakarta.validation.Valid
    @jakarta.validation.constraints.Size(max = 10000, message = "Número máximo de registros de peso excedido (10000)")
    private List<@jakarta.validation.Valid WeightEntryDTO> weightEntries;

    @jakarta.validation.Valid
    private UserSettingsDTO userSettings;
}
