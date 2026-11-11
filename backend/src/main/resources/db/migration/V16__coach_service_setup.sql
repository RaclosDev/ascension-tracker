ALTER TABLE coach_clients ADD COLUMN coaching_setup jsonb;
ALTER TABLE coach_clients ADD COLUMN setup_updated_at timestamptz;
ALTER TABLE coach_clients ADD COLUMN setup_started_at timestamptz;
ALTER TABLE coach_invitations ADD COLUMN coaching_setup jsonb;
