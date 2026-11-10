-- What the coach asks for when inviting someone, and optionally the details they already know about
-- that person so the client only has to sign up and accept. The details are cleared once the invitation
-- is accepted, revoked or expired: they then live (if at all) in the client's own settings.
ALTER TABLE coach_invitations
    ADD COLUMN client_name character varying(80),
    ADD COLUMN asks_training boolean DEFAULT false NOT NULL,
    ADD COLUMN asks_nutrition boolean DEFAULT false NOT NULL,
    ADD COLUMN asks_body boolean DEFAULT false NOT NULL,
    ADD COLUMN asks_edit_training boolean DEFAULT false NOT NULL,
    ADD COLUMN asks_edit_nutrition boolean DEFAULT false NOT NULL,
    ADD COLUMN prefill_sex character varying(1),
    ADD COLUMN prefill_age smallint,
    ADD COLUMN prefill_height_cm smallint,
    ADD COLUMN prefill_start_weight numeric(5,1),
    ADD COLUMN prefill_goal_weight numeric(5,1),
    ADD COLUMN prefill_activity_factor numeric(4,3),
    ADD COLUMN prefill_app_modules character varying(32),
    ADD CONSTRAINT ck_coach_invitations_prefill_sex CHECK (prefill_sex IS NULL OR prefill_sex IN ('M', 'F')),
    ADD CONSTRAINT ck_coach_invitations_prefill_age CHECK (prefill_age IS NULL OR prefill_age BETWEEN 10 AND 120),
    ADD CONSTRAINT ck_coach_invitations_prefill_height CHECK (prefill_height_cm IS NULL OR prefill_height_cm BETWEEN 50 AND 300),
    ADD CONSTRAINT ck_coach_invitations_prefill_weights CHECK (
        (prefill_start_weight IS NULL OR prefill_start_weight BETWEEN 1 AND 1000)
        AND (prefill_goal_weight IS NULL OR prefill_goal_weight BETWEEN 1 AND 1000)),
    ADD CONSTRAINT ck_coach_invitations_prefill_activity CHECK (prefill_activity_factor IS NULL OR prefill_activity_factor BETWEEN 1 AND 3),
    ADD CONSTRAINT ck_coach_invitations_prefill_modules CHECK (prefill_app_modules IS NULL
        OR prefill_app_modules IN ('TRAINING', 'TRAINING_NUTRITION', 'TRAINING_BODY', 'FULL'));
