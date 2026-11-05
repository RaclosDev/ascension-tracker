-- The coach's recipe library: macros per serving (kcal follow from the grams), plus free text
-- with ingredients and preparation. Recipes are private to the coach; a meal plan stores a copy
-- of what it uses, so editing or deleting a recipe never changes what a client was prescribed.

CREATE TABLE coach_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000),
    protein NUMERIC(6, 1) NOT NULL,
    carbs NUMERIC(6, 1) NOT NULL,
    fat NUMERIC(6, 1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_coach_recipes_grams CHECK (
        protein BETWEEN 0 AND 1000 AND carbs BETWEEN 0 AND 1000 AND fat BETWEEN 0 AND 1000)
);

CREATE INDEX idx_coach_recipes_coach ON coach_recipes (coach_user_id);

ALTER TABLE coach_recipes ENABLE ROW LEVEL SECURITY;
