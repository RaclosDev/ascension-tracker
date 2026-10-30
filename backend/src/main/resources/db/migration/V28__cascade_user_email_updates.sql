-- V28: Let a user's email change propagate to every table that references users(email).
--
-- Rows are linked to their owner by email. Until now the foreign keys only defined ON DELETE,
-- so updating users.email was impossible and a Google account whose email changed was locked
-- out. Every foreign key that points at users(email) is recreated with ON UPDATE CASCADE,
-- keeping its existing ON DELETE behaviour and name.
DO $$
DECLARE
    fk RECORD;
BEGIN
    FOR fk IN
        SELECT c.conname,
               c.conrelid::regclass AS table_name,
               pg_get_constraintdef(c.oid) AS definition
        FROM pg_constraint c
        WHERE c.contype = 'f'
          AND c.confrelid = 'users'::regclass
          AND c.confupdtype <> 'c'
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.conname);
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s ON UPDATE CASCADE',
                       fk.table_name, fk.conname, fk.definition);
    END LOOP;
END $$;
