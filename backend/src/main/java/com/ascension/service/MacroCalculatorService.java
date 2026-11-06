package com.ascension.service;

import com.ascension.dto.AiDtos.AssistantSummary;
import com.ascension.dto.AiDtos.MacroTotals;
import com.ascension.dto.FoodLogDTO;
import com.ascension.dto.MacrosDTO;
import com.ascension.dto.NutritionPlanDtos;
import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.WeightEntry;
import com.ascension.repository.WeightEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MacroCalculatorService {

    private final SettingsService settingsService;
    private final WeightEntryRepository weightEntryRepository;
    private final NutritionLogService nutritionLogService;
    private final org.springframework.context.ApplicationContext applicationContext;
    private final NutritionPlanService nutritionPlanService;
    private final ClientProgramService clientProgramService;

    private NutritionService getNutritionService() {
        return applicationContext.getBean(NutritionService.class);
    }

    private static final double DEFAULT_WEIGHT_KG = 75.0;

    public MacrosDTO getMacros(String userEmail) {
        return getMacros(userEmail, LocalDate.now());
    }

    /**
     * The targets for {@code date}. A coach's plan in force wins over the user's own settings:
     * training-day targets when an assigned program prescribes a session that day, rest-day ones otherwise.
     */
    public MacrosDTO getMacros(String userEmail, LocalDate date) {
        var plan = nutritionPlanService.inForce(userEmail);
        if (plan.isPresent()) {
            boolean training = clientProgramService.isTrainingDay(userEmail, date);
            var targets = training ? plan.get().training() : plan.get().rest();
            var coach = plan.get().coach();
            return MacrosDTO.builder()
                    .kcal(targets.kcal())
                    .protein((double) targets.protein())
                    .carbs((double) targets.carbs())
                    .fat((double) targets.fat())
                    .coachName(coach.name() != null && !coach.name().isBlank() ? coach.name() : coach.email())
                    .dayType(training ? NutritionPlanDtos.TRAINING : NutritionPlanDtos.REST)
                    .build();
        }
        UserSettingsDTO settings = settingsService.getSettings(userEmail);
        if (settings == null) {
            settings = UserSettingsDTO.builder()
                    .kcal(2000)
                    .macroStrategy("BALANCED")
                    .startWeight(80.0)
                    .goalWeight(75.0)
                    .weeklyGoal(0.5)
                    .build();
        }
        Double currentWeight = getCurrentWeight(userEmail);
        if (currentWeight == null) currentWeight = DEFAULT_WEIGHT_KG; // fallback to avoid NPE
        
        int kcal = settings.getKcal() != null ? settings.getKcal() : 2000;
        double protein = 0;
        double fat = 0;
        double carbs = 0;

        String strategy = settings.getMacroStrategy() != null ? settings.getMacroStrategy() : "BALANCED";

        if ("CUSTOM_GRAMS".equals(strategy)) {
            protein = settings.getCustomProteinGrams() != null ? settings.getCustomProteinGrams() : 150.0;
            fat = settings.getCustomFatGrams() != null ? settings.getCustomFatGrams() : 60.0;
            carbs = settings.getCustomCarbsGrams() != null ? settings.getCustomCarbsGrams() : 150.0;
            kcal = (int) Math.round(protein * 4 + fat * 9 + carbs * 4);
        } else if ("CUSTOM_PCT".equals(strategy)) {
            double pPct = settings.getCustomProteinPct() != null ? settings.getCustomProteinPct() : 30.0;
            double fPct = settings.getCustomFatPct() != null ? settings.getCustomFatPct() : 35.0;
            double cPct = settings.getCustomCarbsPct() != null ? settings.getCustomCarbsPct() : 35.0;
            
            protein = (kcal * (pPct / 100.0)) / 4.0;
            fat = (kcal * (fPct / 100.0)) / 9.0;
            carbs = (kcal * (cPct / 100.0)) / 4.0;
        } else {
            // Default BALANCED
            protein = currentWeight * 2;
            fat = (kcal * 0.22) / 9;
            carbs = (kcal - protein * 4 - fat * 9) / 4;
        }

        return MacrosDTO.builder()
                .kcal(kcal)
                .protein(round2(protein))
                .carbs(round2(Math.max(0, carbs)))
                .fat(round2(fat))
                .build();
    }

    @Transactional
    public AssistantSummary getAssistantSummary(String userEmail, LocalDate targetDate) {
        MacrosDTO targetMacros = getMacros(userEmail, targetDate);
        List<FoodLogDTO> logs = nutritionLogService.getFoodLogsByDate(userEmail, targetDate);

        double consumedKcal = 0, consumedProtein = 0, consumedCarbs = 0, consumedFat = 0;
        for (FoodLogDTO l : logs) {
            consumedKcal += l.getKcal();
            consumedProtein += l.getProtein();
            consumedCarbs += l.getCarbs();
            consumedFat += l.getFat();
        }

        int targetKcal = targetMacros.getKcal() != null ? targetMacros.getKcal() : 2000;
        double targetProtein = targetMacros.getProtein() != null ? targetMacros.getProtein() : 150.0;
        double targetCarbs = targetMacros.getCarbs() != null ? targetMacros.getCarbs() : 200.0;
        double targetFat = targetMacros.getFat() != null ? targetMacros.getFat() : 60.0;

        return new AssistantSummary(
                new MacroTotals(targetKcal, targetProtein, targetCarbs, targetFat),
                new MacroTotals(Math.round(consumedKcal), round1(consumedProtein), round1(consumedCarbs), round1(consumedFat)),
                new MacroTotals(Math.round(targetKcal - consumedKcal), round1(targetProtein - consumedProtein),
                        round1(targetCarbs - consumedCarbs), round1(targetFat - consumedFat)),
                targetDate.toString(),
                getNutritionService().getMeals(userEmail));
    }

    private Double getCurrentWeight(String userEmail) {
        return weightEntryRepository.findTopByUserEmailOrderByDateDesc(userEmail)
                .map(WeightEntry::getWeight)
                .orElse(null);
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round1(double val) { return Math.round(val * 10.0) / 10.0; }
}
