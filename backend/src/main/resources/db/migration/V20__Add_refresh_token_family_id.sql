-- Migration V20: Add family_id and grace_used to refresh_tokens for secure token rotation

ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS family_id VARCHAR(64);
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS grace_used BOOLEAN DEFAULT FALSE NOT NULL;

-- Backfill existing tokens to use their token hash as their initial family_id
UPDATE refresh_tokens SET family_id = token WHERE family_id IS NULL;

-- Enforce NOT NULL on family_id
ALTER TABLE refresh_tokens ALTER COLUMN family_id SET NOT NULL;

-- Indexes for performance and cleanup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_replaced_at ON refresh_tokens(replaced_at);
