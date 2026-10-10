CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    picture VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert existing emails from various tables to avoid FK constraint violations
INSERT INTO users (email)
SELECT DISTINCT email FROM (
    SELECT user_email AS email FROM workouts WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM meals WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM food_logs WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM custom_exercises WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM recipes WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM saved_foods WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM steps_entries WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM user_settings WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM weight_entries WHERE user_email IS NOT NULL
    UNION
    SELECT user_email AS email FROM workout_templates WHERE user_email IS NOT NULL
    UNION
    SELECT email FROM refresh_tokens WHERE email IS NOT NULL
) AS all_emails
ON CONFLICT (email) DO NOTHING;

-- Now add foreign keys
ALTER TABLE workouts ADD CONSTRAINT fk_workouts_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE meals ADD CONSTRAINT fk_meals_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE food_logs ADD CONSTRAINT fk_food_logs_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE custom_exercises ADD CONSTRAINT fk_custom_exercises_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE recipes ADD CONSTRAINT fk_recipes_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE saved_foods ADD CONSTRAINT fk_saved_foods_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE steps_entries ADD CONSTRAINT fk_steps_entries_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE weight_entries ADD CONSTRAINT fk_weight_entries_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE workout_templates ADD CONSTRAINT fk_workout_templates_user_email FOREIGN KEY (user_email) REFERENCES users(email);
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_email FOREIGN KEY (email) REFERENCES users(email);
