package com.ascension.service;

import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.UserSettings;
import com.ascension.model.WeightEntry;
import com.ascension.repository.UserSettingsRepository;
import com.ascension.repository.WeightEntryRepository;
import com.ascension.repository.MealRepository;
import com.ascension.repository.FoodLogRepository;
import com.ascension.repository.StepsEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserSettingsRepository settingsRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final MealRepository mealRepository;
    private final FoodLogRepository foodLogRepository;
    private final StepsEntryRepository stepsEntryRepository;

    public UserSettingsDTO getSettings(String userEmail) {
        return settingsRepository.findSettings(userEmail)
                .map(this::toDTO)
                .orElse(null);
    }

    @Transactional
    public UserSettingsDTO updateSettings(String userEmail, UserSettingsDTO dto) {
        Optional<UserSettings> existing = settingsRepository.findSettings(userEmail);
        boolean isNew = existing.isEmpty();
        UserSettings settings = existing.orElseGet(() -> {
            UserSettings s = new UserSettings();
            s.setUserEmail(userEmail);
            s.setStartWeight(80.0);
            s.setGoalWeight(75.0);
            s.setWeeklyGoal(0.5);
            s.setStartDate(LocalDate.now());
            s.setKcal(2000);
            s.setMacroStrategy("BALANCED");
            s.setCustomProteinPct(30.0);
            s.setCustomFatPct(35.0);
            s.setCustomCarbsPct(35.0);
            return s;
        });

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
        if (dto.getAge() != null) settings.setAge(dto.getAge());
        if (dto.getHeightCm() != null) settings.setHeightCm(dto.getHeightCm());
        if (dto.getSex() != null) settings.setSex(dto.getSex());
        if (dto.getActivityFactor() != null) settings.setActivityFactor(dto.getActivityFactor());
        if (dto.getWorkoutData() != null) settings.setWorkoutData(dto.getWorkoutData());

        if ("CUSTOM_GRAMS".equals(settings.getMacroStrategy())) {
            double p = settings.getCustomProteinGrams() != null ? settings.getCustomProteinGrams() : 150.0;
            double f = settings.getCustomFatGrams() != null ? settings.getCustomFatGrams() : 60.0;
            double c = settings.getCustomCarbsGrams() != null ? settings.getCustomCarbsGrams() : 150.0;
            settings.setKcal((int) Math.round(p * 4 + f * 9 + c * 4));
        }

        if (isNew && dto.getStartWeight() != null) {
            WeightEntry entry = new WeightEntry();
            entry.setUserEmail(userEmail);
            entry.setDate(LocalDate.now());
            entry.setWeight(dto.getStartWeight());
            weightEntryRepository.save(entry);
        }

        return toDTO(settingsRepository.save(settings));
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
                .age(s.getAge())
                .heightCm(s.getHeightCm())
                .sex(s.getSex())
                .activityFactor(s.getActivityFactor())
                .workoutData(s.getWorkoutData())
                .build();
    }
}
