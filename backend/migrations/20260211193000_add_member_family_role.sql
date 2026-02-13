-- Add family_role enum and column to member; migrate from is_head_of_family

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'family_role') THEN
        CREATE TYPE family_role AS ENUM ('HEAD', 'SPOUSE', 'MEMBER');
    END IF;
END$$;

ALTER TABLE member
ADD COLUMN IF NOT EXISTS family_role family_role;

-- Backfill family_role from legacy is_head_of_family
UPDATE member
SET family_role = CASE
    WHEN is_head_of_family = TRUE THEN 'HEAD'::family_role
    ELSE 'MEMBER'::family_role
END
WHERE family_id IS NOT NULL
  AND family_role IS NULL
  AND deleted_at IS NULL;

-- Keep family.head_of_family_id consistent where missing
UPDATE family f
SET head_of_family_id = m.id
FROM (
    SELECT DISTINCT ON (family_id) id, family_id
    FROM member
    WHERE family_id IS NOT NULL
      AND family_role = 'HEAD'
      AND deleted_at IS NULL
    ORDER BY family_id, created_at NULLS LAST, id
) m
WHERE f.id = m.family_id
  AND f.deleted_at IS NULL
  AND f.head_of_family_id IS NULL;

-- Drop dependent view before dropping column
DROP VIEW IF EXISTS v_active_members;

ALTER TABLE member
DROP COLUMN IF EXISTS is_head_of_family;

-- Recreate view with family_role instead of is_head_of_family
CREATE VIEW v_active_members AS
SELECT 
    m.id,
    m.member_code,
    m.first_name || ' ' || m.last_name AS full_name,
    m.phone_number,
    m.email,
    m.date_of_birth,
    m.gender,
    m.marital_status,
    f.family_name,
    f.family_code,
    s.scc_name,
    p.parish_name,
    m.family_role,
    m.created_at
FROM member m
LEFT JOIN family f ON m.family_id = f.id
LEFT JOIN scc s ON m.scc_id = s.id
JOIN parish p ON m.parish_id = p.id
WHERE m.deleted_at IS NULL AND m.is_active = TRUE;
