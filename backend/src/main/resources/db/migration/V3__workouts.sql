-- Logged workouts with their exercises, sets and rest timers.

CREATE TABLE workouts (
    finished_at bigint,
    started_at bigint,
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    notes text,
    user_email character varying(255) NOT NULL,
    program_day_id uuid,
    program_origin character varying(24),
    CONSTRAINT ck_workouts_program_origin CHECK (program_origin IS NULL OR program_origin IN ('PRESCRIBED', 'PRESCRIBED_MODIFIED')),
    CONSTRAINT workouts_pkey PRIMARY KEY (id),
    CONSTRAINT fk_workouts_user_email FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE
);
CREATE INDEX idx_workouts_program_day ON workouts USING btree (program_day_id) WHERE (program_day_id IS NOT NULL);
CREATE INDEX idx_workouts_user_email ON workouts USING btree (user_email);
CREATE INDEX idx_workouts_user_email_started_at ON workouts USING btree (user_email, started_at);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE workout_exercises (
    order_index integer,
    exercise_id character varying(255),
    id character varying(255) NOT NULL,
    notes text,
    superset_id character varying(255),
    workout_id character varying(255) NOT NULL,
    variant_grip character varying(255),
    variant_machine character varying(255),
    CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT fkd2ychryarm8gp13672lojwr78 FOREIGN KEY (workout_id) REFERENCES workouts(id)
);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises USING btree (exercise_id);
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises USING btree (workout_id);
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE TABLE workout_sets (
    completed boolean,
    order_index integer,
    distance character varying(255),
    duration character varying(255),
    id character varying(255) NOT NULL,
    reps numeric(10,2),
    rpe character varying(255),
    type character varying(255),
    weight numeric(10,2),
    workout_exercise_id character varying(255) NOT NULL,
    CONSTRAINT workout_sets_pkey PRIMARY KEY (id),
    CONSTRAINT fk344fsmivnj500l86uf14e2yrm FOREIGN KEY (workout_exercise_id) REFERENCES workout_exercises(id)
);
CREATE INDEX idx_workout_sets_workout_exercise_id ON workout_sets USING btree (workout_exercise_id);
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

CREATE TABLE rest_timers (
    id bigserial,
    user_email character varying(255) NOT NULL,
    fire_at timestamp with time zone NOT NULL,
    status character varying(32) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    claim_token character varying(36),
    lease_until timestamp with time zone,
    next_attempt_at timestamp with time zone,
    CONSTRAINT rest_timers_pkey PRIMARY KEY (id),
    CONSTRAINT fk_rest_timers_user_email FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_rest_timers_status_fire_at ON rest_timers USING btree (status, fire_at);
CREATE INDEX idx_rest_timers_user_email ON rest_timers USING btree (user_email);
CREATE INDEX rest_timers_lease_expiry ON rest_timers USING btree (lease_until) WHERE ((status)::text = 'PROCESSING'::text);
ALTER TABLE rest_timers ENABLE ROW LEVEL SECURITY;
