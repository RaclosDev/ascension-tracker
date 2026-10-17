-- Remove leftover default email from food_logs
ALTER TABLE food_logs ALTER COLUMN user_email DROP DEFAULT;

-- Remove duplicate composite indexes created in V7 (covered by V1 UNIQUE constraints)
DROP INDEX IF EXISTS idx_weight_entries_email_date;
DROP INDEX IF EXISTS idx_steps_entries_email_date;

-- Ensure all push_subscriptions user_emails exist in users table prior to FK constraint
INSERT INTO users (email)
SELECT DISTINCT user_email FROM push_subscriptions
WHERE user_email IS NOT NULL AND user_email NOT IN (SELECT email FROM users)
ON CONFLICT (email) DO NOTHING;

-- Add foreign key from push_subscriptions to users(email) with ON DELETE CASCADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_push_subscriptions_user'
    ) THEN
        ALTER TABLE push_subscriptions
            ADD CONSTRAINT fk_push_subscriptions_user
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE;
    END IF;
END $$;
