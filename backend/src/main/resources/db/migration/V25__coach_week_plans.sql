CREATE TABLE coach_week_plans (
    link_id uuid NOT NULL REFERENCES coach_clients(id) ON DELETE CASCADE,
    week_start date NOT NULL,
    content jsonb NOT NULL,
    version integer NOT NULL DEFAULT 1,
    assignment_id uuid REFERENCES program_assignments(id) ON DELETE SET NULL,
    published_version integer,
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    PRIMARY KEY (link_id, week_start),
    CHECK (EXTRACT(ISODOW FROM week_start) = 1),
    CHECK (version > 0)
);
ALTER TABLE coach_week_plans ENABLE ROW LEVEL SECURITY;
