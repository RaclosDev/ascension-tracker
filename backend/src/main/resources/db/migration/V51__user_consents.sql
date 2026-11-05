-- Every consent the user gives or withdraws, with the version of the texts they saw. Rows are only
-- added, never changed, so the history proves what was accepted and when (GDPR art. 7.1).
CREATE TABLE user_consents (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    kind       VARCHAR(32) NOT NULL CHECK (kind IN ('TERMS', 'PRIVACY', 'HEALTH_DATA', 'AI_HEALTH', 'COACH_TERMS')),
    version    VARCHAR(32) NOT NULL,
    granted    BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_consents_user ON user_consents (user_id, kind, created_at DESC);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
