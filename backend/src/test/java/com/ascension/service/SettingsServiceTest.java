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

import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        lenient().when(settingsRepository.save(any(UserSettings.class))).thenAnswer(inv -> inv.getArgument(0));
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

    @Test
    void doesNotSeedTheFirstWeighInWhenTheDayAlreadyHasOne() {
        UserSettingsDTO dto = firstSettings("FULL");
        when(weightEntryRepository.findByUserEmailAndDate(eq(USER_EMAIL), any(LocalDate.class)))
                .thenReturn(Optional.of(new WeightEntry()));

        settingsService.updateSettings(USER_EMAIL, dto);

        verify(weightEntryRepository, never()).save(any(WeightEntry.class));
        verify(settingsRepository).save(any(UserSettings.class));
    }

    @Test
    void rejectsACustomPercentageSplitThatDoesNotAddUpTo100() {
        UserSettingsDTO dto = firstSettings("FULL");
        dto.setMacroStrategy("CUSTOM_PCT");
        dto.setCustomProteinPct(40.0);
        dto.setCustomFatPct(40.0);
        dto.setCustomCarbsPct(40.0);

        assertThatThrownBy(() -> settingsService.updateSettings(USER_EMAIL, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("100");
        verify(settingsRepository, never()).save(any(UserSettings.class));
    }

    @Test
    void acceptsACustomPercentageSplitThatAddsUpTo100() {
        UserSettingsDTO dto = firstSettings("FULL");
        dto.setMacroStrategy("CUSTOM_PCT");
        dto.setCustomProteinPct(30.0);
        dto.setCustomFatPct(30.0);
        dto.setCustomCarbsPct(40.0);

        settingsService.updateSettings(USER_EMAIL, dto);

        verify(settingsRepository).save(any(UserSettings.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"TRAINING", "TRAINING_NUTRITION"})
    void skipsTheWeighInWithoutBodyTracking(String appModules) {
        settingsService.updateSettings(USER_EMAIL, firstSettings(appModules));

        verify(weightEntryRepository, never()).save(any(WeightEntry.class));
    }
}
