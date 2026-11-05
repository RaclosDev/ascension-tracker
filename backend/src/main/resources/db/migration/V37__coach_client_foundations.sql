-- Coach mode foundations: a stable user id, coach profiles, coach-client links,
-- single-use invitations and a per-day access log the client can read.
-- A client's data stays keyed by the client; a coach only gets delegated read access
-- while an ACTIVE link grants it. Every reference to users(id) cascades on account deletion.

ALTER TABLE users ADD COLUMN id UUID;
UPDATE users SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE users ALTER COLUMN id SET NOT NULL;
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ADD CONSTRAINT uq_users_id UNIQUE (id);

CREATE TABLE coach_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE coach_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    status VARCHAR(16) NOT NULL,
    can_view_training BOOLEAN NOT NULL,
    can_view_nutrition BOOLEAN NOT NULL,
    can_view_body BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_coach_clients_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT ck_coach_clients_not_self CHECK (coach_user_id <> client_user_id),
    CONSTRAINT ck_coach_clients_ended_at CHECK ((status = 'ENDED') = (ended_at IS NOT NULL))
);

-- At most one open link per coach and client; ended links stay as history.
CREATE UNIQUE INDEX uq_coach_clients_open
    ON coach_clients (coach_user_id, client_user_id) WHERE status <> 'ENDED';
CREATE INDEX idx_coach_clients_client ON coach_clients (client_user_id);

CREATE TABLE coach_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    token_hash CHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_coach_invitations_token UNIQUE (token_hash),
    CONSTRAINT ck_coach_invitations_single_outcome CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);
CREATE INDEX idx_coach_invitations_coach ON coach_invitations (coach_user_id);
CREATE INDEX idx_coach_invitations_accepted_by ON coach_invitations (accepted_by);

-- One row per coach, client, action and day keeps the log bounded while still answering
-- "who looked at what, and when" for the client.
CREATE TABLE coach_access_log (
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    action VARCHAR(32) NOT NULL,
    access_date DATE NOT NULL,
    first_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    hits INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (client_user_id, coach_user_id, action, access_date)
);
CREATE INDEX idx_coach_access_log_coach ON coach_access_log (coach_user_id);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_access_log ENABLE ROW LEVEL SECURITY;
