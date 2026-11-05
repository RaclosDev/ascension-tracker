-- Meals a coach prescribes inside a nutrition plan: per kind of day, one row per meal slot with
-- a copy of the recipe (name, description, macros per serving) and the servings. The copy keeps
-- the plan as it was prescribed even if the coach later edits or deletes the recipe.

CREATE TABLE nutrition_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
    day_type VARCHAR(16) NOT NULL,
    position INTEGER NOT NULL,
    slot_name VARCHAR(60) NOT NULL,
    recipe_id UUID REFERENCES coach_recipes(id) ON DELETE SET NULL,
    recipe_name VARCHAR(120) NOT NULL,
    recipe_description VARCHAR(2000),
    servings NUMERIC(4, 2) NOT NULL,
    protein NUMERIC(6, 1) NOT NULL,
    carbs NUMERIC(6, 1) NOT NULL,
    fat NUMERIC(6, 1) NOT NULL,
    CONSTRAINT ck_nutrition_plan_meals_day_type CHECK (day_type IN ('TRAINING', 'REST')),
    CONSTRAINT ck_nutrition_plan_meals_servings CHECK (servings BETWEEN 0.25 AND 10),
    CONSTRAINT ck_nutrition_plan_meals_grams CHECK (
        protein BETWEEN 0 AND 1000 AND carbs BETWEEN 0 AND 1000 AND fat BETWEEN 0 AND 1000),
    CONSTRAINT uq_nutrition_plan_meals_position UNIQUE (plan_id, day_type, position)
);

CREATE INDEX idx_nutrition_plan_meals_recipe ON nutrition_plan_meals (recipe_id);

ALTER TABLE nutrition_plan_meals ENABLE ROW LEVEL SECURITY;
