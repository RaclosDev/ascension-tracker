CREATE TABLE ai_quota_usage (
    quota_day DATE NOT NULL,
    user_email TEXT NOT NULL,
    used INTEGER NOT NULL CHECK (used >= 0),
    PRIMARY KEY (quota_day, user_email)
);
CREATE TABLE ai_quota_reservations (
    id UUID PRIMARY KEY,
    quota_day DATE NOT NULL,
    user_email TEXT NOT NULL
);
CREATE INDEX idx_ai_quota_reservations_day ON ai_quota_reservations(quota_day);
CREATE TABLE ai_circuit_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    failures INTEGER NOT NULL DEFAULT 0,
    open_until_ms BIGINT NOT NULL DEFAULT 0
);
INSERT INTO ai_circuit_state(id) VALUES (1);
