-- A coach's comment on one of their client's workouts: one per coach and workout, editable.
-- It belongs to the workout (deleted with it) and to the coach (deleted with their account);
-- ending the link keeps it, so the client still reads the feedback they got.

CREATE TABLE workout_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id VARCHAR(255) NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    coach_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    body VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_workout_comments_coach UNIQUE (workout_id, coach_user_id),
    CONSTRAINT ck_workout_comments_body CHECK (length(btrim(body)) > 0)
);

CREATE INDEX idx_workout_comments_coach ON workout_comments (coach_user_id);

ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
