-- Unagreed services do not ask for or record adherence scores. Existing check-ins retain their snapshot.
ALTER TABLE checkins ALTER COLUMN training_adherence DROP NOT NULL;
ALTER TABLE checkins ALTER COLUMN diet_adherence DROP NOT NULL;
