DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_default LIKE 'nextval%' AND table_schema = 'public'
    ) LOOP
        EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, %L), coalesce(max(%I),0) + 1, false) FROM %I', 
                       rec.table_name, rec.column_name, rec.column_name, rec.table_name);
    END LOOP;
END $$;
