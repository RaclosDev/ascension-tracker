package com.ascension.service;

import com.ascension.dto.*;
import com.ascension.model.*;
import com.ascension.repository.*;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Slf4j
@Service
public class UserDataRestoreService {

    private final JdbcTemplate jdbcTemplate;
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
    private final UserDataQuotaService userDataQuotaService;
    private final EntityManager entityManager;

    @Autowired
    public UserDataRestoreService(
            JdbcTemplate jdbcTemplate,
            WorkoutRepository workoutRepository,
            CustomExerciseRepository customExerciseRepository,
            WorkoutTemplateRepository workoutTemplateRepository,
            FoodLogRepository foodLogRepository,
            MealRepository mealRepository,
            RecipeRepository recipeRepository,
            SavedFoodRepository savedFoodRepository,
            StepsEntryRepository stepsEntryRepository,
            WeightEntryRepository weightEntryRepository,
            UserSettingsRepository userSettingsRepository,
            UserDataQuotaService userDataQuotaService,
            @Autowired(required = false) EntityManager entityManager
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.workoutRepository = workoutRepository;
        this.customExerciseRepository = customExerciseRepository;
        this.workoutTemplateRepository = workoutTemplateRepository;
        this.foodLogRepository = foodLogRepository;
        this.mealRepository = mealRepository;
        this.recipeRepository = recipeRepository;
        this.savedFoodRepository = savedFoodRepository;
        this.stepsEntryRepository = stepsEntryRepository;
        this.weightEntryRepository = weightEntryRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.userDataQuotaService = userDataQuotaService;
        this.entityManager = entityManager;
    }

    public UserDataRestoreService(
            JdbcTemplate jdbcTemplate,
            WorkoutRepository workoutRepository,
            CustomExerciseRepository customExerciseRepository,
            WorkoutTemplateRepository workoutTemplateRepository,
            FoodLogRepository foodLogRepository,
            MealRepository mealRepository,
            RecipeRepository recipeRepository,
            SavedFoodRepository savedFoodRepository,
            StepsEntryRepository stepsEntryRepository,
            WeightEntryRepository weightEntryRepository,
            UserSettingsRepository userSettingsRepository,
            UserDataQuotaService userDataQuotaService
    ) {
        this(jdbcTemplate, workoutRepository, customExerciseRepository, workoutTemplateRepository,
                foodLogRepository, mealRepository, recipeRepository, savedFoodRepository,
                stepsEntryRepository, weightEntryRepository, userSettingsRepository,
                userDataQuotaService, null);
    }

    private void flushAndClearBatch(int count) {
        if (entityManager != null && count % 100 == 0) {
            entityManager.flush();
            entityManager.clear();
        }
    }

    private void finalFlushAndClear() {
        if (entityManager != null) {
            entityManager.flush();
            entityManager.clear();
        }
    }

    @Transactional
    public UserDataRestoreSummaryDTO restoreUserData(String userEmail, RestoreMode mode, boolean confirmEmpty, UserDataExportDTO backup) {
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("El email de usuario autenticado es obligatorio");
        }
        if (mode == null) {
            throw new IllegalArgumentException("El modo de restauración es obligatorio (MERGE o OVERWRITE)");
        }
        if (backup == null) {
            throw new IllegalArgumentException("El archivo de copia de seguridad no puede ser nulo");
        }
        if (backup.getVersion() == null || !"1.0".equals(backup.getVersion())) {
            throw new IllegalArgumentException("Versión de copia de seguridad incompatible: " + backup.getVersion());
        }

        boolean isOverwrite = (mode == RestoreMode.OVERWRITE);
        String appliedMode = mode.name();

        if (isOverwrite && isBackupEmpty(backup) && !confirmEmpty) {
            throw new IllegalArgumentException("No se puede realizar OVERWRITE con un backup completamente vacío sin confirmación explícita (confirmEmpty=true).");
        }

        userDataQuotaService.checkRestoreQuotas(userEmail, mode, backup);

        log.info("Iniciando restauración de datos en modo {} para usuario: {}", appliedMode, com.ascension.util.PiiMasker.maskEmail(userEmail));

        if (isOverwrite) {
            wipeUserData(userEmail);
        }

        // 1. Custom Exercises & ID translation map
        Map<String, String> idTranslationMap = new HashMap<>();
        int customExercisesRestored = restoreCustomExercises(userEmail, backup.getCustomExercises(), idTranslationMap, isOverwrite);

        // 2. Workouts
        int workoutsRestored = restoreWorkouts(userEmail, backup.getWorkouts(), idTranslationMap, isOverwrite);

        // 3. Workout Templates
        int workoutTemplatesRestored = restoreWorkoutTemplates(userEmail, backup.getWorkoutTemplates(), idTranslationMap, isOverwrite);

        // 4. Food Logs
        int foodLogsRestored = restoreFoodLogs(userEmail, backup.getFoodLogs(), isOverwrite);

        // 5. Meals
        int mealsRestored = restoreMeals(userEmail, backup.getMeals(), isOverwrite);

        // 6. Recipes
        int recipesRestored = restoreRecipes(userEmail, backup.getRecipes(), isOverwrite);

        // 7. Saved Foods
        int savedFoodsRestored = restoreSavedFoods(userEmail, backup.getSavedFoods(), isOverwrite);

        // 8. Steps Entries
        int stepsEntriesRestored = restoreStepsEntries(userEmail, backup.getStepsEntries(), isOverwrite);

        // 9. Weight Entries
        int weightEntriesRestored = restoreWeightEntries(userEmail, backup.getWeightEntries(), isOverwrite);

        // 10. User Settings
        boolean settingsRestored = restoreUserSettings(userEmail, backup.getUserSettings(), isOverwrite);

        log.info("Restauración completada para {}: {} entrenamientos, {} ejercicios, {} comidas",
                com.ascension.util.PiiMasker.maskEmail(userEmail), workoutsRestored, customExercisesRestored, foodLogsRestored);

        return UserDataRestoreSummaryDTO.builder()
                .mode(appliedMode)
                .workoutsRestored(workoutsRestored)
                .customExercisesRestored(customExercisesRestored)
                .workoutTemplatesRestored(workoutTemplatesRestored)
                .foodLogsRestored(foodLogsRestored)
                .mealsRestored(mealsRestored)
                .recipesRestored(recipesRestored)
                .savedFoodsRestored(savedFoodsRestored)
                .stepsEntriesRestored(stepsEntriesRestored)
                .weightEntriesRestored(weightEntriesRestored)
                .settingsRestored(settingsRestored)
                .restoredAt(Instant.now())
                .build();
    }

    @Transactional
    public UserDataRestoreSummaryDTO restoreUserData(String userEmail, String mode, UserDataExportDTO backup) {
        if (mode == null || mode.trim().isEmpty()) {
            throw new IllegalArgumentException("El modo de restauración es obligatorio (MERGE o OVERWRITE)");
        }
        RestoreMode restoreMode;
        try {
            restoreMode = RestoreMode.valueOf(mode.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Modo de restauración inválido: " + mode);
        }
        return restoreUserData(userEmail, restoreMode, false, backup);
    }

    public boolean isBackupEmpty(UserDataExportDTO backup) {
        if (backup == null) return true;
        boolean hasWorkouts = backup.getWorkouts() != null && !backup.getWorkouts().isEmpty();
        boolean hasExercises = backup.getCustomExercises() != null && !backup.getCustomExercises().isEmpty();
        boolean hasTemplates = backup.getWorkoutTemplates() != null && !backup.getWorkoutTemplates().isEmpty();
        boolean hasFoodLogs = backup.getFoodLogs() != null && !backup.getFoodLogs().isEmpty();
        boolean hasMeals = backup.getMeals() != null && !backup.getMeals().isEmpty();
        boolean hasRecipes = backup.getRecipes() != null && !backup.getRecipes().isEmpty();
        boolean hasSavedFoods = backup.getSavedFoods() != null && !backup.getSavedFoods().isEmpty();
        boolean hasSteps = backup.getStepsEntries() != null && !backup.getStepsEntries().isEmpty();
        boolean hasWeights = backup.getWeightEntries() != null && !backup.getWeightEntries().isEmpty();
        boolean hasSettings = backup.getUserSettings() != null;
        return !(hasWorkouts || hasExercises || hasTemplates || hasFoodLogs || hasMeals || hasRecipes || hasSavedFoods || hasSteps || hasWeights || hasSettings);
    }

    private void wipeUserData(String userEmail) {
        log.warn("Limpiando datos existentes de usuario para restauración: {}", com.ascension.util.PiiMasker.maskEmail(userEmail));

        jdbcTemplate.update("DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?))", userEmail);
        jdbcTemplate.update("DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?)", userEmail);
        jdbcTemplate.update("DELETE FROM workouts WHERE user_email = ?", userEmail);

        jdbcTemplate.update("DELETE FROM workout_template_exercises WHERE template_id IN (SELECT id FROM workout_templates WHERE user_email = ?)", userEmail);
        jdbcTemplate.update("DELETE FROM workout_templates WHERE user_email = ?", userEmail);

        String[] tables = {
                "custom_exercises",
                "food_logs",
                "meals",
                "recipes",
                "saved_foods",
                "steps_entries",
                "weight_entries",
                "user_settings"
        };

        for (String table : tables) {
            jdbcTemplate.update("DELETE FROM " + table + " WHERE user_email = ?", userEmail);
        }
    }

    private int restoreCustomExercises(String userEmail, List<CustomExerciseDTO> dtos, Map<String, String> idTranslationMap, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Map<String, String> existingMap = new HashMap<>();
        if (!isOverwrite) {
            for (CustomExercise ex : customExerciseRepository.findByUserEmail(userEmail)) {
                if (ex.getName() != null) {
                    existingMap.put(ex.getName().trim().toLowerCase(), ex.getId());
                }
            }
        }

        int count = 0;
        for (CustomExerciseDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) continue;
            String normalizedName = dto.getName().trim().toLowerCase();

            if (!isOverwrite && existingMap.containsKey(normalizedName)) {
                String existingId = existingMap.get(normalizedName);
                if (dto.getId() != null) {
                    idTranslationMap.put(dto.getId(), existingId);
                }
                continue;
            }

            String newId = UUID.randomUUID().toString();
            CustomExercise ex = CustomExercise.builder()
                    .id(newId)
                    .name(dto.getName().trim())
                    .muscle(dto.getMuscle() != null ? dto.getMuscle() : "pecho")
                    .equipment(dto.getEquipment() != null ? dto.getEquipment() : "peso corporal")
                    .userEmail(userEmail)
                    .build();

            customExerciseRepository.save(ex);
            if (dto.getId() != null) {
                idTranslationMap.put(dto.getId(), newId);
            }
            existingMap.put(normalizedName, newId);
            count++;
        }
        return count;
    }

    private int restoreWorkouts(String userEmail, List<WorkoutDTO> dtos, Map<String, String> idTranslationMap, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<Long> existingStartTimes = new HashSet<>();
        if (!isOverwrite) {
            existingStartTimes.addAll(workoutRepository.findStartedAtByUserEmail(userEmail));
        }

        int count = 0;
        for (WorkoutDTO dto : dtos) {
            if (!isOverwrite && dto.getStartedAt() != null && existingStartTimes.contains(dto.getStartedAt())) {
                continue;
            }

            Workout workout = Workout.builder()
                    .id(UUID.randomUUID().toString())
                    .userEmail(userEmail)
                    .name(dto.getName() != null ? dto.getName() : "Entrenamiento importado")
                    .startedAt(dto.getStartedAt())
                    .finishedAt(dto.getFinishedAt())
                    .notes(dto.getNotes())
                    .exercises(new LinkedHashSet<>())
                    .build();

            if (dto.getExercises() != null) {
                int order = 0;
                for (WorkoutExerciseDTO weDTO : dto.getExercises()) {
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
                        for (WorkoutSetDTO sDTO : weDTO.getSets()) {
                            WorkoutSet set = WorkoutSet.builder()
                                    .id(UUID.randomUUID().toString())
                                    .workoutExercise(we)
                                    .orderIndex(setOrder++)
                                    .type(sDTO.getType() != null ? sDTO.getType() : "normal")
                                    .weight(parseBigDecimal(sDTO.getWeight()))
                                    .reps(parseBigDecimal(sDTO.getReps()))
                                    .distance(sDTO.getDistance())
                                    .duration(sDTO.getDuration())
                                    .rpe(sDTO.getRpe())
                                    .completed(sDTO.getCompleted() != null ? sDTO.getCompleted() : true)
                                    .build();
                            we.getSets().add(set);
                        }
                    }
                    workout.getExercises().add(we);
                }
            }

            workoutRepository.save(workout);
            if (dto.getStartedAt() != null) {
                existingStartTimes.add(dto.getStartedAt());
            }
            count++;
            flushAndClearBatch(count);
        }
        finalFlushAndClear();
        return count;
    }

    private int restoreWorkoutTemplates(String userEmail, List<WorkoutTemplateDTO> dtos, Map<String, String> idTranslationMap, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<String> existingNames = new HashSet<>();
        if (!isOverwrite) {
            for (WorkoutTemplate t : workoutTemplateRepository.findByUserEmail(userEmail)) {
                if (t.getName() != null) {
                    existingNames.add(t.getName().trim().toLowerCase());
                }
            }
        }

        int count = 0;
        for (WorkoutTemplateDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) continue;
            String normalizedName = dto.getName().trim().toLowerCase();

            if (!isOverwrite && existingNames.contains(normalizedName)) {
                continue;
            }

            List<TemplateExercise> exercises = new ArrayList<>();
            if (dto.getExercises() != null) {
                for (TemplateExerciseDTO teDTO : dto.getExercises()) {
                    String rawExId = teDTO.getExerciseId();
                    String resolvedExId = (idTranslationMap != null && rawExId != null)
                            ? idTranslationMap.getOrDefault(rawExId, rawExId)
                            : rawExId;

                    String grip = teDTO.getVariant() != null ? teDTO.getVariant().getGrip() : null;
                    String machine = teDTO.getVariant() != null ? teDTO.getVariant().getMachine() : null;
                    exercises.add(new TemplateExercise(resolvedExId, grip, machine));
                }
            }

            WorkoutTemplate template = WorkoutTemplate.builder()
                    .id(UUID.randomUUID().toString())
                    .userEmail(userEmail)
                    .name(dto.getName().trim())
                    .exercises(exercises)
                    .build();

            workoutTemplateRepository.save(template);
            existingNames.add(normalizedName);
            count++;
        }
        return count;
    }

    private int restoreFoodLogs(String userEmail, List<FoodLogDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<String> existingKeys = new HashSet<>();
        if (!isOverwrite) {
            for (FoodLog fl : foodLogRepository.findAllByUserEmailOrderByDateAscIdAsc(userEmail)) {
                existingKeys.add(fl.getDate() + ":" + fl.getMealIndex() + ":" + (fl.getProduct() != null ? fl.getProduct().toLowerCase() : ""));
            }
        }

        int count = 0;
        for (FoodLogDTO dto : dtos) {
            String key = dto.getDate() + ":" + dto.getMealIndex() + ":" + (dto.getProduct() != null ? dto.getProduct().toLowerCase() : "");
            if (!isOverwrite && existingKeys.contains(key)) {
                continue;
            }

            FoodLog logEntry = new FoodLog();
            logEntry.setUserEmail(userEmail);
            logEntry.setDate(dto.getDate());
            logEntry.setMealIndex(dto.getMealIndex());
            logEntry.setProduct(dto.getProduct());
            logEntry.setQuantity(dto.getQuantity());
            logEntry.setKcal(dto.getKcal());
            logEntry.setProtein(dto.getProtein());
            logEntry.setCarbs(dto.getCarbs());
            logEntry.setFat(dto.getFat());
            logEntry.setPortionsJson(dto.getPortionsJson());

            foodLogRepository.save(logEntry);
            existingKeys.add(key);
            count++;
            flushAndClearBatch(count);
        }
        finalFlushAndClear();
        return count;
    }

    private int restoreMeals(String userEmail, List<MealDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        if (!isOverwrite) {
            List<Meal> existing = mealRepository.findAllByUserEmailOrderBySortOrderAsc(userEmail);
            if (!existing.isEmpty()) {
                // Keep existing user meals in merge mode
                return 0;
            }
        }

        Set<String> processedNames = new HashSet<>();
        int count = 0;
        for (MealDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                continue;
            }
            String normalizedName = dto.getName().trim().toLowerCase();
            if (processedNames.contains(normalizedName)) {
                continue;
            }
            processedNames.add(normalizedName);

            Meal meal = Meal.builder()
                    .userEmail(userEmail)
                    .name(dto.getName().trim())
                    .icon(dto.getIcon())
                    .proteinPct(dto.getProteinPct())
                    .fixedProtein(dto.getFixedProtein())
                    .carbsPct(dto.getCarbsPct())
                    .fixedCarbs(dto.getFixedCarbs())
                    .fatPct(dto.getFatPct())
                    .fixedFat(dto.getFixedFat())
                    .sortOrder(dto.getSortOrder())
                    .startTime(dto.getStartTime())
                    .endTime(dto.getEndTime())
                    .isDefault(dto.getIsDefault())
                    .build();

            mealRepository.save(meal);
            count++;
        }
        return count;
    }

    private int restoreRecipes(String userEmail, List<RecipeDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<String> existingNames = new HashSet<>();
        if (!isOverwrite) {
            for (Recipe r : recipeRepository.findAllByUserEmailOrderByNameAsc(userEmail)) {
                if (r.getName() != null) {
                    existingNames.add(r.getName().trim().toLowerCase());
                }
            }
        }

        int count = 0;
        for (RecipeDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) continue;
            String normalizedName = dto.getName().trim().toLowerCase();

            if (!isOverwrite && existingNames.contains(normalizedName)) {
                continue;
            }

            Recipe recipe = Recipe.builder()
                    .userEmail(userEmail)
                    .name(dto.getName().trim())
                    .description(dto.getDescription())
                    .totalKcal(dto.getTotalKcal())
                    .totalProtein(dto.getTotalProtein())
                    .totalCarbs(dto.getTotalCarbs())
                    .totalFat(dto.getTotalFat())
                    .build();

            recipeRepository.save(recipe);
            existingNames.add(normalizedName);
            count++;
        }
        return count;
    }

    private int restoreSavedFoods(String userEmail, List<SavedFoodDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<String> existingKeys = new HashSet<>();
        if (!isOverwrite) {
            for (SavedFood sf : savedFoodRepository.findAllByUserEmailOrderByNameAsc(userEmail)) {
                String brand = sf.getBrand() != null ? sf.getBrand().trim().toLowerCase() : "";
                String name = sf.getName() != null ? sf.getName().trim().toLowerCase() : "";
                existingKeys.add(name + ":" + brand);
            }
        }

        int count = 0;
        for (SavedFoodDTO dto : dtos) {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) continue;
            String brand = dto.getBrand() != null ? dto.getBrand().trim().toLowerCase() : "";
            String name = dto.getName().trim().toLowerCase();
            String key = name + ":" + brand;

            if (!isOverwrite && existingKeys.contains(key)) {
                continue;
            }

            SavedFood savedFood = SavedFood.builder()
                    .userEmail(userEmail)
                    .name(dto.getName().trim())
                    .brand(dto.getBrand())
                    .kcalPer100g(dto.getKcalPer100g())
                    .proteinPer100g(dto.getProteinPer100g())
                    .carbsPer100g(dto.getCarbsPer100g())
                    .fatPer100g(dto.getFatPer100g())
                    .servingSize(dto.getServingSize())
                    .servingLabel(dto.getServingLabel())
                    .build();

            savedFoodRepository.save(savedFood);
            existingKeys.add(key);
            count++;
            flushAndClearBatch(count);
        }
        finalFlushAndClear();
        return count;
    }

    private int restoreStepsEntries(String userEmail, List<StepsEntryDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<java.time.LocalDate> existingDates = new HashSet<>();
        if (!isOverwrite) {
            for (StepsEntry se : stepsEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail)) {
                if (se.getDate() != null) {
                    existingDates.add(se.getDate());
                }
            }
        }

        int count = 0;
        for (StepsEntryDTO dto : dtos) {
            if (dto.getDate() == null) continue;
            if (!isOverwrite && existingDates.contains(dto.getDate())) {
                continue;
            }

            StepsEntry entry = new StepsEntry();
            entry.setUserEmail(userEmail);
            entry.setDate(dto.getDate());
            entry.setSteps(dto.getSteps());

            stepsEntryRepository.save(entry);
            existingDates.add(dto.getDate());
            count++;
            flushAndClearBatch(count);
        }
        finalFlushAndClear();
        return count;
    }

    private int restoreWeightEntries(String userEmail, List<WeightEntryDTO> dtos, boolean isOverwrite) {
        if (dtos == null || dtos.isEmpty()) return 0;

        Set<java.time.LocalDate> existingDates = new HashSet<>();
        if (!isOverwrite) {
            for (WeightEntry we : weightEntryRepository.findAllByUserEmailOrderByDateAsc(userEmail)) {
                if (we.getDate() != null) {
                    existingDates.add(we.getDate());
                }
            }
        }

        int count = 0;
        for (WeightEntryDTO dto : dtos) {
            if (dto.getDate() == null) continue;
            if (!isOverwrite && existingDates.contains(dto.getDate())) {
                continue;
            }

            WeightEntry entry = WeightEntry.builder()
                    .userEmail(userEmail)
                    .date(dto.getDate())
                    .weight(dto.getWeight())
                    .build();

            weightEntryRepository.save(entry);
            existingDates.add(dto.getDate());
            count++;
            flushAndClearBatch(count);
        }
        finalFlushAndClear();
        return count;
    }

    private boolean restoreUserSettings(String userEmail, UserSettingsDTO dto, boolean isOverwrite) {
        if (dto == null) return false;
        if (!isOverwrite) {
            // Keep existing user settings in merge mode
            return false;
        }

        UserSettings s = userSettingsRepository.findByUserEmail(userEmail).orElseGet(() -> {
            UserSettings created = new UserSettings();
            created.setUserEmail(userEmail);
            return created;
        });

        s.setStartWeight(dto.getStartWeight());
        s.setGoalWeight(dto.getGoalWeight());
        s.setWeeklyGoal(dto.getWeeklyGoal());
        s.setStartDate(dto.getStartDate());
        s.setKcal(dto.getKcal());
        s.setMacroStrategy(dto.getMacroStrategy() != null ? dto.getMacroStrategy() : "BALANCED");
        s.setCustomProteinPct(dto.getCustomProteinPct());
        s.setCustomFatPct(dto.getCustomFatPct());
        s.setCustomCarbsPct(dto.getCustomCarbsPct());
        s.setCustomProteinGrams(dto.getCustomProteinGrams());
        s.setCustomFatGrams(dto.getCustomFatGrams());
        s.setCustomCarbsGrams(dto.getCustomCarbsGrams());
        s.setAge(dto.getAge());
        s.setHeightCm(dto.getHeightCm());
        s.setSex(dto.getSex());
        s.setActivityFactor(dto.getActivityFactor());
        s.setWorkoutData(dto.getWorkoutData());

        userSettingsRepository.save(s);
        return true;
    }

    private Double parseDoubleSafe(String val) {
        if (val == null || val.trim().isEmpty()) return null;
        try {
            return Double.parseDouble(val.trim().replace(',', '.'));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseIntSafe(String val) {
        if (val == null || val.trim().isEmpty()) return null;
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private java.math.BigDecimal parseBigDecimal(String val) {
        if (val == null || val.trim().isEmpty()) return null;
        try {
            return new java.math.BigDecimal(val.trim().replace(',', '.')).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
