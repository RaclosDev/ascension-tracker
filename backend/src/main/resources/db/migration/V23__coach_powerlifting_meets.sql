CREATE TABLE coach_powerlifting_meets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES coach_clients(id) ON UPDATE CASCADE ON DELETE CASCADE,
    content JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coach_powerlifting_meets_link ON coach_powerlifting_meets(link_id);
ALTER TABLE coach_powerlifting_meets ENABLE ROW LEVEL SECURITY;
