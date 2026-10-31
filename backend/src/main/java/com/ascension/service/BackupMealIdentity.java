package com.ascension.service;

import com.ascension.dto.UserDataExportDTO;
import com.ascension.dto.MealDTO;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

final class BackupMealIdentity {
    private BackupMealIdentity() { }

    static void prepare(String email, UserDataExportDTO backup, List<com.ascension.model.Meal> existingMeals) {
        List<MealDTO> meals = backup.getMeals() == null ? List.of() : backup.getMeals().stream()
                .sorted(Comparator.comparing(MealDTO::getSortOrder, Comparator.nullsLast(Integer::compareTo)))
                .toList();
        for (MealDTO meal : meals) {
            if (meal.getMealKey() == null) {
                String retainedKey = existingMeals.stream()
                        .filter(existing -> meal.getId() != null && meal.getId().equals(existing.getId()))
                        .map(com.ascension.model.Meal::getMealKey).filter(java.util.Objects::nonNull)
                        .findFirst().orElseGet(() -> key(email + ":backup-meal:" + meal.getName() + ":" + meal.getSortOrder()));
                meal.setMealKey(retainedKey);
            }
        }
        if (backup.getFoodLogs() == null) return;
        for (var log : backup.getFoodLogs()) {
            if (log.getMealKey() != null) continue;
            int index = log.getMealIndex() == null ? -1 : log.getMealIndex();
            if (index >= 0 && index < meals.size()) {
                MealDTO meal = meals.get(index);
                log.setMealKey(meal.getMealKey());
                log.setMealName(meal.getName());
                log.setMealIcon(meal.getIcon());
            } else {
                log.setMealKey(key(email + ":backup-orphan:" + index));
                log.setMealName("Comida histórica");
                log.setMealIcon("🍽️");
            }
        }
    }

    private static String key(String value) {
        return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8)).toString();
    }
}
