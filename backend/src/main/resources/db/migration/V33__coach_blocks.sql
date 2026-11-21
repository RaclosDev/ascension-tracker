-- A week that repeats another one follows its source until the coach edits it.
ALTER TABLE coach_week_plans ADD COLUMN linked_from date;

-- The block a coach is running with an athlete: a named run of consecutive weeks.
CREATE TABLE coach_blocks (
    link_id uuid PRIMARY KEY REFERENCES coach_clients(id) ON DELETE CASCADE,
    name varchar(80) NOT NULL,
    start_week date NOT NULL,
    weeks integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    CHECK (EXTRACT(ISODOW FROM start_week) = 1),
    CHECK (weeks BETWEEN 2 AND 12)
);
ALTER TABLE coach_blocks ENABLE ROW LEVEL SECURITY;
