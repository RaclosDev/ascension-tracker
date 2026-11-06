-- Training programs, their assignment to clients, and coach comments on workouts.

CREATE TABLE programs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    name character varying(120) NOT NULL,
    notes character varying(2000),
    weeks smallint NOT NULL,
    is_library boolean DEFAULT true NOT NULL,
    source_program_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_programs_weeks CHECK (((weeks >= 1) AND (weeks <= 52))),
    CONSTRAINT programs_pkey PRIMARY KEY (id),
    CONSTRAINT programs_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT programs_source_program_id_fkey FOREIGN KEY (source_program_id) REFERENCES programs(id) ON DELETE SET NULL
);
CREATE INDEX idx_programs_owner ON programs USING btree (owner_user_id, is_library);
CREATE INDEX idx_programs_source ON programs USING btree (source_program_id);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

CREATE TABLE program_days (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    week smallint NOT NULL,
    day_index smallint NOT NULL,
    name character varying(120) NOT NULL,
    notes character varying(2000),
    CONSTRAINT ck_program_days_day CHECK (((day_index >= 1) AND (day_index <= 7))),
    CONSTRAINT ck_program_days_week CHECK (((week >= 1) AND (week <= 52))),
    CONSTRAINT program_days_pkey PRIMARY KEY (id),
    CONSTRAINT uq_program_days_slot UNIQUE (program_id, week, day_index),
    CONSTRAINT program_days_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
ALTER TABLE program_days ENABLE ROW LEVEL SECURITY;

CREATE TABLE program_exercises (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_day_id uuid NOT NULL,
    order_index smallint NOT NULL,
    exercise_id character varying(255) NOT NULL,
    exercise_name character varying(255),
    variant_grip character varying(255),
    variant_machine character varying(255),
    sets smallint NOT NULL,
    reps_min smallint,
    reps_max smallint,
    target_rpe numeric(3,1),
    target_rir smallint,
    rest_seconds smallint,
    load_hint character varying(60),
    superset_group smallint,
    notes character varying(500),
    CONSTRAINT ck_program_exercises_reps CHECK ((((reps_min IS NULL) OR ((reps_min >= 1) AND (reps_min <= 100))) AND ((reps_max IS NULL) OR ((reps_max >= 1) AND (reps_max <= 100))) AND ((reps_min IS NULL) OR (reps_max IS NULL) OR (reps_min <= reps_max)))),
    CONSTRAINT ck_program_exercises_rest CHECK (((rest_seconds IS NULL) OR ((rest_seconds >= 0) AND (rest_seconds <= 900)))),
    CONSTRAINT ck_program_exercises_rir CHECK (((target_rir IS NULL) OR ((target_rir >= 0) AND (target_rir <= 10)))),
    CONSTRAINT ck_program_exercises_rpe CHECK (((target_rpe IS NULL) OR ((target_rpe >= (1)::numeric) AND (target_rpe <= (10)::numeric)))),
    CONSTRAINT ck_program_exercises_sets CHECK (((sets >= 1) AND (sets <= 20))),
    CONSTRAINT ck_program_exercises_superset CHECK (((superset_group IS NULL) OR ((superset_group >= 1) AND (superset_group <= 20)))),
    CONSTRAINT program_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT uq_program_exercises_order UNIQUE (program_day_id, order_index),
    CONSTRAINT program_exercises_program_day_id_fkey FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE CASCADE
);
ALTER TABLE program_exercises ENABLE ROW LEVEL SECURITY;

CREATE TABLE program_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    program_id uuid NOT NULL,
    client_user_id uuid NOT NULL,
    coach_user_id uuid,
    coach_link_id uuid,
    start_date date NOT NULL,
    status character varying(16) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT ck_program_assignments_ended_at CHECK ((((status)::text = 'ENDED'::text) = (ended_at IS NOT NULL))),
    CONSTRAINT ck_program_assignments_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT program_assignments_pkey PRIMARY KEY (id),
    CONSTRAINT uq_program_assignments_program UNIQUE (program_id),
    CONSTRAINT program_assignments_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT program_assignments_coach_link_id_fkey FOREIGN KEY (coach_link_id) REFERENCES coach_clients(id) ON DELETE SET NULL,
    CONSTRAINT program_assignments_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT program_assignments_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
CREATE INDEX idx_program_assignments_client ON program_assignments USING btree (client_user_id, status);
CREATE INDEX idx_program_assignments_coach ON program_assignments USING btree (coach_user_id);
CREATE UNIQUE INDEX uq_program_assignments_active_link ON program_assignments USING btree (coach_link_id) WHERE ((status)::text = 'ACTIVE'::text);
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE workout_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workout_id character varying(255) NOT NULL,
    coach_user_id uuid NOT NULL,
    body character varying(1000) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_workout_comments_body CHECK ((length(btrim((body)::text)) > 0)),
    CONSTRAINT workout_comments_pkey PRIMARY KEY (id),
    CONSTRAINT uq_workout_comments_coach UNIQUE (workout_id, coach_user_id),
    CONSTRAINT workout_comments_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT workout_comments_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);
CREATE INDEX idx_workout_comments_coach ON workout_comments USING btree (coach_user_id);
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

ALTER TABLE workouts
    ADD CONSTRAINT workouts_program_day_id_fkey FOREIGN KEY (program_day_id) REFERENCES program_days(id) ON DELETE SET NULL;
