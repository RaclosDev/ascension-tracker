-- Migration V24: Multi-device push subscriptions and persisted rest timers

-- 1. Push subscriptions: allow multiple devices per user and enforce unique endpoint
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_email_key;
DROP INDEX IF EXISTS push_subscriptions_user_email_key;

-- Ensure an index exists on user_email for efficient lookup across multiple devices
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_email ON push_subscriptions (user_email);

-- Deduplicate any pre-existing duplicate endpoints before enforcing unique constraint
DELETE FROM push_subscriptions a
USING push_subscriptions b
WHERE a.endpoint = b.endpoint AND a.id < b.id;

-- Enforce uniqueness on endpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_push_subscriptions_endpoint'
    ) THEN
        ALTER TABLE push_subscriptions ADD CONSTRAINT uq_push_subscriptions_endpoint UNIQUE (endpoint);
    END IF;
END $$;

-- 2. Persisted rest timers table
CREATE TABLE IF NOT EXISTS rest_timers (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    fire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rest_timers_status_fire_at ON rest_timers (status, fire_at);
CREATE INDEX IF NOT EXISTS idx_rest_timers_user_email ON rest_timers (user_email);
