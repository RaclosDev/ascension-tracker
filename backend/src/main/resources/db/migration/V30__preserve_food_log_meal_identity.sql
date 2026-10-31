ALTER TABLE meals ADD COLUMN meal_key VARCHAR(36) DEFAULT gen_random_uuid()::text;
CREATE UNIQUE INDEX uq_meals_user_key ON meals(user_email, meal_key);
ALTER TABLE food_logs ADD COLUMN meal_key VARCHAR(36);
ALTER TABLE food_logs ADD COLUMN meal_name VARCHAR(100);
ALTER TABLE food_logs ADD COLUMN meal_icon VARCHAR(50);

-- Only the currently visible mapping is recoverable from legacy positional logs.
WITH indexed_meals AS (
    SELECT user_email, meal_key, name, icon,
           ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY sort_order, id) - 1 AS position
    FROM meals
)
UPDATE food_logs AS logs
SET meal_key = meal.meal_key, meal_name = meal.name, meal_icon = meal.icon
FROM indexed_meals AS meal
WHERE logs.user_email = meal.user_email AND logs.meal_index = meal.position;

-- Preserve an orphan's identity without assigning it to a newly created meal.
UPDATE food_logs SET meal_key = md5(user_email || ':legacy-meal:' || meal_index)::uuid::text,
    meal_name = 'Comida histórica', meal_icon = '🍽️'
WHERE meal_key IS NULL;
