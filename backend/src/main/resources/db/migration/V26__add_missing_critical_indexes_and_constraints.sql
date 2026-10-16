-- Migration V26: Add missing critical indexes, cascade constraints, and data integrity checks

-- 1. Critical performance indexes on foreign keys and high-frequency search columns
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_email ON custom_exercises (user_email);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_email ON workout_templates (user_email);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template_id ON workout_template_exercises (template_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_email ON refresh_tokens (email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expiry_date ON refresh_tokens (expiry_date);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON workout_exercises (exercise_id);

-- 2. Clean up orphaned rest timers and enforce foreign key with cascade deletion
DELETE FROM rest_timers WHERE user_email NOT IN (SELECT email FROM users);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_rest_timers_user_email'
    ) THEN
        ALTER TABLE rest_timers
            ADD CONSTRAINT fk_rest_timers_user_email
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Deduplicate meals and enforce uniqueness per user and meal name
DELETE FROM meals a
USING meals b
WHERE a.user_email = b.user_email
  AND a.name = b.name
  AND a.id < b.id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_meals_user_email_name'
    ) THEN
        ALTER TABLE meals ADD CONSTRAINT uq_meals_user_email_name UNIQUE (user_email, name);
    END IF;
END $$;

-- 4. Check constraints for data integrity (prevent negative metrics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_food_logs_non_negative') THEN
        ALTER TABLE food_logs ADD CONSTRAINT chk_food_logs_non_negative
            CHECK (quantity >= 0 AND kcal >= 0 AND protein >= 0 AND carbs >= 0 AND fat >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_weight_entries_positive') THEN
        ALTER TABLE weight_entries ADD CONSTRAINT chk_weight_entries_positive
            CHECK (weight > 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_steps_entries_non_negative') THEN
        ALTER TABLE steps_entries ADD CONSTRAINT chk_steps_entries_non_negative
            CHECK (steps >= 0);
    END IF;
END $$;

-- 5. Optimistic locking support for user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0 NOT NULL;
