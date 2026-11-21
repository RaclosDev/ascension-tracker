-- What a coach says about one day of an athlete's week, whether or not the athlete trained that day.
CREATE TABLE coach_day_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_client_id uuid NOT NULL,
    day date NOT NULL,
    body character varying(1000) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_coach_day_comments_body CHECK ((length(btrim((body)::text)) > 0)),
    CONSTRAINT coach_day_comments_pkey PRIMARY KEY (id),
    CONSTRAINT uq_coach_day_comments_day UNIQUE (coach_client_id, day),
    CONSTRAINT coach_day_comments_coach_client_id_fkey FOREIGN KEY (coach_client_id) REFERENCES coach_clients(id) ON DELETE CASCADE
);
ALTER TABLE coach_day_comments ENABLE ROW LEVEL SECURITY;
