CREATE TABLE coach_nutrition_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    content JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_nutrition_templates_owner ON coach_nutrition_templates(coach_user_id);

ALTER TABLE coach_nutrition_templates ENABLE ROW LEVEL SECURITY;
