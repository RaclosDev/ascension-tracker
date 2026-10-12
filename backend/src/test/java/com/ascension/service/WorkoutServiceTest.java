package com.ascension.service;

import com.ascension.dto.WorkoutDTO;
import com.ascension.model.Workout;
import com.ascension.repository.WorkoutRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mapstruct.factory.Mappers;
import com.ascension.service.WorkoutMapper;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
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
                .isInstanceOf(com.ascension.exception.EntityNotFoundException.class);

        verify(workoutRepository, never()).save(any());
    }

    @Test
    void saveTemplate_delegatesToWorkoutTemplateService() {
        com.ascension.dto.WorkoutTemplateDTO dto = com.ascension.dto.WorkoutTemplateDTO.builder().id("client-id-template").name("Test").exercises(new ArrayList<>()).build();
        com.ascension.dto.WorkoutTemplateDTO expected = com.ascension.dto.WorkoutTemplateDTO.builder().id("generated-id").name("Test").build();
        when(workoutTemplateService.saveTemplate("userA@example.com", dto)).thenReturn(expected);

        com.ascension.dto.WorkoutTemplateDTO saved = workoutService.saveTemplate("userA@example.com", dto);
        assertThat(saved.getId()).isEqualTo("generated-id");
        verify(workoutTemplateService).saveTemplate("userA@example.com", dto);
    }

    @Test
    void saveCustomExercise_delegatesToCustomExerciseService() {
        com.ascension.dto.CustomExerciseDTO dto = com.ascension.dto.CustomExerciseDTO.builder().id("client-id-ex").name("Test").build();
        com.ascension.dto.CustomExerciseDTO expected = com.ascension.dto.CustomExerciseDTO.builder().id("generated-ex-id").name("Test").build();
        when(customExerciseService.saveCustomExercise("userA@example.com", dto)).thenReturn(expected);

        com.ascension.dto.CustomExerciseDTO saved = workoutService.saveCustomExercise("userA@example.com", dto);
        assertThat(saved.getId()).isEqualTo("generated-ex-id");
        verify(customExerciseService).saveCustomExercise("userA@example.com", dto);
    }
}

