ALTER TABLE coach_clients
    ADD COLUMN review_day smallint NOT NULL DEFAULT 7 CHECK (review_day BETWEEN 1 AND 7),
    ADD COLUMN review_time time NOT NULL DEFAULT '18:00',
    ADD COLUMN review_zone varchar(80) NOT NULL DEFAULT 'Europe/Madrid',
    ADD COLUMN followup_paused boolean NOT NULL DEFAULT false,
    ADD COLUMN followup_started_at timestamptz;
