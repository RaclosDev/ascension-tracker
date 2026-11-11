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
    @jakarta.validation.constraints.Size(max = 25000, message = "Número máximo de registros de alimentos excedido (25000)")
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

    /** Coach-mode links, invitations and access log. Export only: a restore never reads it back. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private com.ascension.dto.CoachDtos.CoachingExport coaching;

    /** Training programs the user owns. Export only, like {@link #coaching}. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.ProgramDtos.Program> programs;

    /** The recipe library the user keeps as a coach. Export only, like {@link #coaching}. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.CoachRecipeDtos.Recipe> coachRecipes;

    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.NutritionTemplateDtos.Template> nutritionTemplates;

    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.PowerliftingDtos.Saved> powerlifting;

    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.PowerMeetDtos.Saved> powerliftingMeets;

    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.CoachWeekDtos.Saved> coachWeekPlans;
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.LibraryItemDtos.Item> coachLibraryItems;

    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
    private com.ascension.dto.CoachSettingsDtos.Settings coachSettings;

    /** Progress photo details (the images stay in private storage). Export only, like {@link #coaching}. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    @com.fasterxml.jackson.annotation.JsonProperty(access = com.fasterxml.jackson.annotation.JsonProperty.Access.READ_ONLY)
    private List<com.ascension.dto.ProgressPhotoDtos.ExportedPhoto> progressPhotos;
    /** Messages the user sent us from the contact form. Export only, like {@link #coaching}. */
    @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_EMPTY)
    private List<com.ascension.dto.ContactDtos.ContactRequestExport> contactRequests;
}
