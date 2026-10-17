-- Migration V21: Add google_sub and tokens_valid_after to users for identity enforcement and token revocation

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tokens_valid_after TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Backfill tokens_valid_after for existing users to NOW() if null
UPDATE users SET tokens_valid_after = NOW() WHERE tokens_valid_after IS NULL;
