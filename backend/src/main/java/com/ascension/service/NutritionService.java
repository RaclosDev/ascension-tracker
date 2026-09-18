package com.ascension.service;

import com.ascension.dto.MacrosDTO;
import com.ascension.dto.MealDTO;
import com.ascension.dto.UserSettingsDTO;
import com.ascension.model.Meal;
import com.ascension.model.WeightEntry;
import com.ascension.repository.MealRepository;
import com.ascension.repository.WeightEntryRepository;
import com.ascension.model.FoodLog;
import com.ascension.dto.FoodLogDTO;
import com.ascension.repository.FoodLogRepository;
import com.ascension.model.SavedFood;
import com.ascension.dto.SavedFoodDTO;
import com.ascension.repository.SavedFoodRepository;
import com.ascension.model.Recipe;
import com.ascension.dto.RecipeDTO;
import com.ascension.repository.RecipeRepository;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final MealRepository mealRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final SettingsService settingsService;
    private final FoodLogRepository foodLogRepository;

    private final SavedFoodRepository savedFoodRepository;
    private final RecipeRepository recipeRepository;

    public MacrosDTO getMacros(String userEmail) {
        // ... (existing code for macros will be retained via the chunk approach)

        UserSettingsDTO settings = settingsService.getSettings(userEmail);
        Double currentWeight = getCurrentWeight(userEmail);
        if (currentWeight == null) currentWeight = 75.0; // fallback to avoid NPE
        
        int kcal = settings.getKcal();
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
    public List<MealDTO> getMeals(String userEmail) {
        if (mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).isEmpty()) {
            seedDefaultMeals(userEmail);
        }
        return mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }


    public List<FoodLogDTO> getRecentDistinctFoods(String userEmail) {
        return foodLogRepository.findTop20ByUserEmailOrderByDateDescIdDesc(userEmail).stream()
                .filter(distinctByKey(FoodLog::getProduct))
                .limit(5)
                .map(this::toFoodLogDTO)
                .collect(Collectors.toList());
    }

    private static <T> Predicate<T> distinctByKey(Function<? super T, ?> keyExtractor) {
        Map<Object, Boolean> seen = new ConcurrentHashMap<>();
        return t -> seen.putIfAbsent(keyExtractor.apply(t), Boolean.TRUE) == null;
    }

    @Transactional
    public List<MealDTO> updateMeals(List<MealDTO> dtos, String userEmail) {
        for (MealDTO dto : dtos) {
            if (dto.getId() != null) {
                mealRepository.findById(dto.getId()).ifPresent(meal -> {
                    if (!userEmail.equals(meal.getUserEmail())) return;
                    if (dto.getName() != null) meal.setName(dto.getName());
                    if (dto.getIcon() != null) meal.setIcon(dto.getIcon());
                    meal.setFixedProtein(dto.getFixedProtein());
                    meal.setProteinPct(dto.getProteinPct());
                    meal.setFixedCarbs(dto.getFixedCarbs());
                    meal.setCarbsPct(dto.getCarbsPct());
                    meal.setFixedFat(dto.getFixedFat());
                    meal.setFatPct(dto.getFatPct());
                    if (dto.getSortOrder() != null) meal.setSortOrder(dto.getSortOrder());
                    if (dto.getStartTime() != null) meal.setStartTime(dto.getStartTime());
                    if (dto.getEndTime() != null) meal.setEndTime(dto.getEndTime());
                    meal.setIsDefault(dto.getIsDefault());
                    mealRepository.save(meal);
                });
            }
        }
        return getMeals(userEmail);
    }

    @Transactional
    public MealDTO addMeal(MealDTO dto, String userEmail) {
        Integer maxOrder = mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).stream()
                .map(Meal::getSortOrder)
                .max(Integer::compareTo)
                .orElse(-1);

        Meal meal = Meal.builder()
                .name(dto.getName() != null ? dto.getName() : "Nueva Comida")
                .icon(dto.getIcon() != null ? dto.getIcon() : "🍽️")
                .sortOrder(maxOrder + 1)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .isDefault(dto.getIsDefault())
                .userEmail(userEmail)
                .build();

        return toDTO(mealRepository.save(meal));
    }

    @Transactional
    public void deleteMeal(Long id, String userEmail) {
        mealRepository.findById(id).ifPresent(meal -> {
            if (!userEmail.equals(meal.getUserEmail())) throw new SecurityException("Not authorized to delete this meal");
            mealRepository.delete(meal);
        });
        if (mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail).isEmpty()) {
            seedDefaultMeals(userEmail);
        }
    }

    @Transactional
    public List<MealDTO> resetDefaultMeals(String userEmail) {
        mealRepository.deleteAllByUserEmail(userEmail);
        seedDefaultMeals(userEmail);
        return getMeals(userEmail);
    }

    @Transactional
    public void seedDefaultMeals(String userEmail) {
        mealRepository.saveAll(List.of(
            Meal.builder().userEmail(userEmail).name("Desayuno").sortOrder(0).startTime("06:00").endTime("11:00").build(),
            Meal.builder().userEmail(userEmail).name("Comida").sortOrder(1).startTime("13:00").endTime("17:00").build(),
            Meal.builder().userEmail(userEmail).name("Cena").sortOrder(2).startTime("20:00").endTime("05:59").build(),
            Meal.builder().userEmail(userEmail).name("Snacks").sortOrder(3).startTime("11:00").endTime("13:00").isDefault(true).build()
        ));
    }


    public List<FoodLogDTO> getFoodLogsByDate(String userEmail, LocalDate date) {
        return foodLogRepository.findByUserEmailAndDateOrderByIdAsc(userEmail, date).stream()
                .map(this::toFoodLogDTO)
                .collect(Collectors.toList());
    }

    public List<com.ascension.dto.WeekSummaryDTO> getWeeklyCalories(String userEmail) {
        List<FoodLog> allEntries = foodLogRepository.findAllByUserEmailOrderByDateAsc(userEmail);
        if (allEntries.isEmpty()) return List.of();

        java.time.LocalDate firstMonday = allEntries.get(0).getDate().with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        java.time.LocalDate currentMonday = java.time.LocalDate.now().with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));

        // Aggregate calories per day
        java.util.Map<java.time.LocalDate, Double> entryMap = allEntries.stream()
                .collect(Collectors.groupingBy(FoodLog::getDate, Collectors.summingDouble(FoodLog::getKcal)));

        List<com.ascension.dto.WeekSummaryDTO> summaries = new ArrayList<>();
        Double previousAvg = null;

        java.time.LocalDate monday = firstMonday;
        while (!monday.isAfter(currentMonday)) {
            List<Double> days = new ArrayList<>();
            List<Double> validValues = new ArrayList<>();

            for (int d = 0; d < 7; d++) {
                java.time.LocalDate day = monday.plusDays(d);
                Double cals = entryMap.get(day);
                days.add(cals);
                if (cals != null) validValues.add(cals);
            }

            Double average = validValues.isEmpty() ? null :
                    validValues.stream().mapToDouble(Double::doubleValue).average().getAsDouble();

            Double delta = null;
            if (average != null && previousAvg != null) {
                delta = (double) Math.round((average - previousAvg) * 100.0) / 100.0;
            }

            summaries.add(com.ascension.dto.WeekSummaryDTO.builder()
                    .weekStart(monday)
                    .days(days)
                    .average(average != null ? (double) Math.round(average * 100.0) / 100.0 : null)
                    .delta(delta)
                    .entries(validValues.size())
                    .build());

            if (average != null) previousAvg = average;
            monday = monday.plusWeeks(1);
        }

        return summaries;
    }

    @Transactional
    public FoodLogDTO addFoodLog(String userEmail, FoodLogDTO dto) {
        FoodLog log = new FoodLog();
        log.setUserEmail(userEmail);
        log.setDate(dto.getDate());
        log.setMealIndex(dto.getMealIndex());
        log.setProduct(dto.getProduct());
        log.setQuantity(dto.getQuantity());
        log.setKcal(dto.getKcal());
        log.setProtein(dto.getProtein());
        log.setCarbs(dto.getCarbs());
        log.setFat(dto.getFat());
        
        FoodLog saved = foodLogRepository.save(log);

        savedFoodRepository.findFirstByUserEmailAndName(userEmail, dto.getProduct())
            .ifPresent(sf -> {
                sf.setLastUsedAt(java.time.LocalDateTime.now());
                savedFoodRepository.save(sf);
            });

        return toFoodLogDTO(saved);
    }

    @Transactional
    public void deleteFoodLog(String userEmail, Long id) {
        foodLogRepository.findById(id).ifPresent(log -> {
            if (log.getUserEmail().equals(userEmail)) {
                foodLogRepository.deleteById(id);
            }
        });
    }

    @Transactional
    public FoodLogDTO updateFoodLog(String userEmail, FoodLogDTO dto) {
        FoodLog log = foodLogRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Log not found"));

        if (!log.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        log.setProduct(dto.getProduct());
        log.setQuantity(dto.getQuantity());
        log.setKcal(dto.getKcal());
        log.setProtein(dto.getProtein());
        log.setCarbs(dto.getCarbs());
        log.setFat(dto.getFat());
        if (dto.getMealIndex() != null) {
            log.setMealIndex(dto.getMealIndex());
        }

        foodLogRepository.save(log);
        return toFoodLogDTO(log);
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
                .build();
    }

    private Double getCurrentWeight(String userEmail) {
        return weightEntryRepository.findTopByUserEmailOrderByDateDesc(userEmail)
                .map(WeightEntry::getWeight)
                .orElse(null);
    }

    private MealDTO toDTO(Meal meal) {
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

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }

    // --- Saved Foods CRUD ---
    public List<SavedFoodDTO> getSavedFoods(String userEmail) {
        return savedFoodRepository.findRecentByUserEmail(userEmail).stream()
                .map(f -> SavedFoodDTO.builder()
                        .id(f.getId())
                        .name(f.getName())
                        .brand(f.getBrand())
                        .kcalPer100g(f.getKcalPer100g())
                        .proteinPer100g(f.getProteinPer100g())
                        .carbsPer100g(f.getCarbsPer100g())
                        .fatPer100g(f.getFatPer100g())
                        .servingSize(f.getServingSize())
                        .servingLabel(f.getServingLabel())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public SavedFoodDTO addSavedFood(String userEmail, SavedFoodDTO dto) {
        SavedFood f = SavedFood.builder()
                .userEmail(userEmail)
                .name(dto.getName())
                .brand(dto.getBrand())
                .kcalPer100g(dto.getKcalPer100g())
                .proteinPer100g(dto.getProteinPer100g())
                .carbsPer100g(dto.getCarbsPer100g())
                .fatPer100g(dto.getFatPer100g())
                .servingSize(dto.getServingSize())
                .servingLabel(dto.getServingLabel())
                .build();
        f = savedFoodRepository.save(f);
        dto.setId(f.getId());
        return dto;
    }

    @Transactional
    public SavedFoodDTO updateSavedFood(String userEmail, SavedFoodDTO dto) {
        SavedFood f = savedFoodRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Food not found"));
        
        if (!f.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        f.setName(dto.getName());
        f.setBrand(dto.getBrand());
        f.setKcalPer100g(dto.getKcalPer100g());
        f.setProteinPer100g(dto.getProteinPer100g());
        f.setCarbsPer100g(dto.getCarbsPer100g());
        f.setFatPer100g(dto.getFatPer100g());
        f.setServingSize(dto.getServingSize());
        f.setServingLabel(dto.getServingLabel());
        f.setLastUsedAt(java.time.LocalDateTime.now());
        
        savedFoodRepository.save(f);
        return dto;
    }

    @Transactional
    public void deleteSavedFood(String userEmail, Long id) {
        savedFoodRepository.findById(id).ifPresent(f -> {
            if (f.getUserEmail().equals(userEmail)) {
                savedFoodRepository.deleteById(id);
            }
        });
    }

    // --- Recipes CRUD ---
    public List<RecipeDTO> getRecipes(String userEmail) {
        return recipeRepository.findByUserEmailOrderByNameAsc(userEmail).stream()
                .map(r -> RecipeDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .description(r.getDescription())
                        .totalKcal(r.getTotalKcal())
                        .totalProtein(r.getTotalProtein())
                        .totalCarbs(r.getTotalCarbs())
                        .totalFat(r.getTotalFat())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public RecipeDTO addRecipe(String userEmail, RecipeDTO dto) {
        Recipe r = Recipe.builder()
                .userEmail(userEmail)
                .name(dto.getName())
                .description(dto.getDescription())
                .totalKcal(dto.getTotalKcal())
                .totalProtein(dto.getTotalProtein())
                .totalCarbs(dto.getTotalCarbs())
                .totalFat(dto.getTotalFat())
                .build();
        r = recipeRepository.save(r);
        dto.setId(r.getId());
        return dto;
    }

    @Transactional
    public RecipeDTO updateRecipe(String userEmail, RecipeDTO dto) {
        Recipe r = recipeRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Recipe not found"));

        if (!r.getUserEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized");
        }

        r.setName(dto.getName());
        r.setDescription(dto.getDescription());
        r.setTotalKcal(dto.getTotalKcal());
        r.setTotalProtein(dto.getTotalProtein());
        r.setTotalCarbs(dto.getTotalCarbs());
        r.setTotalFat(dto.getTotalFat());

        recipeRepository.save(r);
        return dto;
    }

    @Transactional
    public void deleteRecipe(String userEmail, Long id) {
        recipeRepository.findById(id).ifPresent(r -> {
            if (r.getUserEmail().equals(userEmail)) {
                recipeRepository.deleteById(id);
            }
        });
    }
}


