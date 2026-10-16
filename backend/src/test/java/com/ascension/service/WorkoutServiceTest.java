package com.ascension.service;

import com.ascension.dto.CustomExerciseDTO;
import com.ascension.dto.WorkoutDTO;
import com.ascension.dto.WorkoutExerciseDTO;
import com.ascension.dto.WorkoutImportRequestDTO;
import com.ascension.dto.WorkoutImportSummaryDTO;
import com.ascension.dto.WorkoutSetDTO;
import com.ascension.dto.WorkoutStatsDTO;
import com.ascension.dto.WorkoutTemplateDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.model.CustomExercise;
import com.ascension.model.Workout;
import com.ascension.model.WorkoutExercise;
import com.ascension.repository.CustomExerciseRepository;
import com.ascension.repository.WorkoutRepository;
import com.ascension.repository.WorkoutStatsProjection;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mapstruct.factory.Mappers;
import com.ascension.service.WorkoutMapper;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {

    @Mock
    private WorkoutRepository workoutRepository;

    @Spy
    private WorkoutMapper workoutMapper = Mappers.getMapper(WorkoutMapper.class);
    
    @Mock
    private WorkoutTemplateService workoutTemplateService;
    
    @Mock
    private CustomExerciseService customExerciseService;

    @Mock
    private CustomExerciseRepository customExerciseRepository;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @InjectMocks
    private WorkoutService workoutService;

    @Test
    void saveWorkout_generatesNewIdAndIgnoresClientId() {
        WorkoutDTO dto = WorkoutDTO.builder().id("client-id-123").name("Test").build();

        when(workoutRepository.save(any(Workout.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkoutDTO saved = workoutService.saveWorkout("userA@example.com", dto);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getId()).isNotEqualTo("client-id-123");
    }

    @Test
    void updateWorkout_throws404IfWorkoutBelongsToAnotherUser() {
        WorkoutDTO dto = WorkoutDTO.builder().id("workout-id").name("Hacked").build();

        when(workoutRepository.findByIdAndUserEmail("workout-id", "userB@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> workoutService.updateWorkout("userB@example.com", "workout-id", dto))
                .isInstanceOf(EntityNotFoundException.class);

        verify(workoutRepository, never()).save(any());
    }

    @Test
    void saveTemplate_delegatesToWorkoutTemplateService() {
        WorkoutTemplateDTO dto = WorkoutTemplateDTO.builder().id("client-id-template").name("Test").exercises(new ArrayList<>()).build();
        WorkoutTemplateDTO expected = WorkoutTemplateDTO.builder().id("generated-id").name("Test").build();
        when(workoutTemplateService.saveTemplate("userA@example.com", dto)).thenReturn(expected);

        WorkoutTemplateDTO saved = workoutService.saveTemplate("userA@example.com", dto);
        assertThat(saved.getId()).isEqualTo("generated-id");
        verify(workoutTemplateService).saveTemplate("userA@example.com", dto);
    }

    @Test
    void saveCustomExercise_delegatesToCustomExerciseService() {
        CustomExerciseDTO dto = CustomExerciseDTO.builder().id("client-id-ex").name("Test").build();
        CustomExerciseDTO expected = CustomExerciseDTO.builder().id("generated-ex-id").name("Test").build();
        when(customExerciseService.saveCustomExercise("userA@example.com", dto)).thenReturn(expected);

        CustomExerciseDTO saved = workoutService.saveCustomExercise("userA@example.com", dto);
        assertThat(saved.getId()).isEqualTo("generated-ex-id");
        verify(customExerciseService).saveCustomExercise("userA@example.com", dto);
    }

    @Test
    void importWorkouts_createsCustomExercisesAndPersistsWorkouts() {
        String email = "athlete@example.com";
        when(customExerciseRepository.findByUserEmail(email)).thenReturn(new ArrayList<>());
        when(workoutRepository.save(any(Workout.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkoutImportRequestDTO request = WorkoutImportRequestDTO.builder()
                .customExercises(List.of(
                        CustomExerciseDTO.builder()
                                .name("Press Banca Declinado")
                                .muscle("pecho")
                                .equipment("barra")
                                .build()
                ))
                .workouts(List.of(
                        WorkoutDTO.builder()
                                .name("Push Day")
                                .startedAt(1700000000000L)
                                .finishedAt(1700003600000L)
                                .exercises(List.of(
                                        WorkoutExerciseDTO.builder()
                                                .exerciseId("bench-decline")
                                                .sets(List.of(
                                                        WorkoutSetDTO.builder().type("normal").weight("80").reps("10").completed(true).build(),
                                                        WorkoutSetDTO.builder().type("normal").weight("85").reps("8").completed(true).build()
                                                ))
                                                .build()
                                ))
                                .build()
                ))
                .build();

        WorkoutImportSummaryDTO summary = workoutService.importWorkouts(email, request);

        assertThat(summary.getImportedWorkouts()).isEqualTo(1);
        assertThat(summary.getCreatedExercises()).isEqualTo(1);
        assertThat(summary.getTotalSets()).isEqualTo(2);

        verify(customExerciseRepository).save(any(CustomExercise.class));
        verify(workoutRepository).save(any(Workout.class));
    }

    @Test
    void importWorkouts_doesNotDuplicateExistingCustomExercises() {
        String email = "athlete@example.com";
        CustomExercise existing = CustomExercise.builder()
                .id("ex-1")
                .name("Press Banca Declinado")
                .userEmail(email)
                .build();
        when(customExerciseRepository.findByUserEmail(email)).thenReturn(List.of(existing));

        WorkoutImportRequestDTO request = WorkoutImportRequestDTO.builder()
                .customExercises(List.of(
                        CustomExerciseDTO.builder()
                                .name("press banca declinado")
                                .build()
                ))
                .workouts(List.of(
                        WorkoutDTO.builder()
                                .name("Session")
                                .startedAt(1700000000000L)
                                .exercises(new ArrayList<>())
                                .build()
                ))
                .build();

        WorkoutImportSummaryDTO summary = workoutService.importWorkouts(email, request);

        assertThat(summary.getImportedWorkouts()).isEqualTo(1);
        assertThat(summary.getCreatedExercises()).isEqualTo(0);
        verify(customExerciseRepository, never()).save(any());
    }

    @Test
    void importWorkouts_translatesClientExerciseIdToResolvedIdAndPreventsIDOR() {
        String email = "athlete@example.com";
        when(customExerciseRepository.findByUserEmail(email)).thenReturn(new ArrayList<>());

        ArgumentCaptor<CustomExercise> customCaptor =
                ArgumentCaptor.forClass(CustomExercise.class);
        ArgumentCaptor<Workout> workoutCaptor =
                ArgumentCaptor.forClass(Workout.class);

        when(workoutRepository.save(workoutCaptor.capture())).thenAnswer(invocation -> invocation.getArgument(0));

        WorkoutImportRequestDTO request = WorkoutImportRequestDTO.builder()
                .customExercises(List.of(
                        CustomExerciseDTO.builder()
                                .id("malicious-or-temp-client-id")
                                .name("Press Inclinado Especial")
                                .muscle("pecho")
                                .build()
                ))
                .workouts(List.of(
                        WorkoutDTO.builder()
                                .name("Chest Day")
                                .startedAt(1700000000000L)
                                .exercises(List.of(
                                        WorkoutExerciseDTO.builder()
                                                .exerciseId("malicious-or-temp-client-id")
                                                .sets(new ArrayList<>())
                                                .build()
                                ))
                                .build()
                ))
                .build();

        workoutService.importWorkouts(email, request);

        verify(customExerciseRepository).save(customCaptor.capture());
        CustomExercise savedEx = customCaptor.getValue();

        // Assert IDOR is prevented: client ID is ignored and a fresh server-side UUID is generated
        assertThat(savedEx.getId()).isNotNull();
        assertThat(savedEx.getId()).isNotEqualTo("malicious-or-temp-client-id");
        assertThat(savedEx.getUserEmail()).isEqualTo(email);

        // Assert WorkoutExercise ID is translated to the resolved server-side ID
        Workout savedWorkout = workoutCaptor.getValue();
        assertThat(savedWorkout.getExercises()).hasSize(1);
        WorkoutExercise savedWe = savedWorkout.getExercises().iterator().next();
        assertThat(savedWe.getExerciseId()).isEqualTo(savedEx.getId());
    }

    @Test
    void getWorkoutHistory_clampsSizeTo100WhenRequestedExceedsMax() {
        String email = "athlete@example.com";
        ArgumentCaptor<Pageable> pageableCaptor =
                ArgumentCaptor.forClass(Pageable.class);

        when(workoutRepository.findByUserEmailOrderByStartedAtDesc(eq(email), pageableCaptor.capture()))
                .thenReturn(Page.empty());

        workoutService.getWorkoutHistory(email, 0, 1_000_000);

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getPageSize()).isEqualTo(100);
        assertThat(captured.getPageNumber()).isEqualTo(0);
    }

    @Test
    void getWorkoutHistory_clampsNegativePageAndZeroSize() {
        String email = "athlete@example.com";
        ArgumentCaptor<Pageable> pageableCaptor =
                ArgumentCaptor.forClass(Pageable.class);

        when(workoutRepository.findByUserEmailOrderByStartedAtDesc(eq(email), pageableCaptor.capture()))
                .thenReturn(Page.empty());

        workoutService.getWorkoutHistory(email, -5, 0);

        Pageable captured = pageableCaptor.getValue();
        assertThat(captured.getPageSize()).isEqualTo(1);
        assertThat(captured.getPageNumber()).isEqualTo(0);
    }

    @Test
    void getStats_calculatesRealMetricsAccuratelyViaDatabaseAggregation() {
        String email = "athlete@example.com";

        WorkoutStatsProjection projection = Mockito.mock(WorkoutStatsProjection.class);
        when(projection.getTotalWorkouts()).thenReturn(3L);
        when(projection.getTotalDurationSeconds()).thenReturn(7200L);
        when(projection.getTotalSets()).thenReturn(15L);
        when(projection.getTotalVolume()).thenReturn(new BigDecimal("12500.50"));

        when(workoutRepository.getWorkoutStats(email)).thenReturn(projection);

        WorkoutStatsDTO stats = workoutService.getStats(email);

        assertThat(stats.getTotalWorkouts()).isEqualTo(3);
        assertThat(stats.getTotalDurationSeconds()).isEqualTo(7200);
        assertThat(stats.getTotalSets()).isEqualTo(15);
        assertThat(stats.getTotalVolume()).isEqualTo(12500.5);

        // Verify that database aggregation is used and full entities are NEVER loaded into memory
        verify(workoutRepository).getWorkoutStats(email);
        verify(workoutRepository, never()).findAllByUserEmailOrderByStartedAtDesc(anyString());
    }

    @Test
    void getStats_whenNoWorkoutsExist_returnsZeroedStatsWithoutLoadingEntities() {
        String email = "newuser@example.com";
        when(workoutRepository.getWorkoutStats(email)).thenReturn(null);

        WorkoutStatsDTO stats = workoutService.getStats(email);

        assertThat(stats.getTotalWorkouts()).isEqualTo(0);
        assertThat(stats.getTotalDurationSeconds()).isEqualTo(0);
        assertThat(stats.getTotalSets()).isEqualTo(0);
        assertThat(stats.getTotalVolume()).isEqualTo(0.0);

        verify(workoutRepository).getWorkoutStats(email);
        verify(workoutRepository, never()).findAllByUserEmailOrderByStartedAtDesc(anyString());
    }
}

