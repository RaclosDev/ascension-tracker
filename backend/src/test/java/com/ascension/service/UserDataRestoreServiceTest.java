package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.*;
import com.ascension.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDataRestoreServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

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

    @InjectMocks
    private UserDataRestoreService service;

    private final String AUTH_USER = "user@example.com";

    private UserDataExportDTO createSampleBackup() {
        CustomExerciseDTO customEx = CustomExerciseDTO.builder()
                .id("client-ex-1")
                .name("Press Banca Inclinado con Mancuernas")
                .muscle("pecho")
                .equipment("mancuernas")
                .userEmail("attacker@evil.com")
                .build();

        WorkoutExerciseDTO we = WorkoutExerciseDTO.builder()
                .exerciseId("client-ex-1")
                .notes("Buena congestión")
                .variant(new WorkoutExerciseDTO.VariantDTO("neutro", null))
                .sets(List.of(
                        WorkoutSetDTO.builder().type("normal").weight("32").reps("10").completed(true).build(),
                        WorkoutSetDTO.builder().type("normal").weight("34").reps("8").completed(true).build()
                ))
                .build();

        WorkoutDTO workout = WorkoutDTO.builder()
                .id("client-w-1")
                .name("Torso Pesado")
                .startedAt(1700000000000L)
                .finishedAt(1700003600000L)
                .notes("Excelente sesión")
                .exercises(List.of(we))
                .build();

        TemplateExerciseDTO te = new TemplateExerciseDTO("client-ex-1", new WorkoutExerciseDTO.VariantDTO("neutro", null));
        WorkoutTemplateDTO template = WorkoutTemplateDTO.builder()
                .id("client-tpl-1")
                .name("Rutina Torso")
                .exercises(List.of(te))
                .build();

        FoodLogDTO foodLog = FoodLogDTO.builder()
                .date(LocalDate.of(2026, 10, 13))
                .mealIndex(0)
                .product("Avena")
                .quantity(100.0)
                .kcal(380.0)
                .protein(13.0)
                .carbs(65.0)
                .fat(7.0)
                .build();

        MealDTO meal = MealDTO.builder()
                .name("Desayuno")
                .icon("sun")
                .proteinPct(25.0)
                .carbsPct(30.0)
                .fatPct(20.0)
                .sortOrder(1)
                .isDefault(true)
                .build();

        RecipeDTO recipe = RecipeDTO.builder()
                .name("Tortitas de Avena")
                .description("Ricas en proteína")
                .totalKcal(450.0)
                .totalProtein(30.0)
                .totalCarbs(50.0)
                .totalFat(10.0)
                .build();

        SavedFoodDTO savedFood = SavedFoodDTO.builder()
                .name("Proteína Whey")
                .brand("MyProtein")
                .kcalPer100g(400.0)
                .proteinPer100g(80.0)
                .carbsPer100g(5.0)
                .fatPer100g(6.0)
                .servingSize(30.0)
                .servingLabel("1 cazo")
                .build();

        StepsEntryDTO steps = StepsEntryDTO.builder()
                .date(LocalDate.of(2026, 10, 13))
                .steps(10500)
                .build();

        WeightEntryDTO weight = WeightEntryDTO.builder()
                .date(LocalDate.of(2026, 10, 13))
                .weight(78.5)
                .build();

        UserSettingsDTO settings = UserSettingsDTO.builder()
                .age(28)
                .heightCm(180)
                .sex("M")
                .startWeight(82.0)
                .goalWeight(75.0)
                .kcal(2400)
                .macroStrategy("BALANCED")
                .build();

        return UserDataExportDTO.builder()
                .version("1.0")
                .exportedAt(Instant.now())
                .userEmail("attacker@evil.com")
                .customExercises(List.of(customEx))
                .workouts(List.of(workout))
                .workoutTemplates(List.of(template))
                .foodLogs(List.of(foodLog))
                .meals(List.of(meal))
                .recipes(List.of(recipe))
                .savedFoods(List.of(savedFood))
                .stepsEntries(List.of(steps))
                .weightEntries(List.of(weight))
                .userSettings(settings)
                .build();
    }

    @Test
    void restoreUserData_overwriteMode_wipesAndRestoresAllEntitiesWithAuthenticatedEmail() {
        UserDataExportDTO backup = createSampleBackup();

        UserDataRestoreSummaryDTO summary = service.restoreUserData(AUTH_USER, "OVERWRITE", backup);

        // Verify wipe was called
        verify(jdbcTemplate, atLeastOnce()).update(startsWith("DELETE FROM "), eq(AUTH_USER));

        // Verify custom exercises saved with AUTH_USER
        ArgumentCaptor<CustomExercise> exCaptor = ArgumentCaptor.forClass(CustomExercise.class);
        verify(customExerciseRepository).save(exCaptor.capture());
        CustomExercise savedEx = exCaptor.getValue();
        assertThat(savedEx.getUserEmail()).isEqualTo(AUTH_USER);
        assertThat(savedEx.getId()).isNotEqualTo("client-ex-1"); // Generated new UUID

        // Verify workout was saved with remapped exerciseId
        ArgumentCaptor<Workout> wCaptor = ArgumentCaptor.forClass(Workout.class);
        verify(workoutRepository).save(wCaptor.capture());
        Workout savedW = wCaptor.getValue();
        assertThat(savedW.getUserEmail()).isEqualTo(AUTH_USER);
        assertThat(savedW.getExercises()).hasSize(1);
        WorkoutExercise savedWe = savedW.getExercises().iterator().next();
        assertThat(savedWe.getExerciseId()).isEqualTo(savedEx.getId()); // Remapped to new UUID
        assertThat(savedWe.getSets()).hasSize(2);

        // Verify template was saved with remapped exerciseId
        ArgumentCaptor<WorkoutTemplate> tplCaptor = ArgumentCaptor.forClass(WorkoutTemplate.class);
        verify(workoutTemplateRepository).save(tplCaptor.capture());
        WorkoutTemplate savedTpl = tplCaptor.getValue();
        assertThat(savedTpl.getUserEmail()).isEqualTo(AUTH_USER);
        assertThat(savedTpl.getExercises().get(0).getExerciseId()).isEqualTo(savedEx.getId());

        // Verify other entities
        verify(foodLogRepository).save(any(FoodLog.class));
        verify(mealRepository).save(any(Meal.class));
        verify(recipeRepository).save(any(Recipe.class));
        verify(savedFoodRepository).save(any(SavedFood.class));
        verify(stepsEntryRepository).save(any(StepsEntry.class));
        verify(weightEntryRepository).save(any(WeightEntry.class));
        verify(userSettingsRepository).save(any(UserSettings.class));

        // Summary assertions
        assertThat(summary.getMode()).isEqualTo("OVERWRITE");
        assertThat(summary.getCustomExercisesRestored()).isEqualTo(1);
        assertThat(summary.getWorkoutsRestored()).isEqualTo(1);
        assertThat(summary.getWorkoutTemplatesRestored()).isEqualTo(1);
        assertThat(summary.getFoodLogsRestored()).isEqualTo(1);
        assertThat(summary.getMealsRestored()).isEqualTo(1);
        assertThat(summary.getRecipesRestored()).isEqualTo(1);
        assertThat(summary.getSavedFoodsRestored()).isEqualTo(1);
        assertThat(summary.getStepsEntriesRestored()).isEqualTo(1);
        assertThat(summary.getWeightEntriesRestored()).isEqualTo(1);
        assertThat(summary.isSettingsRestored()).isTrue();
    }

    @Test
    void restoreUserData_mergeMode_doesNotWipeAndSkipsDuplicateWorkouts() {
        UserDataExportDTO backup = createSampleBackup();

        // Simulate that the workout with startedAt 1700000000000 already exists
        when(workoutRepository.findAllByUserEmailOrderByStartedAtDesc(AUTH_USER))
                .thenReturn(List.of(Workout.builder().startedAt(1700000000000L).build()));

        // Simulate that custom exercise already exists
        CustomExercise existingEx = CustomExercise.builder()
                .id("db-ex-uuid")
                .name("Press Banca Inclinado con Mancuernas")
                .userEmail(AUTH_USER)
                .build();
        when(customExerciseRepository.findByUserEmail(AUTH_USER)).thenReturn(List.of(existingEx));

        UserDataRestoreSummaryDTO summary = service.restoreUserData(AUTH_USER, "MERGE", backup);

        // Wipe must NOT be called in merge mode
        verify(jdbcTemplate, never()).update(startsWith("DELETE FROM "), any(String.class));

        // Custom exercise was matched by name, so not saved again
        verify(customExerciseRepository, never()).save(any(CustomExercise.class));

        // Workout was duplicate by startedAt, so skipped
        verify(workoutRepository, never()).save(any(Workout.class));

        assertThat(summary.getMode()).isEqualTo("MERGE");
        assertThat(summary.getWorkoutsRestored()).isEqualTo(0);
        assertThat(summary.getCustomExercisesRestored()).isEqualTo(0);
    }

    @Test
    void restoreUserData_invalidVersion_throwsIllegalArgumentException() {
        UserDataExportDTO backup = createSampleBackup();
        backup.setVersion("99.0");

        assertThatThrownBy(() -> service.restoreUserData(AUTH_USER, "OVERWRITE", backup))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Versión de copia de seguridad incompatible");
    }

    @Test
    void restoreUserData_nullBackup_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> service.restoreUserData(AUTH_USER, "OVERWRITE", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void restoreUserData_overwriteEmptyBackupWithoutConfirmEmpty_throwsExceptionAndNeverWipes() {
        UserDataExportDTO emptyBackup = UserDataExportDTO.builder()
                .version("1.0")
                .workouts(Collections.emptyList())
                .customExercises(Collections.emptyList())
                .workoutTemplates(Collections.emptyList())
                .foodLogs(Collections.emptyList())
                .meals(Collections.emptyList())
                .recipes(Collections.emptyList())
                .savedFoods(Collections.emptyList())
                .stepsEntries(Collections.emptyList())
                .weightEntries(Collections.emptyList())
                .userSettings(null)
                .build();

        assertThatThrownBy(() -> service.restoreUserData(AUTH_USER, RestoreMode.OVERWRITE, false, emptyBackup))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("confirmEmpty=true");

        verify(jdbcTemplate, never()).update(startsWith("DELETE FROM "), any(String.class));
    }

    @Test
    void restoreUserData_overwriteEmptyBackupWithConfirmEmpty_wipesAndSucceeds() {
        UserDataExportDTO emptyBackup = UserDataExportDTO.builder()
                .version("1.0")
                .workouts(Collections.emptyList())
                .customExercises(Collections.emptyList())
                .workoutTemplates(Collections.emptyList())
                .foodLogs(Collections.emptyList())
                .meals(Collections.emptyList())
                .recipes(Collections.emptyList())
                .savedFoods(Collections.emptyList())
                .stepsEntries(Collections.emptyList())
                .weightEntries(Collections.emptyList())
                .userSettings(null)
                .build();

        UserDataRestoreSummaryDTO summary = service.restoreUserData(AUTH_USER, RestoreMode.OVERWRITE, true, emptyBackup);

        verify(jdbcTemplate, atLeastOnce()).update(startsWith("DELETE FROM "), any(String.class));
        assertThat(summary.getMode()).isEqualTo("OVERWRITE");
        assertThat(summary.getWorkoutsRestored()).isEqualTo(0);
    }
}
