-- Custom exercises and reusable workout templates.

CREATE TABLE custom_exercises (
    equipment character varying(255),
    id character varying(255) NOT NULL,
    muscle character varying(255),
    name character varying(255),
    user_email character varying(255),
    CONSTRAINT custom_exercises_pkey PRIMARY KEY (id),
    CONSTRAINT fk_custom_exercises_user_email FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE
);
CREATE INDEX idx_custom_exercises_user_email ON custom_exercises USING btree (user_email);
ALTER TABLE custom_exercises ENABLE ROW LEVEL SECURITY;

CREATE TABLE workout_templates (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    user_email character varying(255) NOT NULL,
    CONSTRAINT workout_templates_pkey PRIMARY KEY (id),
    CONSTRAINT fk_workout_templates_user_email FOREIGN KEY (user_email) REFERENCES users(email) ON UPDATE CASCADE
);
CREATE INDEX idx_workout_templates_user_email ON workout_templates USING btree (user_email);
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE workout_template_exercises (
    exercise_id character varying(255),
    template_id character varying(255) NOT NULL,
    variant_grip character varying(255),
    variant_machine character varying(255),
    order_index integer,
    CONSTRAINT fkmshwl2pqww78k84yxa1ok29xd FOREIGN KEY (template_id) REFERENCES workout_templates(id)
);
CREATE INDEX idx_workout_template_exercises_template_id ON workout_template_exercises USING btree (template_id);
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
