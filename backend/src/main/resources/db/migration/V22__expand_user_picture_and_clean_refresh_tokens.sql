-- Migration V22: Expand users.picture to TEXT and remove name and picture from refresh_tokens

ALTER TABLE users ALTER COLUMN picture TYPE TEXT;

ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS name;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS picture;
