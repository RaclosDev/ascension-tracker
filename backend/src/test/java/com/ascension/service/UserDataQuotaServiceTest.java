package com.ascension.service;

import com.ascension.config.UserDataQuotaProperties;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.dto.StepsEntryDTO;
import com.ascension.dto.UserDataExportDTO;
import com.ascension.dto.WeightEntryDTO;
import com.ascension.dto.WorkoutDTO;
import com.ascension.exception.UserDataQuotaExceededException;
import com.ascension.model.RestoreMode;
import com.ascension.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserDataQuotaServiceTest {

    @Mock
    private WorkoutRepository workoutRepository;

    @Mock
    private FoodLogRepository foodLogRepository;

    @Mock
    private RecipeRepository recipeRepository;

    @Mock
    private CustomExerciseRepository customExerciseRepository;

    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;

    @Mock
    private SavedFoodRepository savedFoodRepository;

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @Mock
    private StepsEntryRepository stepsEntryRepository;

    @Mock
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Spy
    private UserDataQuotaProperties quotaProperties = new UserDataQuotaProperties();

    @InjectMocks
    private UserDataQuotaService quotaService;

    private static final String USER = "user@example.com";

    @Test
    void failedQuotaLockDoesNotContinueWithAnUnlockedQuotaCheck() {
        var failure = new org.springframework.dao.DataAccessResourceFailureException("database unavailable");
        when(jdbcTemplate.queryForObject(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.eq(Object.class), org.mockito.ArgumentMatchers.eq(USER)))
                .thenThrow(failure);
        assertThatThrownBy(() -> quotaService.checkFoodLogQuota(USER, 1)).isSameAs(failure);
        org.mockito.Mockito.verifyNoInteractions(foodLogRepository);
    }

    @BeforeEach
    void setup() {
        quotaProperties.setMaxWorkouts(10);
        quotaProperties.setMaxFoodLogs(20);
        quotaProperties.setMaxRecipes(5);
        quotaProperties.setMaxCustomExercises(5);
        quotaProperties.setMaxWorkoutTemplates(3);
        quotaProperties.setMaxSavedFoods(5);
        quotaProperties.setMaxWeightEntries(10);
        quotaProperties.setMaxStepsEntries(10);
    }

    @Test
    void checkWorkoutQuota_whenUnderLimit_passes() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(5L);
        assertThatCode(() -> quotaService.checkWorkoutQuota(USER, 3)).doesNotThrowAnyException();
    }

    @Test
    void checkWorkoutQuota_whenExceedsLimit_throwsException() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(9L);
        assertThatThrownBy(() -> quotaService.checkWorkoutQuota(USER, 2))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de entrenamientos alcanzado");
    }

    @Test
    void checkFoodLogQuota_whenExceedsLimit_throwsException() {
        when(foodLogRepository.countByUserEmail(USER)).thenReturn(20L);
        assertThatThrownBy(() -> quotaService.checkFoodLogQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de registros de alimentos alcanzado");
    }

    @Test
    void checkSavedFoodQuota_whenExceedsLimit_throwsException() {
        when(savedFoodRepository.countByUserEmail(USER)).thenReturn(5L);
        assertThatThrownBy(() -> quotaService.checkSavedFoodQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de alimentos guardados alcanzado");
    }

    @Test
    void checkWeightEntryQuota_whenExceedsLimit_throwsException() {
        when(weightEntryRepository.countByUserEmail(USER)).thenReturn(10L);
        assertThatThrownBy(() -> quotaService.checkWeightEntryQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de registros de peso alcanzado");
    }

    @Test
    void checkStepsEntryQuota_whenExceedsLimit_throwsException() {
        when(stepsEntryRepository.countByUserEmail(USER)).thenReturn(10L);
        assertThatThrownBy(() -> quotaService.checkStepsEntryQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de registros de pasos alcanzado");
    }

    @Test
    void checkRestoreQuotas_overwriteMode_whenExceedsLimit_throwsException() {
        List<WorkoutDTO> incoming = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            incoming.add(WorkoutDTO.builder().build());
        }
        UserDataExportDTO backup = UserDataExportDTO.builder()
                .workouts(incoming)
                .build();

        assertThatThrownBy(() -> quotaService.checkRestoreQuotas(USER, RestoreMode.OVERWRITE, backup))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("cuota máxima de entrenamientos");
    }

    @Test
    void checkRestoreQuotas_overwriteMode_whenSavedFoodsExceedsLimit_throwsException() {
        List<SavedFoodDTO> incoming = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            incoming.add(SavedFoodDTO.builder().build());
        }
        UserDataExportDTO backup = UserDataExportDTO.builder()
                .savedFoods(incoming)
                .build();

        assertThatThrownBy(() -> quotaService.checkRestoreQuotas(USER, RestoreMode.OVERWRITE, backup))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("cuota máxima de alimentos guardados");
    }

    @Test
    void checkRestoreQuotas_mergeMode_whenCombinedExceedsLimit_throwsException() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(8L);

        List<WorkoutDTO> incoming = List.of(
                WorkoutDTO.builder().build(),
                WorkoutDTO.builder().build(),
                WorkoutDTO.builder().build()
        );
        UserDataExportDTO backup = UserDataExportDTO.builder()
                .workouts(incoming)
                .build();

        assertThatThrownBy(() -> quotaService.checkRestoreQuotas(USER, RestoreMode.MERGE, backup))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de entrenamientos alcanzado");
    }

    @Test
    void checkRestoreQuotas_whenWithinLimits_passes() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(5L);

        List<WorkoutDTO> incoming = List.of(
                WorkoutDTO.builder().build(),
                WorkoutDTO.builder().build()
        );
        UserDataExportDTO backup = UserDataExportDTO.builder()
                .workouts(incoming)
                .build();

        assertThatCode(() -> quotaService.checkRestoreQuotas(USER, RestoreMode.MERGE, backup))
                .doesNotThrowAnyException();
    }
}
