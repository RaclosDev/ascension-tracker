package com.ascension.service;

import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.UserSettings;
import com.ascension.model.WeightEntry;
import com.ascension.repository.UserSettingsRepository;
import com.ascension.repository.WeightEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettingsServiceTest {

    @Mock
    private UserSettingsRepository settingsRepository;

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @InjectMocks
    private SettingsService settingsService;

    private static final String USER_EMAIL = "test@example.com";

    private UserSettingsDTO firstSettings(String appModules) {
        when(settingsRepository.findSettings(USER_EMAIL)).thenReturn(Optional.empty());
        when(settingsRepository.save(any(UserSettings.class))).thenAnswer(inv -> inv.getArgument(0));
        return UserSettingsDTO.builder()
                .startWeight(82.0)
                .goalWeight(78.0)
                .weeklyGoal(0.5)
                .startDate(LocalDate.now())
                .kcal(2200)
                .appModules(appModules)
                .build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"FULL", "TRAINING_BODY"})
    void seedsTheFirstWeighInWhenBodyTrackingIsOn(String appModules) {
        settingsService.updateSettings(USER_EMAIL, firstSettings(appModules));

        verify(weightEntryRepository).save(any(WeightEntry.class));
    }

    @Test
    void seedsTheFirstWeighInWhenModulesAreNotChosen() {
        settingsService.updateSettings(USER_EMAIL, firstSettings(null));

        verify(weightEntryRepository).save(any(WeightEntry.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"TRAINING", "TRAINING_NUTRITION"})
    void skipsTheWeighInWithoutBodyTracking(String appModules) {
        settingsService.updateSettings(USER_EMAIL, firstSettings(appModules));

        verify(weightEntryRepository, never()).save(any(WeightEntry.class));
    }
}
