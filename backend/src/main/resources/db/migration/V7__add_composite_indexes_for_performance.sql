CREATE INDEX IF NOT EXISTS idx_workouts_user_email_started_at ON workouts(user_email, started_at);
CREATE INDEX IF NOT EXISTS idx_weight_entries_email_date ON weight_entries(user_email, date);
CREATE INDEX IF NOT EXISTS idx_food_logs_email_date ON food_logs(user_email, log_date);
CREATE INDEX IF NOT EXISTS idx_steps_entries_email_date ON steps_entries(user_email, date);
