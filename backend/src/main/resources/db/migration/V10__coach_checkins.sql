-- Check-in templates, client check-ins and reminders.

CREATE TABLE checkin_templates (
    coach_user_id uuid NOT NULL,
    questions jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_checkin_templates_questions CHECK ((jsonb_typeof(questions) = 'array'::text)),
    CONSTRAINT checkin_templates_pkey PRIMARY KEY (coach_user_id),
    CONSTRAINT checkin_templates_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
ALTER TABLE checkin_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    link_id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    coach_user_id uuid NOT NULL,
    week_start date NOT NULL,
    weight_avg numeric(5,2),
    energy smallint NOT NULL,
    sleep smallint NOT NULL,
    training_adherence smallint NOT NULL,
    diet_adherence smallint NOT NULL,
    answers jsonb NOT NULL,
    notes character varying(2000),
    coach_reply character varying(2000),
    replied_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_checkins_answers CHECK ((jsonb_typeof(answers) = 'array'::text)),
    CONSTRAINT ck_checkins_monday CHECK ((EXTRACT(isodow FROM week_start) = (1)::numeric)),
    CONSTRAINT ck_checkins_scores CHECK (energy BETWEEN 1 AND 5 AND sleep BETWEEN 1 AND 5
        AND training_adherence BETWEEN 1 AND 5 AND diet_adherence BETWEEN 1 AND 5),
    CONSTRAINT checkins_pkey PRIMARY KEY (id),
    CONSTRAINT uq_checkins_link_week UNIQUE (link_id, week_start),
    CONSTRAINT checkins_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT checkins_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT checkins_link_id_fkey FOREIGN KEY (link_id) REFERENCES coach_clients(id) ON DELETE CASCADE
);
CREATE INDEX idx_checkins_client ON checkins USING btree (client_user_id);
CREATE INDEX idx_checkins_coach ON checkins USING btree (coach_user_id);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE TABLE checkin_reminders (
    link_id uuid NOT NULL,
    week_start date NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT checkin_reminders_pkey PRIMARY KEY (link_id, week_start),
    CONSTRAINT checkin_reminders_link_id_fkey FOREIGN KEY (link_id) REFERENCES coach_clients(id) ON DELETE CASCADE
);
ALTER TABLE checkin_reminders ENABLE ROW LEVEL SECURITY;
