-- V23: Convert workout_sets.weight and workout_sets.reps from VARCHAR to NUMERIC with safe backfill

-- 1. Normalize commas to dots in weight and reps
UPDATE workout_sets
SET weight = TRIM(REPLACE(weight, ',', '.'))
WHERE weight IS NOT NULL AND weight LIKE '%,%';

UPDATE workout_sets
SET reps = TRIM(REPLACE(reps, ',', '.'))
WHERE reps IS NOT NULL AND reps LIKE '%,%';

-- 2. Any non-numeric strings or empty/whitespace strings set to NULL
UPDATE workout_sets
SET weight = NULL
WHERE weight IS NOT NULL AND TRIM(weight) !~ '^[0-9]+(\.[0-9]+)?$';

UPDATE workout_sets
SET reps = NULL
WHERE reps IS NOT NULL AND TRIM(reps) !~ '^[0-9]+(\.[0-9]+)?$';

-- 3. Alter columns to NUMERIC(10, 2)
ALTER TABLE workout_sets
    ALTER COLUMN weight TYPE NUMERIC(10, 2) USING (TRIM(weight)::NUMERIC(10, 2)),
    ALTER COLUMN reps TYPE NUMERIC(10, 2) USING (TRIM(reps)::NUMERIC(10, 2));
