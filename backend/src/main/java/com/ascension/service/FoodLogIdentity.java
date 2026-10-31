package com.ascension.service;

import com.ascension.dto.FoodLogDTO;
import com.ascension.model.FoodLog;
import tools.jackson.databind.json.JsonMapper;
import java.time.LocalDate;

/** Value identity for multiset reconciliation; database IDs change during restore. */
record FoodLogIdentity(LocalDate date, String mealIdentity, String product, double quantity,
                       double kcal, double protein, double carbs, double fat, Object portions) {
    private static final JsonMapper JSON = JsonMapper.builder().build();

    static FoodLogIdentity of(FoodLog log) {
        return new FoodLogIdentity(log.getDate(), log.getMealKey() != null ? log.getMealKey() : "index:" + log.getMealIndex(), log.getProduct(), log.getQuantity(),
                log.getKcal(), log.getProtein(), log.getCarbs(), log.getFat(), portions(log.getPortionsJson()));
    }

    static FoodLogIdentity of(FoodLogDTO log) {
        return new FoodLogIdentity(log.getDate(), log.getMealKey() != null ? log.getMealKey() : "index:" + log.getMealIndex(), log.getProduct(), log.getQuantity(),
                log.getKcal(), log.getProtein(), log.getCarbs(), log.getFat(), portions(log.getPortionsJson()));
    }

    private static Object portions(String json) {
        if (json == null || json.isBlank()) return null;
        // PostgreSQL jsonb normalizes spacing and object-key order.
        return JSON.readTree(json);
    }
}
