-- A client can let a coach prescribe training (on top of seeing it). Assigning a library
-- program copies it to the client (programs.is_library = FALSE, owned by the client), so the
-- client keeps it if the coach edits or deletes the original, or the link ends.

ALTER TABLE coach_clients ADD COLUMN can_edit_training BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE coach_clients ADD CONSTRAINT ck_coach_clients_edit_needs_view
    CHECK (NOT can_edit_training OR can_view_training);

CREATE TABLE program_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The client's own copy; deleting it (or the client's account) removes the assignment.
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    client_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    coach_user_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    coach_link_id UUID REFERENCES coach_clients(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_program_assignments_program UNIQUE (program_id),
    CONSTRAINT ck_program_assignments_status CHECK (status IN ('ACTIVE', 'ENDED')),
    CONSTRAINT ck_program_assignments_ended_at CHECK ((status = 'ENDED') = (ended_at IS NOT NULL))
);

-- One active program per coach link: assigning a new one ends the previous.
CREATE UNIQUE INDEX uq_program_assignments_active_link
    ON program_assignments (coach_link_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_program_assignments_client ON program_assignments (client_user_id, status);
CREATE INDEX idx_program_assignments_coach ON program_assignments (coach_user_id);

ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;
