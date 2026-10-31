ALTER TABLE workout_template_exercises ADD COLUMN order_index INTEGER;

-- The original intended order was never stored. Preserve the physical order
-- visible during migration; subsequent writes carry their explicit position.
WITH positions AS (
    SELECT ctid, ROW_NUMBER() OVER (PARTITION BY template_id ORDER BY ctid) - 1 AS position
    FROM workout_template_exercises
)
UPDATE workout_template_exercises AS exercise
SET order_index = positions.position
FROM positions
WHERE exercise.ctid = positions.ctid;
