package com.ascension.service;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Set;

/**
 * Tables holding a user's rows: account deletion wipes all of them, a restore only the restorable ones.
 * UserOwnedTablesSchemaTest fails when a migration adds a user table that is missing here.
 */
final class UserOwnedTables {

    record Table(String name, String userColumn, boolean restorable) {
    }

    /** Tables keyed directly by the user's email. */
    static final List<Table> DIRECT = List.of(
            new Table("custom_exercises", "user_email", true),
            new Table("food_logs", "user_email", true),
            new Table("meals", "user_email", true),
            new Table("recipes", "user_email", true),
            new Table("saved_foods", "user_email", true),
            new Table("push_subscriptions", "user_email", false),
            new Table("rest_timers", "user_email", false),
            new Table("refresh_tokens", "email", false),
            new Table("idempotent_requests", "user_email", false),
            new Table("ai_quota_usage", "user_email", false),
            new Table("ai_quota_reservations", "user_email", false),
            new Table("steps_entries", "user_email", true),
            new Table("weight_entries", "user_email", true),
            new Table("user_settings", "user_email", true));

    /** Workout and template tables, removed child-first by {@link #deleteWorkoutsAndTemplates}. */
    static final Set<String> WORKOUT_TABLES = Set.of(
            "workouts", "workout_exercises", "workout_sets",
            "workout_templates", "workout_template_exercises");

    private UserOwnedTables() {
    }

    static void deleteWorkoutsAndTemplates(JdbcTemplate jdbcTemplate, String email) {
        jdbcTemplate.update("DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?))", email);
        jdbcTemplate.update("DELETE FROM workout_exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_email = ?)", email);
        jdbcTemplate.update("DELETE FROM workouts WHERE user_email = ?", email);

        jdbcTemplate.update("DELETE FROM workout_template_exercises WHERE template_id IN (SELECT id FROM workout_templates WHERE user_email = ?)", email);
        jdbcTemplate.update("DELETE FROM workout_templates WHERE user_email = ?", email);
    }

    static int deleteFrom(JdbcTemplate jdbcTemplate, Table table, String email) {
        return jdbcTemplate.update("DELETE FROM " + table.name() + " WHERE " + table.userColumn() + " = ?", email);
    }
}
