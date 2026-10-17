package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.*;
import com.ascension.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDataExportServiceTest {

    @Mock
    private WorkoutRepository workoutRepository;
    @Mock
    private CustomExerciseRepository customExerciseRepository;
    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;
    @Mock
    private FoodLogRepository foodLogRepository;
    @Mock
    private MealRepository mealRepository;
    @Mock
    private RecipeRepository recipeRepository;
    @Mock
    private SavedFoodRepository savedFoodRepository;
    @Mock
    private StepsEntryRepository stepsEntryRepository;
    @Mock
    private WeightEntryRepository weightEntryRepository;
    @Mock
    private UserSettingsRepository userSettingsRepository;
    @Mock
    private WorkoutMapper workoutMapper;

    @InjectMocks
    private UserDataExportService exportService;

    private static final String TEST_EMAIL = "athlete@example.com";

    @Test
    @DisplayName("Should export complete user data with all entities mapped")
    void exportUserData_withFullData_returnsCompleteDTO() {
        // Arrange
        Workout workout = Workout.builder()
                .id("w-1")
                .name("Push Day")
                .userEmail(TEST_EMAIL)
                .startedAt(1700000000L)
                .finishedAt(1700003600L)
                .exercises(Set.of())
                .build();
        WorkoutDTO workoutDTO = WorkoutDTO.builder()
                .id("w-1")
                .name("Push Day")
                .startedAt(1700000000L)
                .finishedAt(1700003600L)
                .build();
        when(workoutRepository.findAllByUserEmailOrderByStartedAtDesc(TEST_EMAIL)).thenReturn(List.of(workout));
        when(workoutMapper.toDTO(workout)).thenReturn(workoutDTO);

        CustomExercise customExercise = CustomExercise.builder()
                .id("ce-1")
                .name("Incline Cable Press")
                .muscle("Chest")
                .equipment("Cable")
                .userEmail(TEST_EMAIL)
                .build();
        when(customExerciseRepository.findByUserEmail(TEST_EMAIL)).thenReturn(List.of(customExercise));

        WorkoutTemplate template = WorkoutTemplate.builder()
                .id("wt-1")
                .name("Upper Body")
                .userEmail(TEST_EMAIL)
                .exercises(List.of(new TemplateExercise("ex-bench", "neutral", "smith")))
                .build();
        when(workoutTemplateRepository.findByUserEmail(TEST_EMAIL)).thenReturn(List.of(template));

        FoodLog foodLog = new FoodLog();
        foodLog.setId(10L);
        foodLog.setUserEmail(TEST_EMAIL);
        foodLog.setDate(LocalDate.of(2026, 10, 13));
        foodLog.setMealIndex(1);
        foodLog.setProduct("Oatmeal");
        foodLog.setQuantity(100.0);
        foodLog.setKcal(380.0);
        foodLog.setProtein(13.0);
        foodLog.setCarbs(68.0);
        foodLog.setFat(7.0);
        when(foodLogRepository.findAllByUserEmailOrderByDateAscIdAsc(TEST_EMAIL)).thenReturn(List.of(foodLog));

        Meal meal = Meal.builder()
                .id(1L)
                .name("Breakfast")
                .icon("☕")
                .userEmail(TEST_EMAIL)
                .sortOrder(0)
                .isDefault(true)
                .build();
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(TEST_EMAIL)).thenReturn(List.of(meal));

        Recipe recipe = Recipe.builder()
                .id(5L)
                .name("Protein Shake")
                .description("Whey + banana")
                .userEmail(TEST_EMAIL)
                .totalKcal(300.0)
                .totalProtein(35.0)
                .totalCarbs(30.0)
                .totalFat(3.0)
                .build();
        when(recipeRepository.findAllByUserEmailOrderByNameAsc(TEST_EMAIL)).thenReturn(List.of(recipe));

        SavedFood savedFood = SavedFood.builder()
                .id(20L)
                .name("Greek Yogurt")
                .brand("Fage")
                .userEmail(TEST_EMAIL)
                .kcalPer100g(57.0)
                .proteinPer100g(10.3)
                .carbsPer100g(4.0)
                .fatPer100g(0.0)
                .build();
        when(savedFoodRepository.findAllByUserEmailOrderByNameAsc(TEST_EMAIL)).thenReturn(List.of(savedFood));

        StepsEntry stepsEntry = new StepsEntry();
        stepsEntry.setId(100L);
        stepsEntry.setUserEmail(TEST_EMAIL);
        stepsEntry.setDate(LocalDate.of(2026, 10, 13));
        stepsEntry.setSteps(12500);
        when(stepsEntryRepository.findAllByUserEmailOrderByDateAsc(TEST_EMAIL)).thenReturn(List.of(stepsEntry));

        WeightEntry weightEntry = new WeightEntry();
        weightEntry.setId(200L);
        weightEntry.setUserEmail(TEST_EMAIL);
        weightEntry.setDate(LocalDate.of(2026, 10, 13));
        weightEntry.setWeight(78.5);
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(TEST_EMAIL)).thenReturn(List.of(weightEntry));

        UserSettings settings = UserSettings.builder()
                .id(1L)
                .userEmail(TEST_EMAIL)
                .startWeight(85.0)
                .goalWeight(75.0)
                .weeklyGoal(0.5)
                .startDate(LocalDate.of(2026, 1, 1))
                .kcal(2400)
                .macroStrategy("BALANCED")
                .build();
        when(userSettingsRepository.findByUserEmail(TEST_EMAIL)).thenReturn(Optional.of(settings));

        // Act
        UserDataExportDTO result = exportService.exportUserData(TEST_EMAIL);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getVersion()).isEqualTo("1.0");
        assertThat(result.getUserEmail()).isEqualTo(TEST_EMAIL);
        assertThat(result.getExportedAt()).isNotNull();

        assertThat(result.getWorkouts()).hasSize(1);
        assertThat(result.getWorkouts().get(0).getName()).isEqualTo("Push Day");

        assertThat(result.getCustomExercises()).hasSize(1);
        assertThat(result.getCustomExercises().get(0).getName()).isEqualTo("Incline Cable Press");

        assertThat(result.getWorkoutTemplates()).hasSize(1);
        assertThat(result.getWorkoutTemplates().get(0).getName()).isEqualTo("Upper Body");
        assertThat(result.getWorkoutTemplates().get(0).getExercises()).hasSize(1);
        assertThat(result.getWorkoutTemplates().get(0).getExercises().get(0).getExerciseId()).isEqualTo("ex-bench");
        assertThat(result.getWorkoutTemplates().get(0).getExercises().get(0).getVariant().getGrip()).isEqualTo("neutral");

        assertThat(result.getFoodLogs()).hasSize(1);
        assertThat(result.getFoodLogs().get(0).getProduct()).isEqualTo("Oatmeal");
        assertThat(result.getFoodLogs().get(0).getKcal()).isEqualTo(380.0);

        assertThat(result.getMeals()).hasSize(1);
        assertThat(result.getMeals().get(0).getName()).isEqualTo("Breakfast");

        assertThat(result.getRecipes()).hasSize(1);
        assertThat(result.getRecipes().get(0).getName()).isEqualTo("Protein Shake");

        assertThat(result.getSavedFoods()).hasSize(1);
        assertThat(result.getSavedFoods().get(0).getName()).isEqualTo("Greek Yogurt");

        assertThat(result.getStepsEntries()).hasSize(1);
        assertThat(result.getStepsEntries().get(0).getSteps()).isEqualTo(12500);

        assertThat(result.getWeightEntries()).hasSize(1);
        assertThat(result.getWeightEntries().get(0).getWeight()).isEqualTo(78.5);

        assertThat(result.getUserSettings()).isNotNull();
        assertThat(result.getUserSettings().getGoalWeight()).isEqualTo(75.0);
        assertThat(result.getUserSettings().getKcal()).isEqualTo(2400);

        // Verify strictly queried by user email
        verify(workoutRepository).findAllByUserEmailOrderByStartedAtDesc(TEST_EMAIL);
        verify(customExerciseRepository).findByUserEmail(TEST_EMAIL);
        verify(workoutTemplateRepository).findByUserEmail(TEST_EMAIL);
        verify(foodLogRepository).findAllByUserEmailOrderByDateAscIdAsc(TEST_EMAIL);
        verify(mealRepository).findAllByUserEmailOrderBySortOrderAsc(TEST_EMAIL);
        verify(recipeRepository).findAllByUserEmailOrderByNameAsc(TEST_EMAIL);
        verify(savedFoodRepository).findAllByUserEmailOrderByNameAsc(TEST_EMAIL);
        verify(stepsEntryRepository).findAllByUserEmailOrderByDateAsc(TEST_EMAIL);
        verify(weightEntryRepository).findAllByUserEmailOrderByDateAsc(TEST_EMAIL);
        verify(userSettingsRepository).findByUserEmail(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should export empty lists and null settings when user has no data")
    void exportUserData_withEmptyData_returnsEmptyCollections() {
        when(workoutRepository.findAllByUserEmailOrderByStartedAtDesc(TEST_EMAIL)).thenReturn(List.of());
        when(customExerciseRepository.findByUserEmail(TEST_EMAIL)).thenReturn(List.of());
        when(workoutTemplateRepository.findByUserEmail(TEST_EMAIL)).thenReturn(List.of());
        when(foodLogRepository.findAllByUserEmailOrderByDateAscIdAsc(TEST_EMAIL)).thenReturn(List.of());
        when(mealRepository.findAllByUserEmailOrderBySortOrderAsc(TEST_EMAIL)).thenReturn(List.of());
        when(recipeRepository.findAllByUserEmailOrderByNameAsc(TEST_EMAIL)).thenReturn(List.of());
        when(savedFoodRepository.findAllByUserEmailOrderByNameAsc(TEST_EMAIL)).thenReturn(List.of());
        when(stepsEntryRepository.findAllByUserEmailOrderByDateAsc(TEST_EMAIL)).thenReturn(List.of());
        when(weightEntryRepository.findAllByUserEmailOrderByDateAsc(TEST_EMAIL)).thenReturn(List.of());
        when(userSettingsRepository.findByUserEmail(TEST_EMAIL)).thenReturn(Optional.empty());

        UserDataExportDTO result = exportService.exportUserData(TEST_EMAIL);

        assertThat(result).isNotNull();
        assertThat(result.getVersion()).isEqualTo("1.0");
        assertThat(result.getUserEmail()).isEqualTo(TEST_EMAIL);
        assertThat(result.getExportedAt()).isNotNull();
        assertThat(result.getWorkouts()).isEmpty();
        assertThat(result.getCustomExercises()).isEmpty();
        assertThat(result.getWorkoutTemplates()).isEmpty();
        assertThat(result.getFoodLogs()).isEmpty();
        assertThat(result.getMeals()).isEmpty();
        assertThat(result.getRecipes()).isEmpty();
        assertThat(result.getSavedFoods()).isEmpty();
        assertThat(result.getStepsEntries()).isEmpty();
        assertThat(result.getWeightEntries()).isEmpty();
        assertThat(result.getUserSettings()).isNull();
    }
}
