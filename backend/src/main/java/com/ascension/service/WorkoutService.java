package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.exception.EntityNotFoundException;
import com.ascension.model.*;
import com.ascension.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutService {

    private final WorkoutRepository workoutRepository;
    private final WorkoutExerciseRepository workoutExerciseRepository;
    private final WorkoutTemplateService workoutTemplateService;
    private final CustomExerciseService customExerciseService;
    private final CustomExerciseRepository customExerciseRepository;
    private final WorkoutMapper workoutMapper;
    private final UserDataQuotaService userDataQuotaService;

    @Transactional(readOnly = true)
    public Page<WorkoutDTO> getWorkoutHistory(String userEmail, int page, int size) {
        int boundedPage = Math.max(0, page);
        int boundedSize = Math.min(Math.max(1, size), 100);
        PageRequest pageRequest = PageRequest.of(boundedPage, boundedSize);
        Page<Workout> w = workoutRepository.findByUserEmailOrderByStartedAtDesc(userEmail, pageRequest);
        return w.map(this::toFullDTO);
    }

    @Transactional(readOnly = true)
    public List<WorkoutDTO> getRecentWorkouts(String userEmail, Long since) {
        Long boundedSince = (since != null && since >= 0) ? since : 0L;
        List<Workout> w = workoutRepository.findByUserEmailAndStartedAtGreaterThanEqualOrderByStartedAtDesc(userEmail, boundedSince);
        return w.stream().map(this::toFullDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkoutDTO getWorkoutDetail(String userEmail, String id) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Entreno no encontrado"));
        return toFullDTO(workout);
    }

    @Transactional
    public WorkoutDTO saveWorkout(String userEmail, WorkoutDTO dto) {
        userDataQuotaService.checkWorkoutQuota(userEmail, 1);
        Workout workout = Workout.builder()
                .id(UUID.randomUUID().toString())
                .userEmail(userEmail)
                .name(dto.getName())
                .startedAt(dto.getStartedAt())
                .finishedAt(dto.getFinishedAt())
                .notes(dto.getNotes())
                .exercises(new LinkedHashSet<>())
                .build();

        mapExercisesToWorkout(workout, dto.getExercises());
        return toFullDTO(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutDTO updateWorkout(String userEmail, String id, WorkoutDTO dto) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Entreno no encontrado"));

        workout.setName(dto.getName() != null ? dto.getName() : workout.getName());
        workout.setStartedAt(dto.getStartedAt());
        workout.setFinishedAt(dto.getFinishedAt());
        workout.setNotes(dto.getNotes());

        workout.getExercises().clear();

        mapExercisesToWorkout(workout, dto.getExercises());

        return toFullDTO(workoutRepository.save(workout));
    }

    @Transactional
    public void deleteWorkout(String userEmail, String id) {
        Workout workout = workoutRepository.findByIdAndUserEmail(id, userEmail)
                .orElseThrow(() -> new EntityNotFoundException("Entreno no encontrado"));
        workoutRepository.delete(workout);
    }

    @Transactional(readOnly = true)
    public WorkoutStatsDTO getStats(String userEmail) {
        WorkoutStatsProjection p = workoutRepository.getWorkoutStats(userEmail);
        if (p == null) {
            return WorkoutStatsDTO.builder()
                    .totalWorkouts(0)
                    .totalDurationSeconds(0)
                    .totalVolume(0.0)
                    .totalSets(0)
                    .build();
        }

        double volume = p.getTotalVolume() != null ? p.getTotalVolume().doubleValue() : 0.0;
        return WorkoutStatsDTO.builder()
                .totalWorkouts(p.getTotalWorkouts())
                .totalDurationSeconds(p.getTotalDurationSeconds())
                .totalVolume(Math.round(volume * 100.0) / 100.0)
                .totalSets(p.getTotalSets())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WorkoutExerciseDTO> getExerciseHistory(String userEmail, String exerciseId) {
        return workoutExerciseRepository.findByUserEmailAndExerciseIdOrderByDateDesc(userEmail, exerciseId)
                .stream().map(this::toWorkoutExerciseDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkoutTemplateDTO> getTemplates(String userEmail) {
        return workoutTemplateService.getTemplates(userEmail);
    }

    @Transactional
    public WorkoutTemplateDTO saveTemplate(String userEmail, WorkoutTemplateDTO dto) {
        return workoutTemplateService.saveTemplate(userEmail, dto);
    }

    @Transactional
    public void deleteTemplate(String userEmail, String id) {
        workoutTemplateService.deleteTemplate(userEmail, id);
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

    @Transactional(readOnly = true)
    public List<CustomExerciseDTO> getCustomExercises(String userEmail) {
        return customExerciseService.getCustomExercises(userEmail);
    }

    @Transactional
    public CustomExerciseDTO saveCustomExercise(String userEmail, CustomExerciseDTO dto) {
        return customExerciseService.saveCustomExercise(userEmail, dto);
    }

    @Transactional
    public void deleteCustomExercise(String userEmail, String id) {
        customExerciseService.deleteCustomExercise(userEmail, id);
    }

    @Transactional
    public WorkoutImportSummaryDTO importWorkouts(String userEmail, WorkoutImportRequestDTO request) {
        if (request == null || request.getWorkouts() == null) {
            return WorkoutImportSummaryDTO.builder().build();
        }

        int incomingWorkouts = request.getWorkouts().size();
        userDataQuotaService.checkWorkoutQuota(userEmail, incomingWorkouts);
        if (request.getCustomExercises() != null && !request.getCustomExercises().isEmpty()) {
            userDataQuotaService.checkCustomExerciseQuota(userEmail, request.getCustomExercises().size());
        }

        int createdExercises = 0;
        Map<String, String> customExMap = new HashMap<>();
        for (CustomExercise ex : customExerciseRepository.findByUserEmail(userEmail)) {
            if (ex.getName() != null) {
                customExMap.put(ex.getName().trim().toLowerCase(), ex.getId());
            }
        }

        // Map client-side exerciseId -> backend resolved exerciseId
        Map<String, String> clientToResolvedId = new HashMap<>();

        if (request.getCustomExercises() != null) {
            for (CustomExerciseDTO exDTO : request.getCustomExercises()) {
                if (exDTO.getName() == null || exDTO.getName().trim().isEmpty()) continue;
                String normalizedName = exDTO.getName().trim().toLowerCase();
                String resolvedId;
                if (!customExMap.containsKey(normalizedName)) {
                    // Prevent IDOR: always generate a fresh server-side UUID
                    resolvedId = UUID.randomUUID().toString();
                    CustomExercise newEx = CustomExercise.builder()
                            .id(resolvedId)
                            .name(exDTO.getName().trim())
                            .muscle(exDTO.getMuscle() != null ? exDTO.getMuscle() : "pecho")
                            .equipment(exDTO.getEquipment() != null ? exDTO.getEquipment() : "peso corporal")
                            .userEmail(userEmail)
                            .build();
                    customExerciseRepository.save(newEx);
                    customExMap.put(normalizedName, resolvedId);
                    createdExercises++;
                } else {
                    resolvedId = customExMap.get(normalizedName);
                }

                if (exDTO.getId() != null) {
                    clientToResolvedId.put(exDTO.getId(), resolvedId);
                }
            }
        }

        int importedWorkouts = 0;
        int totalSets = 0;

        for (WorkoutDTO wDTO : request.getWorkouts()) {
            Workout workout = Workout.builder()
                    .id(UUID.randomUUID().toString())
                    .userEmail(userEmail)
                    .name(wDTO.getName() != null ? wDTO.getName() : "Entrenamiento importado")
                    .startedAt(wDTO.getStartedAt())
                    .finishedAt(wDTO.getFinishedAt())
                    .notes(wDTO.getNotes())
                    .exercises(new LinkedHashSet<>())
                    .build();

            mapExercisesToWorkout(workout, wDTO.getExercises(), clientToResolvedId);
            workoutRepository.save(workout);
            importedWorkouts++;
            if (wDTO.getExercises() != null) {
                for (WorkoutExerciseDTO we : wDTO.getExercises()) {
                    if (we.getSets() != null) {
                        totalSets += we.getSets().size();
                    }
                }
            }
        }

        return WorkoutImportSummaryDTO.builder()
                .importedWorkouts(importedWorkouts)
                .createdExercises(createdExercises)
                .totalSets(totalSets)
                .build();
    }

    private void mapExercisesToWorkout(Workout workout, List<WorkoutExerciseDTO> exerciseDTOs) {
        mapExercisesToWorkout(workout, exerciseDTOs, Collections.emptyMap());
    }

    private void mapExercisesToWorkout(
            Workout workout,
            List<WorkoutExerciseDTO> exerciseDTOs,
            Map<String, String> idTranslationMap) {
        if (exerciseDTOs == null) return;
        int order = 0;
        for (WorkoutExerciseDTO weDTO : exerciseDTOs) {
            String rawExId = weDTO.getExerciseId();
            String resolvedExId = (idTranslationMap != null && rawExId != null)
                ? idTranslationMap.getOrDefault(rawExId, rawExId)
                : rawExId;

            WorkoutExercise we = WorkoutExercise.builder()
                    .id(UUID.randomUUID().toString())
                    .workout(workout)
                    .exerciseId(resolvedExId)
                    .notes(weDTO.getNotes())
                    .variantGrip(weDTO.getVariant() != null ? weDTO.getVariant().getGrip() : null)
                    .variantMachine(weDTO.getVariant() != null ? weDTO.getVariant().getMachine() : null)
                    .supersetId(weDTO.getSupersetId())
                    .orderIndex(order++)
                    .sets(new LinkedHashSet<>())
                    .build();

            if (weDTO.getSets() != null) {
                int setOrder = 0;
                for (WorkoutSetDTO setDTO : weDTO.getSets()) {
                    WorkoutSet set = WorkoutSet.builder()
                            .id(UUID.randomUUID().toString())
                            .workoutExercise(we)
                            .orderIndex(setOrder++)
                            .type(setDTO.getType())
                            .weight(workoutMapper.stringToBigDecimal(setDTO.getWeight()))
                            .reps(workoutMapper.stringToBigDecimal(setDTO.getReps()))
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
}
