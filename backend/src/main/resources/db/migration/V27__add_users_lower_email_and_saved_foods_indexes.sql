-- V27: Case-insensitive unique index for users email and compound index for saved_foods lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_lower_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_saved_foods_user_name ON saved_foods (user_email, name);
