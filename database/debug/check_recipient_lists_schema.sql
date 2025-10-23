-- Check actual schema of recipient_lists table
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'recipient_lists'
ORDER BY ordinal_position;
