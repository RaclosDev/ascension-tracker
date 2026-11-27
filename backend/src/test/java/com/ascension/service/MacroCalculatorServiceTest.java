package com.ascension.service;

import com.ascension.dto.MacrosDTO;
import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.WeightEntry;
import com.ascension.repository.WeightEntryRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MacroCalculatorServiceTest {

    @Mock
    private SettingsService settingsService;

    @Mock
    private WeightEntryRepository weightEntryRepository;

    @Mock
    private NutritionLogService nutritionLogService;

    @Mock
    private ApplicationContext applicationContext;

    /** No coach plan in force: Mockito answers Optional.empty(), so the user's own settings apply. */
    @Mock
    private NutritionPlanService nutritionPlanService;

    @Mock
    private ClientProgramService clientProgramService;

    @InjectMocks
    private MacroCalculatorService macroCalculatorService;

    @Test
    void getMacros_withNullSettings_usesSafeDefaultsWithoutNPE() {
        String email = "newuser@example.com";
        when(settingsService.getSettings(email)).thenReturn(null);

        MacrosDTO macros = macroCalculatorService.getMacros(email);

        assertThat(macros).isNotNull();
        assertThat(macros.getKcal()).isEqualTo(2000);
        assertThat(macros.getProtein()).isGreaterThan(0.0);
        assertThat(macros.getFat()).isGreaterThan(0.0);
        assertThat(macros.getCarbs()).isGreaterThan(0.0);
    }

    @Test
    void getMacros_withCustomGrams_calculatesCorrectKcalAndMacros() {
        String email = "athlete@example.com";
        UserSettingsDTO settings = UserSettingsDTO.builder()
                .macroStrategy("CUSTOM_GRAMS")
                .customProteinGrams(160.0)
                .customFatGrams(70.0)
                .customCarbsGrams(200.0)
                .build();

        when(settingsService.getSettings(email)).thenReturn(settings);

        MacrosDTO macros = macroCalculatorService.getMacros(email);

        // kcal = (160 * 4) + (70 * 9) + (200 * 4) = 640 + 630 + 800 = 2070
        assertThat(macros.getKcal()).isEqualTo(2070);
        assertThat(macros.getProtein()).isEqualTo(160.0);
        assertThat(macros.getFat()).isEqualTo(70.0);
        assertThat(macros.getCarbs()).isEqualTo(200.0);
    }

    @Test
    void getMacros_balancedWithHeavyAthleteAndLowKcal_neverSumsMoreThanTheCalories() {
        String email = "heavy@example.com";
        UserSettingsDTO settings = UserSettingsDTO.builder().macroStrategy("BALANCED").kcal(1200).build();
        WeightEntry heavy = new WeightEntry();
        heavy.setWeight(140.0);
        when(settingsService.getSettings(email)).thenReturn(settings);
        when(weightEntryRepository.findTopByUserEmailOrderByDateDesc(email)).thenReturn(Optional.of(heavy));

        MacrosDTO macros = macroCalculatorService.getMacros(email);

        double total = macros.getProtein() * 4 + macros.getCarbs() * 4 + macros.getFat() * 9;
        assertThat(macros.getKcal()).isEqualTo(1200);
        assertThat(total).isLessThanOrEqualTo(1200.0 + 0.5);
        assertThat(macros.getCarbs()).isGreaterThanOrEqualTo(0.0);
        assertThat(macros.getProtein()).isLessThan(280.0);
    }

    @Test
    void getMacros_balancedWithNormalWeight_keepsTwoGramsOfProteinPerKilo() {
        String email = "normal@example.com";
        UserSettingsDTO settings = UserSettingsDTO.builder().macroStrategy("BALANCED").kcal(2500).build();
        WeightEntry normal = new WeightEntry();
        normal.setWeight(80.0);
        when(settingsService.getSettings(email)).thenReturn(settings);
        when(weightEntryRepository.findTopByUserEmailOrderByDateDesc(email)).thenReturn(Optional.of(normal));

        MacrosDTO macros = macroCalculatorService.getMacros(email);

        assertThat(macros.getProtein()).isEqualTo(160.0);
        double total = macros.getProtein() * 4 + macros.getCarbs() * 4 + macros.getFat() * 9;
        assertThat(total).isBetween(2499.0, 2501.0);
    }
}
