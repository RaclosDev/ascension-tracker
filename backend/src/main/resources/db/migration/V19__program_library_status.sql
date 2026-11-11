ALTER TABLE programs ADD COLUMN library_status VARCHAR(8) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE programs ADD CONSTRAINT ck_programs_library_status CHECK (library_status IN ('DRAFT', 'READY'));

-- Preserve assignability of existing complete programs; incomplete templates remain drafts.
UPDATE programs p SET library_status = 'READY'
WHERE NOT p.is_library OR (
    EXISTS (SELECT 1 FROM program_days d WHERE d.program_id = p.id)
    AND NOT EXISTS (
        SELECT 1 FROM program_days d WHERE d.program_id = p.id
        AND NOT EXISTS (SELECT 1 FROM program_exercises e WHERE e.program_day_id = d.id)
    )
);
