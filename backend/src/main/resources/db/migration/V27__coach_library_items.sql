CREATE TABLE coach_library_items (
    coach_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    item_type varchar(16) NOT NULL CHECK (item_type IN ('PROGRAM', 'EXERCISE')),
    item_id varchar(255) NOT NULL,
    favorite boolean NOT NULL DEFAULT false,
    category varchar(16) NOT NULL DEFAULT 'PROGRAM',
    tags jsonb NOT NULL DEFAULT '[]',
    minutes smallint,
    equipment varchar(120) NOT NULL DEFAULT '',
    last_used timestamptz,
    PRIMARY KEY (coach_user_id, item_type, item_id),
    CHECK (minutes IS NULL OR minutes BETWEEN 1 AND 300)
);
ALTER TABLE coach_library_items ENABLE ROW LEVEL SECURITY;
