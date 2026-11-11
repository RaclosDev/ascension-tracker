ALTER TABLE coach_profiles
    ADD COLUMN professional_name varchar(80),
    ADD COLUMN presentation varchar(500) NOT NULL DEFAULT '',
    ADD COLUMN show_account_photo boolean NOT NULL DEFAULT true,
    ADD COLUMN default_training boolean NOT NULL DEFAULT true,
    ADD COLUMN default_nutrition boolean NOT NULL DEFAULT false,
    ADD COLUMN default_progress boolean NOT NULL DEFAULT false,
    ADD COLUMN default_prefill boolean NOT NULL DEFAULT false,
    ADD COLUMN default_review_day smallint NOT NULL DEFAULT 7 CHECK (default_review_day BETWEEN 1 AND 7),
    ADD COLUMN default_review_time time NOT NULL DEFAULT '18:00',
    ADD COLUMN default_review_zone varchar(80) NOT NULL DEFAULT 'Europe/Madrid',
    ADD COLUMN settings_version integer NOT NULL DEFAULT 0,
    ADD CONSTRAINT coach_default_service_selected CHECK (default_training OR default_nutrition OR default_progress);

ALTER TABLE coach_invitations
    ADD COLUMN review_day smallint NOT NULL DEFAULT 7 CHECK (review_day BETWEEN 1 AND 7),
    ADD COLUMN review_time time NOT NULL DEFAULT '18:00',
    ADD COLUMN review_zone varchar(80) NOT NULL DEFAULT 'Europe/Madrid';

CREATE VIEW coach_public_profiles WITH (security_invoker = true) AS
SELECT u.id, COALESCE(p.professional_name, u.name) AS name, u.email,
       CASE WHEN p.show_account_photo THEN u.picture END AS picture, p.presentation
FROM users u JOIN coach_profiles p ON p.user_id = u.id;
