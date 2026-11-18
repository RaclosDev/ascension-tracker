ALTER TABLE coach_profiles
    ADD COLUMN effort_method character varying(8) DEFAULT 'RIR' NOT NULL,
    ADD COLUMN dumbbell_load character varying(8) DEFAULT 'EACH' NOT NULL,
    ADD CONSTRAINT ck_coach_profiles_effort_method CHECK (effort_method IN ('RIR', 'RPE', 'NONE')),
    ADD CONSTRAINT ck_coach_profiles_dumbbell_load CHECK (dumbbell_load IN ('EACH', 'TOTAL'));
