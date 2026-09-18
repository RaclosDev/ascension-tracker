package com.ascension.service;

import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.UserSettings;
import com.ascension.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserSettingsRepository settingsRepository;

    public UserSettingsDTO getSettings(String userEmail) {
        UserSettings settings = settingsRepository.findSettings(userEmail)
                .orElseGet(() -> createDefaults(userEmail));
        return toDTO(settings);
    }

    @Transactional
    public UserSettingsDTO updateSettings(String userEmail, UserSettingsDTO dto) {
        UserSettings settings = settingsRepository.findSettings(userEmail)
                .orElseGet(() -> createDefaults(userEmail));

        if (dto.getStartWeight() != null) settings.setStartWeight(dto.getStartWeight());
        if (dto.getGoalWeight() != null) settings.setGoalWeight(dto.getGoalWeight());
        if (dto.getWeeklyGoal() != null) settings.setWeeklyGoal(dto.getWeeklyGoal());
        if (dto.getStartDate() != null) settings.setStartDate(dto.getStartDate());
        if (dto.getKcal() != null) settings.setKcal(dto.getKcal());
        if (dto.getMacroStrategy() != null) settings.setMacroStrategy(dto.getMacroStrategy());
        if (dto.getCustomProteinPct() != null) settings.setCustomProteinPct(dto.getCustomProteinPct());
        if (dto.getCustomFatPct() != null) settings.setCustomFatPct(dto.getCustomFatPct());
        if (dto.getCustomCarbsPct() != null) settings.setCustomCarbsPct(dto.getCustomCarbsPct());
        if (dto.getCustomProteinGrams() != null) settings.setCustomProteinGrams(dto.getCustomProteinGrams());
        if (dto.getCustomFatGrams() != null) settings.setCustomFatGrams(dto.getCustomFatGrams());
        if (dto.getCustomCarbsGrams() != null) settings.setCustomCarbsGrams(dto.getCustomCarbsGrams());
        if (dto.getWorkoutData() != null) settings.setWorkoutData(dto.getWorkoutData());

        if ("CUSTOM_GRAMS".equals(settings.getMacroStrategy())) {
            double p = settings.getCustomProteinGrams() != null ? settings.getCustomProteinGrams() : 150.0;
            double f = settings.getCustomFatGrams() != null ? settings.getCustomFatGrams() : 60.0;
            double c = settings.getCustomCarbsGrams() != null ? settings.getCustomCarbsGrams() : 150.0;
            settings.setKcal((int) Math.round(p * 4 + f * 9 + c * 4));
        }

        return toDTO(settingsRepository.save(settings));
    }

    private UserSettings createDefaults(String userEmail) {
        UserSettings defaults = UserSettings.builder()
                .userEmail(userEmail)
                .startWeight(89.4)
                .goalWeight(74.0)
                .weeklyGoal(1.0)
                .startDate(LocalDate.of(2026, 5, 25))
                .kcal(1900)
                .macroStrategy("BALANCED")
                .customProteinPct(30.0)
                .customFatPct(35.0)
                .customCarbsPct(35.0)
                .customProteinGrams(150.0)
                .customFatGrams(60.0)
                .customCarbsGrams(150.0)
                .build();
        return settingsRepository.save(defaults);
    }

    private UserSettingsDTO toDTO(UserSettings s) {
        return UserSettingsDTO.builder()
                .startWeight(s.getStartWeight())
                .goalWeight(s.getGoalWeight())
                .weeklyGoal(s.getWeeklyGoal())
                .startDate(s.getStartDate())
                .kcal(s.getKcal())
                .macroStrategy(s.getMacroStrategy() != null ? s.getMacroStrategy() : "BALANCED")
                .customProteinPct(s.getCustomProteinPct())
                .customFatPct(s.getCustomFatPct())
                .customCarbsPct(s.getCustomCarbsPct())
                .customProteinGrams(s.getCustomProteinGrams())
                .customFatGrams(s.getCustomFatGrams())
                .customCarbsGrams(s.getCustomCarbsGrams())
                .workoutData(s.getWorkoutData())
                .build();
    }
}
