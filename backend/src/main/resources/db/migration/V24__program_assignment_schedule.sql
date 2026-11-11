ALTER TABLE program_assignments ADD COLUMN effective_until date;
ALTER TABLE program_assignments ADD CONSTRAINT ck_program_assignment_interval
    CHECK (effective_until IS NULL OR effective_until > start_date);
DROP INDEX uq_program_assignments_active_link;
CREATE UNIQUE INDEX uq_program_assignments_active_start
    ON program_assignments (coach_link_id, start_date) WHERE status = 'ACTIVE';
