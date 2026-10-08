package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.*;
import com.ascension.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;
    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final CustomExerciseRepository customExerciseRepository;
    private final WorkoutMapper workoutMapper;

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<WorkoutDTO> getWorkoutHistory(String userEmail, int page, int size) {
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Workout> w = workoutRepository.findByUserEmailOrderByStartedAtDesc(userEmail, pageRequest);
        return w.map(this::toFullDTO);
    }

    @Transactional(readOnly = true)
    public List<WorkoutDTO> getRecentWorkouts(String userEmail, Long since) {
        List<Workout> w = workoutRepository.findByUserEmailAndStartedAtGreaterThanEqualOrderByStartedAtDesc(userEmail, since);
        return w.stream().map(this::toFullDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkoutDTO getWorkoutDetail(String userEmail, String id) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Entreno no encontrado"));
        return toFullDTO(workout);
    }

    @Transactional
    public WorkoutDTO saveWorkout(String userEmail, WorkoutDTO dto) {
        Workout workout = Workout.builder()
                .id(java.util.UUID.randomUUID().toString())
                .userEmail(userEmail)
                .name(dto.getName())
                .startedAt(dto.getStartedAt())
                .finishedAt(dto.getFinishedAt())
                .notes(dto.getNotes())
                .exercises(new java.util.LinkedHashSet<>())
                .build();

        if (dto.getExercises() != null) {
            int order = 0;
            for (WorkoutExerciseDTO weDTO : dto.getExercises()) {
                WorkoutExercise we = WorkoutExercise.builder()
                        .id(weDTO.getId())
                        .workout(workout)
                        .exerciseId(weDTO.getExerciseId())
                        .notes(weDTO.getNotes())
                        .supersetId(weDTO.getSupersetId())
                        .orderIndex(order++)
                        .sets(new java.util.LinkedHashSet<>())
                        .build();

                if (weDTO.getSets() != null) {
                    int setOrder = 0;
                    for (WorkoutSetDTO setDTO : weDTO.getSets()) {
                        WorkoutSet set = WorkoutSet.builder()
                                .id(setDTO.getId())
                                .workoutExercise(we)
                                .orderIndex(setOrder++)
                                .type(setDTO.getType())
                                .weight(setDTO.getWeight())
                                .reps(setDTO.getReps())
                                .distance(setDTO.getDistance())
                                .duration(setDTO.getDuration())
                                .rpe(setDTO.getRpe())
                                .completed(setDTO.getCompleted() != null ? setDTO.getCompleted() : false)
                                .build();
                        we.getSets().add(set);
                    }
                }
                workout.getExercises().add(we);
            }
        }
        return toFullDTO(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutDTO updateWorkout(String userEmail, String id, WorkoutDTO dto) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Entreno no encontrado"));

        workout.setName(dto.getName() != null ? dto.getName() : workout.getName());
        workout.setStartedAt(dto.getStartedAt());
        workout.setFinishedAt(dto.getFinishedAt());
        workout.setNotes(dto.getNotes());

        workout.getExercises().clear();

        if (dto.getExercises() != null) {
            int order = 0;
            for (WorkoutExerciseDTO weDTO : dto.getExercises()) {
                WorkoutExercise we = WorkoutExercise.builder()
                        .id(weDTO.getId())
                        .workout(workout)
                        .exerciseId(weDTO.getExerciseId())
                        .notes(weDTO.getNotes())
                        .supersetId(weDTO.getSupersetId())
                        .orderIndex(order++)
                        .sets(new java.util.LinkedHashSet<>())
                        .build();

                if (weDTO.getSets() != null) {
                    int setOrder = 0;
                    for (WorkoutSetDTO setDTO : weDTO.getSets()) {
                        WorkoutSet set = WorkoutSet.builder()
                                .id(setDTO.getId())
                                .workoutExercise(we)
                                .orderIndex(setOrder++)
                                .type(setDTO.getType())
                                .weight(setDTO.getWeight())
                                .reps(setDTO.getReps())
                                .distance(setDTO.getDistance())
                                .duration(setDTO.getDuration())
                                .rpe(setDTO.getRpe())
                                .completed(setDTO.getCompleted() != null ? setDTO.getCompleted() : false)
                                .build();
                        we.getSets().add(set);
                    }
                }
                workout.getExercises().add(we);
            }
        }

        return toFullDTO(workoutRepository.save(workout));
    }

    @Transactional
    public void deleteWorkout(String userEmail, String id) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Entreno no encontrado"));
        workoutRepository.delete(workout);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public WorkoutStatsDTO getStats(String userEmail) {
        // Just return dummy or updated stats logic
        long totalWorkouts = workoutRepository.countByUserEmail(userEmail);
        return WorkoutStatsDTO.builder()
                .totalWorkouts(totalWorkouts)
                .build();
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<WorkoutExerciseDTO> getExerciseHistory(String userEmail, String exerciseId) {
        return workoutExerciseRepository.findByUserEmailAndExerciseIdOrderByDateDesc(userEmail, exerciseId)
                .stream().map(this::toWorkoutExerciseDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkoutTemplateDTO> getTemplates(String userEmail) {
        return workoutTemplateRepository.findByUserEmail(userEmail)
                .stream().map(this::toTemplateDTO).collect(Collectors.toList());
    }

    @Transactional
    public WorkoutTemplateDTO saveTemplate(String userEmail, WorkoutTemplateDTO dto) {
        WorkoutTemplate template = WorkoutTemplate.builder()
                .id(java.util.UUID.randomUUID().toString())
                .userEmail(userEmail)
                .name(dto.getName())
                .exercises(dto.getExercises().stream().map(e -> new com.ascension.model.TemplateExercise(e.getExerciseId(), e.getVariant() != null ? e.getVariant().getGrip() : null, e.getVariant() != null ? e.getVariant().getMachine() : null)).collect(java.util.stream.Collectors.toList()))
                .build();
        return toTemplateDTO(workoutTemplateRepository.save(template));
    }

    @Transactional
    public void deleteTemplate(String userEmail, String id) {
        WorkoutTemplate template = workoutTemplateRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new com.ascension.exception.EntityNotFoundException("Plantilla no encontrada"));
        workoutTemplateRepository.delete(template);
    }

    private WorkoutDTO toFullDTO(Workout w) {
        return workoutMapper.toDTO(w);
    }

    private WorkoutExerciseDTO toWorkoutExerciseDTO(WorkoutExercise we) {
        return workoutMapper.toDTO(we);
    }

    private WorkoutSetDTO toSetDTO(WorkoutSet s) {
        return workoutMapper.toDTO(s);
    }

    private WorkoutTemplateDTO toTemplateDTO(WorkoutTemplate t) {
        return WorkoutTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .exercises(t.getExercises().stream().map(e -> {
                    com.ascension.dto.WorkoutExerciseDTO.VariantDTO var = null;
                    if (e.getVariantGrip() != null || e.getVariantMachine() != null) {
                        var = new com.ascension.dto.WorkoutExerciseDTO.VariantDTO(e.getVariantGrip(), e.getVariantMachine());
                    }
                    return new com.ascension.dto.TemplateExerciseDTO(e.getExerciseId(), var);
                }).collect(java.util.stream.Collectors.toList()))
                .build();
    }

    // --- Custom Exercises ---
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<CustomExerciseDTO> getCustomExercises(String userEmail) {
        return customExerciseRepository.findByUserEmail(userEmail).stream()
                .map(this::toCustomExerciseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomExerciseDTO saveCustomExercise(String userEmail, CustomExerciseDTO dto) {
        CustomExercise ex = CustomExercise.builder()
                .id(java.util.UUID.randomUUID().toString())
                .name(dto.getName())
                .muscle(dto.getMuscle())
                .equipment(dto.getEquipment())
                .userEmail(userEmail)
                .build();
        ex = customExerciseRepository.save(ex);
        return toCustomExerciseDTO(ex);
    }

    @Transactional
    public void deleteCustomExercise(String userEmail, String id) {
        customExerciseRepository.deleteByUserEmailAndId(userEmail, id);
    }

    private CustomExerciseDTO toCustomExerciseDTO(CustomExercise ex) {
        return CustomExerciseDTO.builder()
                .id(ex.getId())
                .name(ex.getName())
                .muscle(ex.getMuscle())
                .equipment(ex.getEquipment())
                .userEmail(ex.getUserEmail())
                .build();
    }
}
