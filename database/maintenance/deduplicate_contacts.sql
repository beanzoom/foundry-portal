-- Deduplicate contacts by keeping only the most recent record for each email
-- This happens when the same contact is created multiple times

-- First, let's see what we're dealing with
SELECT
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as all_ids
FROM contacts
WHERE is_active = true
  AND email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Now delete duplicates, keeping only the most recent one for each email
WITH ranked_contacts AS (
  SELECT
    id,
    email,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(email)
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM contacts
  WHERE is_active = true
    AND email IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id, email
  FROM ranked_contacts
  WHERE rn > 1
)
DELETE FROM contacts
WHERE id IN (SELECT id FROM duplicates_to_delete)
RETURNING id, email, created_at;

-- Show summary of what was deleted
SELECT
  'Deleted ' || COUNT(*) || ' duplicate contact records' as summary
FROM (
  SELECT 1 FROM contacts WHERE false  -- This will show 0, the actual count is in the DELETE RETURNING above
) x;

-- Verify no more duplicates
SELECT
  email,
  COUNT(*) as count
FROM contacts
WHERE is_active = true
  AND email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
