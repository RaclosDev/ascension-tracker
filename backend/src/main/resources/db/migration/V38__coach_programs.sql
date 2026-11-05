-- Training programs written by a coach. A library program belongs to the coach; assigning it
-- (a later step) copies it to the client, so each side owns its own rows and the copy survives
-- the coach editing or deleting the original. Everything cascades with the owner's account.

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(120) NOT NULL,
    notes VARCHAR(2000),
    weeks SMALLINT NOT NULL,
    is_library BOOLEAN NOT NULL DEFAULT TRUE,
    source_program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_programs_weeks CHECK (weeks BETWEEN 1 AND 52)
);
CREATE INDEX idx_programs_owner ON programs (owner_user_id, is_library);
CREATE INDEX idx_programs_source ON programs (source_program_id);

CREATE TABLE program_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    week SMALLINT NOT NULL,
    day_index SMALLINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    notes VARCHAR(2000),
    CONSTRAINT uq_program_days_slot UNIQUE (program_id, week, day_index),
    CONSTRAINT ck_program_days_week CHECK (week BETWEEN 1 AND 52),
    CONSTRAINT ck_program_days_day CHECK (day_index BETWEEN 1 AND 7)
);

-- exercise_name is a snapshot so the client can read exercises that only exist in the
-- coach's custom catalogue.
CREATE TABLE program_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    order_index SMALLINT NOT NULL,
    exercise_id VARCHAR(255) NOT NULL,
    exercise_name VARCHAR(255),
    variant_grip VARCHAR(255),
    variant_machine VARCHAR(255),
    sets SMALLINT NOT NULL,
    reps_min SMALLINT,
    reps_max SMALLINT,
    target_rpe NUMERIC(3, 1),
    target_rir SMALLINT,
    rest_seconds SMALLINT,
    load_hint VARCHAR(60),
    superset_group SMALLINT,
    notes VARCHAR(500),
    CONSTRAINT uq_program_exercises_order UNIQUE (program_day_id, order_index),
    CONSTRAINT ck_program_exercises_sets CHECK (sets BETWEEN 1 AND 20),
    CONSTRAINT ck_program_exercises_reps CHECK (
        (reps_min IS NULL OR reps_min BETWEEN 1 AND 100)
        AND (reps_max IS NULL OR reps_max BETWEEN 1 AND 100)
        AND (reps_min IS NULL OR reps_max IS NULL OR reps_min <= reps_max)),
    CONSTRAINT ck_program_exercises_rpe CHECK (target_rpe IS NULL OR target_rpe BETWEEN 1 AND 10),
    CONSTRAINT ck_program_exercises_rir CHECK (target_rir IS NULL OR target_rir BETWEEN 0 AND 10),
    CONSTRAINT ck_program_exercises_rest CHECK (rest_seconds IS NULL OR rest_seconds BETWEEN 0 AND 900),
    CONSTRAINT ck_program_exercises_superset CHECK (superset_group IS NULL OR superset_group BETWEEN 1 AND 20)
);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;
