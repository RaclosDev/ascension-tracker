-- Messages users send to ask about plans (a custom plan, more clients, paying for a plan).
-- The admin reads them in the back office and marks them handled.
CREATE TABLE contact_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    topic           VARCHAR(20) NOT NULL CHECK (topic IN ('PLAN', 'CUSTOM', 'OTHER')),
    message         TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
    desired_clients INTEGER CHECK (desired_clients BETWEEN 1 AND 10000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    handled_at      TIMESTAMPTZ
);

CREATE INDEX idx_contact_requests_user ON contact_requests (user_id, created_at DESC);
CREATE INDEX idx_contact_requests_open ON contact_requests (created_at DESC) WHERE handled_at IS NULL;

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
