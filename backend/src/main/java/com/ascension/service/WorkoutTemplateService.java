package com.ascension.service;

import com.ascension.dto.TemplateExerciseDTO;
import com.ascension.dto.WorkoutExerciseDTO;
import com.ascension.dto.WorkoutTemplateDTO;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.model.TemplateExercise;
import com.ascension.model.WorkoutTemplate;
import com.ascension.repository.WorkoutTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutTemplateService {

    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final UserDataQuotaService userDataQuotaService;

    @Transactional(readOnly = true)
    public List<WorkoutTemplateDTO> getTemplates(String userEmail) {
        return workoutTemplateRepository.findByUserEmail(userEmail)
                .stream()
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkoutTemplateDTO saveTemplate(String userEmail, WorkoutTemplateDTO dto) {
        userDataQuotaService.checkWorkoutTemplateQuota(userEmail, 1);
        List<TemplateExercise> exercises = dto.getExercises() != null
                ? dto.getExercises().stream()
                        .map(e -> new TemplateExercise(
                                e.getExerciseId(),
                                e.getVariant() != null ? e.getVariant().getGrip() : null,
                                e.getVariant() != null ? e.getVariant().getMachine() : null))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        WorkoutTemplate template = WorkoutTemplate.builder()
                .id(UUID.randomUUID().toString())
                .userEmail(userEmail)
                .name(dto.getName())
                .exercises(exercises)
                .build();

        return toTemplateDTO(workoutTemplateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(String userEmail, String id) {
        WorkoutTemplate template = workoutTemplateRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Plantilla no encontrada"));
        workoutTemplateRepository.delete(template);
    }

    private WorkoutTemplateDTO toTemplateDTO(WorkoutTemplate t) {
        List<TemplateExerciseDTO> exerciseDTOs = t.getExercises() != null
                ? t.getExercises().stream().map(e -> {
                    WorkoutExerciseDTO.VariantDTO var = null;
                    if (e.getVariantGrip() != null || e.getVariantMachine() != null) {
                        var = new WorkoutExerciseDTO.VariantDTO(e.getVariantGrip(), e.getVariantMachine());
                    }
                    return new TemplateExerciseDTO(e.getExerciseId(), var);
                }).collect(Collectors.toList())
                : new ArrayList<>();

        return WorkoutTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .exercises(exerciseDTOs)
                .build();
    }
}
