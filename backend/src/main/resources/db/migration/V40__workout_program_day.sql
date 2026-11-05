-- A workout can record which prescribed program day it carried out, and whether the client
-- followed it as written or changed it. Both NULL means a workout of the client's own.
-- Deleting the program (or the day) keeps the workout and drops the link.

ALTER TABLE workouts ADD COLUMN program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL;
ALTER TABLE workouts ADD COLUMN program_origin VARCHAR(24);
ALTER TABLE workouts ADD CONSTRAINT ck_workouts_program_origin
    CHECK (program_origin IS NULL OR program_origin IN ('PRESCRIBED', 'PRESCRIBED_MODIFIED'));

CREATE INDEX idx_workouts_program_day ON workouts (program_day_id) WHERE program_day_id IS NOT NULL;
