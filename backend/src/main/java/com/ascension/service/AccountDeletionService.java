package com.ascension.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void wipeAccountData(String email) {
        log.warn("Initiating complete GDPR account wipe for user: {}", email);
        
        jdbcTemplate.update("DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?))", email);
        jdbcTemplate.update("DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?)", email);
        jdbcTemplate.update("DELETE FROM workouts WHERE user_email = ?", email);
        
        jdbcTemplate.update("DELETE FROM workout_template_exercises WHERE template_id IN (SELECT id FROM workout_templates WHERE user_email = ?)", email);
        jdbcTemplate.update("DELETE FROM workout_templates WHERE user_email = ?", email);

        String[] tables = {
            "custom_exercises",
            "food_logs",
            "meals",
            "recipes",
            "saved_foods",
            "push_subscriptions",
            "refresh_tokens",
            "steps_entries",
            "weight_entries",
            "user_settings"
        };

        for (String table : tables) {
            String column = table.equals("refresh_tokens") ? "email" : "user_email";
            int count = jdbcTemplate.update("DELETE FROM " + table + " WHERE " + column + " = ?", email);
            if (count > 0) {
                log.info("Deleted {} rows from {} for user {}", count, table, email);
            }
        }
        
        log.warn("Account wipe completed for user: {}", email);
    }
}
