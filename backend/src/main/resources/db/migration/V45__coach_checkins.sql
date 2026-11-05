-- Weekly check-ins: the questions a coach asks every week and what each client answers.
-- A check-in belongs to the link it was sent through, one per link and week (Monday). The client
-- can change it until the coach replies. Ending the link keeps the check-ins for both sides.

CREATE TABLE checkin_templates (
    coach_user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    questions JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_checkin_templates_questions CHECK (jsonb_typeof(questions) = 'array')
);

CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    link_id UUID NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    week_start DATE NOT NULL,
    -- Only filled while the client shares their body data with this coach.
    weight_avg NUMERIC(5, 2),
    energy SMALLINT NOT NULL,
    sleep SMALLINT NOT NULL,
    training_adherence SMALLINT NOT NULL,
    diet_adherence SMALLINT NOT NULL,
    -- [{question, answer}]: the questions are copied so later template edits do not change them.
    answers JSONB NOT NULL,
    notes VARCHAR(2000),
    coach_reply VARCHAR(2000),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_checkins_link_week UNIQUE (link_id, week_start),
    CONSTRAINT ck_checkins_monday CHECK (EXTRACT(ISODOW FROM week_start) = 1),
    CONSTRAINT ck_checkins_scores CHECK (energy BETWEEN 1 AND 5 AND sleep BETWEEN 1 AND 5
        AND training_adherence BETWEEN 1 AND 5 AND diet_adherence BETWEEN 1 AND 5),
    CONSTRAINT ck_checkins_answers CHECK (jsonb_typeof(answers) = 'array')
);

CREATE INDEX idx_checkins_client ON checkins (client_user_id);
CREATE INDEX idx_checkins_coach ON checkins (coach_user_id);

ALTER TABLE checkin_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
