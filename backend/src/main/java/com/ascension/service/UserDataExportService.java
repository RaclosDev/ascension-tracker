package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.*;
import com.ascension.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDataExportService {

    private final WorkoutRepository workoutRepository;
    private final CustomExerciseRepository customExerciseRepository;
    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final FoodLogRepository foodLogRepository;
    private final MealRepository mealRepository;
    private final RecipeRepository recipeRepository;
    private final SavedFoodRepository savedFoodRepository;
    private final StepsEntryRepository stepsEntryRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final WorkoutMapper workoutMapper;

    @Transactional(readOnly = true)
    public UserDataExportDTO exportUserData(String userEmail) {
        log.info("Generating full user data export for user: {}", userEmail);

        List<WorkoutDTO> workouts = workoutRepository.findAllByUserEmailOrderByStartedAtDesc(userEmail).stream()
                .map(workoutMapper::toDTO)
                .toList();

        List<CustomExerciseDTO> customExercises = customExerciseRepository.findByUserEmail(userEmail).stream()
                .map(this::toCustomExerciseDTO)
                .toList();

        List<WorkoutTemplateDTO> workoutTemplates = workoutTemplateRepository.findByUserEmail(userEmail).stream()
                .map(this::toWorkoutTemplateDTO)
                .toList();

        List<FoodLogDTO> foodLogs = foodLogRepository.findAllByUserEmailOrderByDateAscIdAsc(userEmail).stream()
                .map(this::toFoodLogDTO)
                .toList();

        List<MealDTO> meals = mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).stream()
                .map(this::toMealDTO)
                .toList();

        List<RecipeDTO> recipes = recipeRepository.findAllByUserEmailOrderByNameAsc(userEmail).stream()
                .map(this::toRecipeDTO)
                .toList();

        List<SavedFoodDTO> savedFoods = savedFoodRepository.findAllByUserEmailOrderByNameAsc(userEmail).stream()
                .map(this::toSavedFoodDTO)
                .toList();

        List<StepsEntryDTO> stepsEntries = stepsEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail).stream()
                .map(this::toStepsEntryDTO)
                .toList();

        List<WeightEntryDTO> weightEntries = weightEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail).stream()
                .map(this::toWeightEntryDTO)
                .toList();

        UserSettingsDTO userSettings = userSettingsRepository.findByUserEmail(userEmail)
                .map(this::toUserSettingsDTO)
                .orElse(null);

        return UserDataExportDTO.builder()
                .version("1.0")
                .exportedAt(Instant.now())
                .userEmail(userEmail)
                .workouts(workouts)
                .customExercises(customExercises)
                .workoutTemplates(workoutTemplates)
                .foodLogs(foodLogs)
                .meals(meals)
                .recipes(recipes)
                .savedFoods(savedFoods)
                .stepsEntries(stepsEntries)
                .weightEntries(weightEntries)
                .userSettings(userSettings)
                .build();
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

    private WorkoutTemplateDTO toWorkoutTemplateDTO(WorkoutTemplate t) {
        List<TemplateExerciseDTO> exerciseDTOs = t.getExercises() != null
                ? t.getExercises().stream().map(e -> {
                    WorkoutExerciseDTO.VariantDTO var = null;
                    if (e.getVariantGrip() != null || e.getVariantMachine() != null) {
                        var = new WorkoutExerciseDTO.VariantDTO(e.getVariantGrip(), e.getVariantMachine());
                    }
                    return new TemplateExerciseDTO(e.getExerciseId(), var);
                }).toList()
                : new ArrayList<>();

        return WorkoutTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .exercises(exerciseDTOs)
                .build();
    }

    private FoodLogDTO toFoodLogDTO(FoodLog log) {
        return FoodLogDTO.builder()
                .id(log.getId())
                .date(log.getDate())
                .mealIndex(log.getMealIndex())
                .product(log.getProduct())
                .quantity(log.getQuantity())
                .kcal(log.getKcal())
                .protein(log.getProtein())
                .carbs(log.getCarbs())
                .fat(log.getFat())
                .portionsJson(log.getPortionsJson())
                .build();
    }

    private MealDTO toMealDTO(Meal meal) {
        return MealDTO.builder()
                .id(meal.getId())
                .name(meal.getName())
                .icon(meal.getIcon())
                .proteinPct(meal.getProteinPct())
                .fixedProtein(meal.getFixedProtein())
                .carbsPct(meal.getCarbsPct())
                .fixedCarbs(meal.getFixedCarbs())
                .fatPct(meal.getFatPct())
                .fixedFat(meal.getFixedFat())
                .sortOrder(meal.getSortOrder())
                .startTime(meal.getStartTime())
                .endTime(meal.getEndTime())
                .isDefault(meal.getIsDefault())
                .build();
    }

    private RecipeDTO toRecipeDTO(Recipe r) {
        return RecipeDTO.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .totalKcal(r.getTotalKcal())
                .totalProtein(r.getTotalProtein())
                .totalCarbs(r.getTotalCarbs())
                .totalFat(r.getTotalFat())
                .build();
    }

    private SavedFoodDTO toSavedFoodDTO(SavedFood sf) {
        return SavedFoodDTO.builder()
                .id(sf.getId())
                .name(sf.getName())
                .brand(sf.getBrand())
                .kcalPer100g(sf.getKcalPer100g())
                .proteinPer100g(sf.getProteinPer100g())
                .carbsPer100g(sf.getCarbsPer100g())
                .fatPer100g(sf.getFatPer100g())
                .servingSize(sf.getServingSize())
                .servingLabel(sf.getServingLabel())
                .build();
    }

    private StepsEntryDTO toStepsEntryDTO(StepsEntry entry) {
        return StepsEntryDTO.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .steps(entry.getSteps())
                .build();
    }

    private WeightEntryDTO toWeightEntryDTO(WeightEntry entry) {
        return WeightEntryDTO.builder()
                .id(entry.getId())
                .date(entry.getDate())
                .weight(entry.getWeight())
                .build();
    }

    private UserSettingsDTO toUserSettingsDTO(UserSettings s) {
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
