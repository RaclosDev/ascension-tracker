-- Which parts of the app each user wants: training only, training + nutrition, training + body
-- tracking, or everything. NULL means everything, so existing accounts keep the app as it was.

ALTER TABLE user_settings ADD COLUMN app_modules VARCHAR(20);
