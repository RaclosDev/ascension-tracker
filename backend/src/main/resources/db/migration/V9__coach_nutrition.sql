-- Coach recipes and nutrition plans.

CREATE TABLE coach_recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coach_user_id uuid NOT NULL,
    name character varying(120) NOT NULL,
    description character varying(2000),
    protein numeric(6,1) NOT NULL,
    carbs numeric(6,1) NOT NULL,
    fat numeric(6,1) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_coach_recipes_grams CHECK (protein BETWEEN 0 AND 1000 AND carbs BETWEEN 0 AND 1000 AND fat BETWEEN 0 AND 1000),
    CONSTRAINT coach_recipes_pkey PRIMARY KEY (id),
    CONSTRAINT coach_recipes_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_coach_recipes_coach ON coach_recipes USING btree (coach_user_id);
ALTER TABLE coach_recipes ENABLE ROW LEVEL SECURITY;

CREATE TABLE nutrition_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_user_id uuid NOT NULL,
    coach_user_id uuid,
    coach_link_id uuid,
    training_protein integer NOT NULL,
    training_carbs integer NOT NULL,
    training_fat integer NOT NULL,
    rest_protein integer NOT NULL,
    rest_carbs integer NOT NULL,
    rest_fat integer NOT NULL,
    notes character varying(1000),
    status character varying(16) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    ended_at timestamp with time zone,
    CONSTRAINT ck_nutrition_plans_ended_at CHECK ((((status)::text = 'ENDED'::text) = (ended_at IS NOT NULL))),
    CONSTRAINT ck_nutrition_plans_grams CHECK (training_protein BETWEEN 0 AND 1000 AND training_carbs BETWEEN 0 AND 1000
        AND training_fat BETWEEN 0 AND 1000 AND rest_protein BETWEEN 0 AND 1000
        AND rest_carbs BETWEEN 0 AND 1000 AND rest_fat BETWEEN 0 AND 1000),
    CONSTRAINT ck_nutrition_plans_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT nutrition_plans_pkey PRIMARY KEY (id),
    CONSTRAINT nutrition_plans_client_user_id_fkey FOREIGN KEY (client_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT nutrition_plans_coach_link_id_fkey FOREIGN KEY (coach_link_id) REFERENCES coach_clients(id) ON DELETE SET NULL,
    CONSTRAINT nutrition_plans_coach_user_id_fkey FOREIGN KEY (coach_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX idx_nutrition_plans_coach ON nutrition_plans USING btree (coach_user_id);
CREATE INDEX idx_nutrition_plans_link ON nutrition_plans USING btree (coach_link_id);
CREATE UNIQUE INDEX uq_nutrition_plans_active_client ON nutrition_plans USING btree (client_user_id) WHERE ((status)::text = 'ACTIVE'::text);
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE nutrition_plan_meals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    day_type character varying(16) NOT NULL,
    "position" integer NOT NULL,
    slot_name character varying(60) NOT NULL,
    recipe_id uuid,
    recipe_name character varying(120) NOT NULL,
    recipe_description character varying(2000),
    servings numeric(4,2) NOT NULL,
    protein numeric(6,1) NOT NULL,
    carbs numeric(6,1) NOT NULL,
    fat numeric(6,1) NOT NULL,
    CONSTRAINT ck_nutrition_plan_meals_day_type CHECK (day_type IN ('TRAINING', 'REST')),
    CONSTRAINT ck_nutrition_plan_meals_grams CHECK (protein BETWEEN 0 AND 1000 AND carbs BETWEEN 0 AND 1000 AND fat BETWEEN 0 AND 1000),
    CONSTRAINT ck_nutrition_plan_meals_servings CHECK (((servings >= 0.25) AND (servings <= (10)::numeric))),
    CONSTRAINT nutrition_plan_meals_pkey PRIMARY KEY (id),
    CONSTRAINT uq_nutrition_plan_meals_position UNIQUE (plan_id, day_type, "position"),
    CONSTRAINT nutrition_plan_meals_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    CONSTRAINT nutrition_plan_meals_recipe_id_fkey FOREIGN KEY (recipe_id) REFERENCES coach_recipes(id) ON DELETE SET NULL
);
CREATE INDEX idx_nutrition_plan_meals_recipe ON nutrition_plan_meals USING btree (recipe_id);
ALTER TABLE nutrition_plan_meals ENABLE ROW LEVEL SECURITY;
