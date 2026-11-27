-- Email verification for accounts created with a password, and the notice shown to the person who
-- takes over an account that someone else had prepared with their address before they verified it.

-- One-use verification links; only the SHA-256 of the token is kept.
CREATE TABLE email_verification_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens (user_id);
CREATE INDEX idx_email_verification_tokens_expires ON email_verification_tokens (expires_at);
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- What was closed when the account was taken over; shown once on the first screen, then cleared.
ALTER TABLE users ADD COLUMN account_notice VARCHAR(500);
