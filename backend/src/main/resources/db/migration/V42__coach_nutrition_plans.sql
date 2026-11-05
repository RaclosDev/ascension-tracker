-- A client can let a coach set their nutrition targets (on top of seeing them). The coach's
-- plan gives grams of protein, carbs and fat for training days and for rest days; kcal follow
-- from the grams. Each change is a new row (the previous one ends), so adherence can be measured
-- against what was prescribed at the time. A plan only applies while its link is active and
-- still grants editing; otherwise the client's own settings apply again.

ALTER TABLE coach_clients ADD COLUMN can_edit_nutrition BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE coach_clients ADD CONSTRAINT ck_coach_clients_edit_nutrition_needs_view
    CHECK (NOT can_edit_nutrition OR can_view_nutrition);

CREATE TABLE nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    coach_user_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    coach_link_id UUID REFERENCES coach_clients(id) ON DELETE SET NULL,
    training_protein INTEGER NOT NULL,
    training_carbs INTEGER NOT NULL,
    training_fat INTEGER NOT NULL,
    rest_protein INTEGER NOT NULL,
    rest_carbs INTEGER NOT NULL,
    rest_fat INTEGER NOT NULL,
    notes VARCHAR(1000),
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_nutrition_plans_grams CHECK (
        training_protein BETWEEN 0 AND 1000 AND training_carbs BETWEEN 0 AND 1000
        AND training_fat BETWEEN 0 AND 1000 AND rest_protein BETWEEN 0 AND 1000
        AND rest_carbs BETWEEN 0 AND 1000 AND rest_fat BETWEEN 0 AND 1000),
    CONSTRAINT ck_nutrition_plans_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT ck_nutrition_plans_ended_at CHECK ((status = 'ENDED') = (ended_at IS NOT NULL))
);

-- One plan in force per client: a new one ends the previous, whoever set it.
CREATE UNIQUE INDEX uq_nutrition_plans_active_client
    ON nutrition_plans (client_user_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_nutrition_plans_coach ON nutrition_plans (coach_user_id);
CREATE INDEX idx_nutrition_plans_link ON nutrition_plans (coach_link_id);

ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
