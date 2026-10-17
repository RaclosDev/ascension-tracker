-- Sanitize residual development/mock default emails from schema
ALTER TABLE food_logs ALTER COLUMN user_email DROP DEFAULT;
ALTER TABLE meals ALTER COLUMN user_email DROP DEFAULT;
