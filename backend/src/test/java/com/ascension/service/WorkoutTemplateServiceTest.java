package com.ascension.service;

import com.ascension.dto.TemplateExerciseDTO;
import com.ascension.dto.WorkoutExerciseDTO;
import com.ascension.dto.WorkoutTemplateDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.model.TemplateExercise;
import com.ascension.model.WorkoutTemplate;
import com.ascension.repository.WorkoutTemplateRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkoutTemplateServiceTest {

    @Mock
    private WorkoutTemplateRepository workoutTemplateRepository;

    @Mock
    private UserDataQuotaService userDataQuotaService;

    @InjectMocks
    private WorkoutTemplateService workoutTemplateService;

    @Test
    void getTemplates_returnsMappedList() {
        WorkoutTemplate template = WorkoutTemplate.builder()
                .id("tmpl-1")
                .userEmail("user@example.com")
                .name("Torso Day")
                .exercises(List.of(new TemplateExercise("bench-press", "wide", "flat-bench")))
                .build();

        when(workoutTemplateRepository.findByUserEmail("user@example.com"))
                .thenReturn(List.of(template));

        List<WorkoutTemplateDTO> results = workoutTemplateService.getTemplates("user@example.com");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Torso Day");
        assertThat(results.get(0).getExercises()).hasSize(1);
        assertThat(results.get(0).getExercises().get(0).getExerciseId()).isEqualTo("bench-press");
        assertThat(results.get(0).getExercises().get(0).getVariant()).isNotNull();
        assertThat(results.get(0).getExercises().get(0).getVariant().getGrip()).isEqualTo("wide");
        assertThat(results.get(0).getExercises().get(0).getVariant().getMachine()).isEqualTo("flat-bench");
    }

    @Test
    void saveTemplate_generatesNewIdAndIgnoresClientId() {
        WorkoutTemplateDTO dto = WorkoutTemplateDTO.builder()
                .id("client-supplied-id")
                .name("Pierna Fuerza")
                .exercises(List.of(new TemplateExerciseDTO("squat", null)))
                .build();

        when(workoutTemplateRepository.save(any(WorkoutTemplate.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WorkoutTemplateDTO saved = workoutTemplateService.saveTemplate("user@example.com", dto);

        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getId()).isNotEqualTo("client-supplied-id");
        assertThat(saved.getName()).isEqualTo("Pierna Fuerza");
        assertThat(saved.getExercises()).hasSize(1);
        assertThat(saved.getExercises().get(0).getExerciseId()).isEqualTo("squat");
    }

    @Test
    void deleteTemplate_whenFound_deletesEntity() {
        WorkoutTemplate template = WorkoutTemplate.builder()
                .id("tmpl-1")
                .userEmail("user@example.com")
                .name("ToDelete")
                .build();

        when(workoutTemplateRepository.findByIdAndUserEmail("tmpl-1", "user@example.com"))
                .thenReturn(Optional.of(template));

        workoutTemplateService.deleteTemplate("user@example.com", "tmpl-1");

        verify(workoutTemplateRepository).delete(template);
    }

    @Test
    void deleteTemplate_whenNotFound_throwsEntityNotFoundException() {
        when(workoutTemplateRepository.findByIdAndUserEmail("missing-id", "user@example.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> workoutTemplateService.deleteTemplate("user@example.com", "missing-id"))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessage("Plantilla no encontrada");
    }
}
