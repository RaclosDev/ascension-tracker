package com.ascension.service;

import com.ascension.config.UserDataQuotaProperties;
import com.ascension.dto.UserDataExportDTO;
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

    @Spy
    private UserDataQuotaProperties quotaProperties = new UserDataQuotaProperties();

    @InjectMocks
    private UserDataQuotaService quotaService;

    private static final String USER = "user@example.com";

    @BeforeEach
    void setup() {
        quotaProperties.setMaxWorkouts(10);
        quotaProperties.setMaxFoodLogs(20);
        quotaProperties.setMaxRecipes(5);
        quotaProperties.setMaxCustomExercises(5);
        quotaProperties.setMaxWorkoutTemplates(3);
    }

    @Test
    void checkWorkoutQuota_whenUnderLimit_passes() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(8L);
        assertThatCode(() -> quotaService.checkWorkoutQuota(USER, 2)).doesNotThrowAnyException();
    }

    @Test
    void checkWorkoutQuota_whenExceedsLimit_throwsUserDataQuotaExceededException() {
        when(workoutRepository.countByUserEmail(USER)).thenReturn(10L);
        assertThatThrownBy(() -> quotaService.checkWorkoutQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de entrenamientos alcanzado");
    }

    @Test
    void checkFoodLogQuota_whenExceedsLimit_throwsUserDataQuotaExceededException() {
        when(foodLogRepository.countByUserEmail(USER)).thenReturn(20L);
        assertThatThrownBy(() -> quotaService.checkFoodLogQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de registros de alimentos alcanzado");
    }

    @Test
    void checkRecipeQuota_whenExceedsLimit_throwsUserDataQuotaExceededException() {
        when(recipeRepository.countByUserEmail(USER)).thenReturn(5L);
        assertThatThrownBy(() -> quotaService.checkRecipeQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de recetas alcanzado");
    }

    @Test
    void checkCustomExerciseQuota_whenExceedsLimit_throwsUserDataQuotaExceededException() {
        when(customExerciseRepository.countByUserEmail(USER)).thenReturn(5L);
        assertThatThrownBy(() -> quotaService.checkCustomExerciseQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de ejercicios personalizados alcanzado");
    }

    @Test
    void checkWorkoutTemplateQuota_whenExceedsLimit_throwsUserDataQuotaExceededException() {
        when(workoutTemplateRepository.countByUserEmail(USER)).thenReturn(3L);
        assertThatThrownBy(() -> quotaService.checkWorkoutTemplateQuota(USER, 1))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("Límite de plantillas de entrenamiento alcanzado");
    }

    @Test
    void checkRestoreQuotas_overwriteMode_whenBackupExceedsLimit_throwsException() {
        List<WorkoutDTO> excessiveWorkouts = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            excessiveWorkouts.add(WorkoutDTO.builder().build());
        }
        UserDataExportDTO backup = UserDataExportDTO.builder()
                .workouts(excessiveWorkouts)
                .build();

        assertThatThrownBy(() -> quotaService.checkRestoreQuotas(USER, RestoreMode.OVERWRITE, backup))
                .isInstanceOf(UserDataQuotaExceededException.class)
                .hasMessageContaining("La copia de seguridad supera la cuota máxima de entrenamientos");
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
