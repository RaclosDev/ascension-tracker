package com.ascension.service;

import com.ascension.config.UserDataQuotaProperties;
import com.ascension.dto.UserDataExportDTO;
import com.ascension.exception.UserDataQuotaExceededException;
import com.ascension.model.RestoreMode;
import com.ascension.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDataQuotaService {

    private final UserDataQuotaProperties quotaProperties;
    private final WorkoutRepository workoutRepository;
    private final FoodLogRepository foodLogRepository;
    private final RecipeRepository recipeRepository;
    private final CustomExerciseRepository customExerciseRepository;
    private final WorkoutTemplateRepository workoutTemplateRepository;
    private final SavedFoodRepository savedFoodRepository;
    private final WeightEntryRepository weightEntryRepository;
    private final StepsEntryRepository stepsEntryRepository;

    public void checkWorkoutQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = workoutRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxWorkouts()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de entrenamientos alcanzado (%d/%d). No se pueden añadir más entrenamientos.",
                            current + countToAdd, quotaProperties.getMaxWorkouts())
            );
        }
    }

    public void checkFoodLogQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = foodLogRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxFoodLogs()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de registros de alimentos alcanzado (%d/%d). No se pueden añadir más alimentos.",
                            current + countToAdd, quotaProperties.getMaxFoodLogs())
            );
        }
    }

    public void checkRecipeQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = recipeRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxRecipes()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de recetas alcanzado (%d/%d). No se pueden añadir más recetas.",
                            current + countToAdd, quotaProperties.getMaxRecipes())
            );
        }
    }

    public void checkCustomExerciseQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = customExerciseRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxCustomExercises()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de ejercicios personalizados alcanzado (%d/%d).",
                            current + countToAdd, quotaProperties.getMaxCustomExercises())
            );
        }
    }

    public void checkWorkoutTemplateQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = workoutTemplateRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxWorkoutTemplates()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de plantillas de entrenamiento alcanzado (%d/%d).",
                            current + countToAdd, quotaProperties.getMaxWorkoutTemplates())
            );
        }
    }

    public void checkSavedFoodQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = savedFoodRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxSavedFoods()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de alimentos guardados alcanzado (%d/%d).",
                            current + countToAdd, quotaProperties.getMaxSavedFoods())
            );
        }
    }

    public void checkWeightEntryQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = weightEntryRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxWeightEntries()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de registros de peso alcanzado (%d/%d).",
                            current + countToAdd, quotaProperties.getMaxWeightEntries())
            );
        }
    }

    public void checkStepsEntryQuota(String userEmail, int countToAdd) {
        if (countToAdd <= 0) return;
        long current = stepsEntryRepository.countByUserEmail(userEmail);
        if (current + countToAdd > quotaProperties.getMaxStepsEntries()) {
            throw new UserDataQuotaExceededException(
                    String.format("Límite de registros de pasos alcanzado (%d/%d).",
                            current + countToAdd, quotaProperties.getMaxStepsEntries())
            );
        }
    }

    public void checkRestoreQuotas(String userEmail, RestoreMode mode, UserDataExportDTO backup) {
        if (backup == null) return;
        boolean isOverwrite = (mode == RestoreMode.OVERWRITE);

        int incomingWorkouts = backup.getWorkouts() != null ? backup.getWorkouts().size() : 0;
        int incomingFoodLogs = backup.getFoodLogs() != null ? backup.getFoodLogs().size() : 0;
        int incomingRecipes = backup.getRecipes() != null ? backup.getRecipes().size() : 0;
        int incomingExercises = backup.getCustomExercises() != null ? backup.getCustomExercises().size() : 0;
        int incomingTemplates = backup.getWorkoutTemplates() != null ? backup.getWorkoutTemplates().size() : 0;
        int incomingSavedFoods = backup.getSavedFoods() != null ? backup.getSavedFoods().size() : 0;
        int incomingWeightEntries = backup.getWeightEntries() != null ? backup.getWeightEntries().size() : 0;
        int incomingStepsEntries = backup.getStepsEntries() != null ? backup.getStepsEntries().size() : 0;

        if (isOverwrite) {
            if (incomingWorkouts > quotaProperties.getMaxWorkouts()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de entrenamientos (%d/%d).",
                                incomingWorkouts, quotaProperties.getMaxWorkouts()));
            }
            if (incomingFoodLogs > quotaProperties.getMaxFoodLogs()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de registros de alimentos (%d/%d).",
                                incomingFoodLogs, quotaProperties.getMaxFoodLogs()));
            }
            if (incomingRecipes > quotaProperties.getMaxRecipes()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de recetas (%d/%d).",
                                incomingRecipes, quotaProperties.getMaxRecipes()));
            }
            if (incomingExercises > quotaProperties.getMaxCustomExercises()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de ejercicios personalizados (%d/%d).",
                                incomingExercises, quotaProperties.getMaxCustomExercises()));
            }
            if (incomingTemplates > quotaProperties.getMaxWorkoutTemplates()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de plantillas (%d/%d).",
                                incomingTemplates, quotaProperties.getMaxWorkoutTemplates()));
            }
            if (incomingSavedFoods > quotaProperties.getMaxSavedFoods()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de alimentos guardados (%d/%d).",
                                incomingSavedFoods, quotaProperties.getMaxSavedFoods()));
            }
            if (incomingWeightEntries > quotaProperties.getMaxWeightEntries()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de registros de peso (%d/%d).",
                                incomingWeightEntries, quotaProperties.getMaxWeightEntries()));
            }
            if (incomingStepsEntries > quotaProperties.getMaxStepsEntries()) {
                throw new UserDataQuotaExceededException(
                        String.format("La copia de seguridad supera la cuota máxima de registros de pasos (%d/%d).",
                                incomingStepsEntries, quotaProperties.getMaxStepsEntries()));
            }
        } else {
            if (incomingWorkouts > 0) checkWorkoutQuota(userEmail, incomingWorkouts);
            if (incomingFoodLogs > 0) checkFoodLogQuota(userEmail, incomingFoodLogs);
            if (incomingRecipes > 0) checkRecipeQuota(userEmail, incomingRecipes);
            if (incomingExercises > 0) checkCustomExerciseQuota(userEmail, incomingExercises);
            if (incomingTemplates > 0) checkWorkoutTemplateQuota(userEmail, incomingTemplates);
            if (incomingSavedFoods > 0) checkSavedFoodQuota(userEmail, incomingSavedFoods);
            if (incomingWeightEntries > 0) checkWeightEntryQuota(userEmail, incomingWeightEntries);
            if (incomingStepsEntries > 0) checkStepsEntryQuota(userEmail, incomingStepsEntries);
        }
    }
}
