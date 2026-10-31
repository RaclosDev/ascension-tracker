package com.ascension.service;

import com.ascension.exception.InvalidInputException;
import com.ascension.model.FoodLog;
import com.ascension.model.Meal;
import java.util.List;
import java.util.Objects;

final class MealIdentity {
    private MealIdentity() { }

    static int currentIndex(FoodLog log, List<Meal> meals) {
        if (log.getMealKey() == null) return -1;
        for (int i = 0; i < meals.size(); i++) {
            if (log.getMealKey().equals(meals.get(i).getMealKey())) return i;
        }
        return -1;
    }

    static void assign(FoodLog log, String requestedKey, Integer legacyIndex, List<Meal> meals) {
        if (requestedKey != null && requestedKey.equals(log.getMealKey())) return;
        Meal selected = null;
        int index = -1;
        for (int i = 0; i < meals.size(); i++) {
            if (requestedKey != null ? requestedKey.equals(meals.get(i).getMealKey()) : Objects.equals(legacyIndex, i)) {
                selected = meals.get(i);
                index = i;
                break;
            }
        }
        if (selected == null) {
            if (requestedKey != null) throw new InvalidInputException("La comida seleccionada ya no existe");
            if (legacyIndex == null || legacyIndex < 0) {
                if (log.getId() != null) return;
                throw new InvalidInputException("Selecciona una comida activa");
            }
            // A legacy client may submit before configuring meals. Keep it orphaned.
            log.setMealKey(java.util.UUID.nameUUIDFromBytes((log.getUserEmail() + ":legacy-meal:" + legacyIndex)
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString());
            log.setMealName("Comida histórica");
            log.setMealIcon("🍽️");
            log.setMealIndex(legacyIndex);
            return;
        }
        log.setMealKey(selected.getMealKey());
        log.setMealName(selected.getName());
        log.setMealIcon(selected.getIcon());
        log.setMealIndex(index);
    }
}
