ALTER TABLE workouts ALTER COLUMN user_email DROP DEFAULT;
ALTER TABLE user_settings ALTER COLUMN user_email DROP DEFAULT;
CREATE INDEX IF NOT EXISTS idx_food_logs_user_email ON food_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_food_logs_log_date ON food_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_workouts_user_email ON workouts(user_email);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_email ON weight_entries(user_email);
CREATE INDEX IF NOT EXISTS idx_steps_entries_user_email ON steps_entries(user_email);
