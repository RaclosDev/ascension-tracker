CREATE TABLE coach_powerlifting_profiles (
    link_id UUID PRIMARY KEY REFERENCES coach_clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coach_powerlifting_profiles ENABLE ROW LEVEL SECURITY;
