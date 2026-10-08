ALTER TABLE food_logs ALTER COLUMN portions_json TYPE jsonb USING portions_json::jsonb;
ALTER TABLE user_settings ALTER COLUMN workout_data TYPE jsonb USING workout_data::jsonb;
