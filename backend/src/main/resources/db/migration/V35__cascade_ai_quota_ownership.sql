CREATE TABLE ai_quota_global (
    quota_day DATE PRIMARY KEY,
    used INTEGER NOT NULL CHECK (used >= 0)
);
INSERT INTO ai_quota_global(quota_day, used)
SELECT quota_day, used FROM ai_quota_usage WHERE user_email = '';
DELETE FROM ai_quota_usage WHERE user_email = '';

ALTER TABLE ai_quota_usage ADD CONSTRAINT fk_ai_quota_usage_user
    FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ai_quota_reservations ADD CONSTRAINT fk_ai_quota_reservation_user
    FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE;
