package com.ascension.service;

import com.ascension.dto.WorkoutPreferencesDTO;
import com.ascension.model.UserSettings;
import com.ascension.repository.UserSettingsRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityNotFoundException;

import java.util.ArrayList;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class WorkoutPreferencesService {

    private final UserSettingsRepository userSettingsRepository;
    private final ObjectMapper objectMapper;

    public WorkoutPreferencesDTO getPreferences(String email) {
        UserSettings settings = userSettingsRepository.findByUserEmail(email)
                .orElse(null);
        
        if (settings == null || settings.getWorkoutData() == null) {
            return getDefaultPreferences();
        }

        try {
            WorkoutPreferencesDTO dto = objectMapper.readValue(settings.getWorkoutData(), WorkoutPreferencesDTO.class);
            return ensureDefaults(dto);
        } catch (JsonProcessingException e) {
            return getDefaultPreferences();
        }
    }

    @Transactional
    public WorkoutPreferencesDTO updatePreferences(String email, WorkoutPreferencesDTO dto) {
        UserSettings settings = userSettingsRepository.findByUserEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("User settings not found for: " + email));

        try {
            String json = objectMapper.writeValueAsString(ensureDefaults(dto));
            settings.setWorkoutData(json);
            userSettingsRepository.save(settings);
            return dto;
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing workout preferences", e);
        }
    }

    private WorkoutPreferencesDTO getDefaultPreferences() {
        return WorkoutPreferencesDTO.builder()
                .globalMachines(new ArrayList<>(java.util.List.of("Hammer Strength", "Technogym", "Technogym Discos")))
                .globalGrips(new ArrayList<>())
                .exerciseAliases(new HashMap<>())
                .exerciseVariants(new HashMap<>())
                .hiddenEquipments(new ArrayList<>())
                .exerciseGifs(new HashMap<>())
                .restTimers(new HashMap<>())
                .restPreset(90)
                .build();
    }

    private WorkoutPreferencesDTO ensureDefaults(WorkoutPreferencesDTO dto) {
        if (dto.getGlobalMachines() == null) dto.setGlobalMachines(new ArrayList<>());
        if (dto.getGlobalGrips() == null) dto.setGlobalGrips(new ArrayList<>());
        if (dto.getExerciseAliases() == null) dto.setExerciseAliases(new HashMap<>());
        if (dto.getExerciseVariants() == null) dto.setExerciseVariants(new HashMap<>());
        if (dto.getHiddenEquipments() == null) dto.setHiddenEquipments(new ArrayList<>());
        if (dto.getExerciseGifs() == null) dto.setExerciseGifs(new HashMap<>());
        if (dto.getRestTimers() == null) dto.setRestTimers(new HashMap<>());
        if (dto.getRestPreset() == null) dto.setRestPreset(90);
        return dto;
    }
}
