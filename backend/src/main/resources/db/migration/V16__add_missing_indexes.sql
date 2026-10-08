CREATE INDEX IF NOT EXISTS idx_meals_user_email ON meals (user_email);
CREATE INDEX IF NOT EXISTS idx_saved_foods_user_email ON saved_foods (user_email);
CREATE INDEX IF NOT EXISTS idx_recipes_user_email ON recipes (user_email);
