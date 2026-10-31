ALTER TABLE rest_timers ADD COLUMN claim_token VARCHAR(36);
ALTER TABLE rest_timers ADD COLUMN lease_until TIMESTAMPTZ;
ALTER TABLE rest_timers ADD COLUMN next_attempt_at TIMESTAMPTZ;
-- Recover legacy PROCESSING rows, if any, without changing completed timers.
UPDATE rest_timers SET lease_until = CURRENT_TIMESTAMP WHERE status = 'PROCESSING';
CREATE INDEX rest_timers_lease_expiry ON rest_timers(lease_until) WHERE status = 'PROCESSING';
