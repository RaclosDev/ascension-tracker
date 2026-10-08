ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS activity_factor float(53);
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS sex varchar(1);
