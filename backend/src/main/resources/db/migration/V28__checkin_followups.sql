ALTER TABLE checkins ADD COLUMN updates jsonb NOT NULL DEFAULT '[]';
ALTER TABLE checkins ADD COLUMN submission_status varchar(16) NOT NULL DEFAULT 'FINAL'
    CHECK (submission_status IN ('PARTIAL','FINAL'));
ALTER TABLE coach_clients ADD COLUMN checkin_questions jsonb;
