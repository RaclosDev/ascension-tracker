-- Email and password sign-in next to Google, with email verification and password reset, and
-- passkeys (WebAuthn) to sign in with the fingerprint, face or device PIN.
-- None of the new tables has an email column: they reference users(id), so changing the account
-- email never leaves a copy behind and deleting the account removes them in cascade.

-- BCrypt hash; NULL for accounts that only sign in with Google.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(100);

-- Sign-ups waiting for the 6-digit code sent by email. The email is stored only as its SHA-256.
CREATE TABLE pending_registrations (
    email_hash    VARCHAR(64) PRIMARY KEY,
    password_hash VARCHAR(100) NOT NULL,
    code_hash     VARCHAR(64) NOT NULL,
    attempts      INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL,
    expires_at    TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_pending_registrations_expires ON pending_registrations (expires_at);
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- One-use password reset links; only the SHA-256 of the token is kept.
CREATE TABLE password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens (expires_at);
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Passkeys of each account.
CREATE TABLE passkeys (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    credential_id   BYTEA NOT NULL UNIQUE,
    user_handle     BYTEA NOT NULL,
    public_key_cose BYTEA NOT NULL,
    signature_count BIGINT NOT NULL DEFAULT 0,
    name            VARCHAR(60) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL,
    last_used_at    TIMESTAMPTZ
);
CREATE INDEX idx_passkeys_user ON passkeys (user_id);
CREATE INDEX idx_passkeys_user_handle ON passkeys (user_handle);
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- WebAuthn challenges in progress: single use, five minutes. user_id is NULL for sign-in.
CREATE TABLE passkey_challenges (
    id           VARCHAR(64) PRIMARY KEY,
    user_id      UUID REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
    request_json TEXT NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_passkey_challenges_expires ON passkey_challenges (expires_at);
ALTER TABLE passkey_challenges ENABLE ROW LEVEL SECURITY;
