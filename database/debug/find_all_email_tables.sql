-- Find ALL email-related tables to see if there are multiple queues

SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename LIKE '%email%'
   OR tablename LIKE '%mail%'
ORDER BY schemaname, tablename;

-- Also check portal schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'portal'
ORDER BY tablename;
