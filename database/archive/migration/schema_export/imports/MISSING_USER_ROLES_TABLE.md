# Missing user_roles Table - Analysis & Solution

**Date**: 2025-10-28
**Issue**: Functions reference `user_roles` table which doesn't exist in new database
**Status**: 🔍 Needs Decision

---

## The Problem

When running `05_ADD_FUNCTIONS.sql`, error occurs:

```
ERROR: 42P01: relation "public.user_roles" does not exist
LINE 3558: FROM public.user_roles
```

Multiple functions reference this table (20+ references found).

---

## Analysis

### 1. The Table Doesn't Exist in Migration Files

Checked both table creation files:
- ❌ Not in `01_CREATE_TABLES_PART1.sql`
- ❌ Not in `01_CREATE_TABLES_PART2.sql`
- ❌ Not in dependency analysis (`00_table_creation_order.md`)

### 2. Functions Check for Table Existence

Many functions include defensive checks:

```sql
-- From is_portal_admin function
IF NOT v_is_admin AND EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'user_roles'
) THEN
  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_portal_admin.user_id
    AND role IN ('super_admin', 'admin')
  );
END IF;
```

**This means**: Functions are designed to work with OR without the table!

### 3. Replacement Tables in New Schema

The new database uses these tables instead:

| Old System | New System |
|------------|------------|
| `user_roles` | `system_user_assignments` (for system roles) |
| `user_roles` | `organization_memberships` (for org roles) |
| `user_roles` | `portal_memberships` (for portal roles) |

This is part of the **context-aware role system** migration.

---

## Solution Options

### Option 1: Create Minimal Stub Table (Recommended ✅)

Create an empty `user_roles` table to satisfy function dependencies:

```sql
-- Create minimal stub for backwards compatibility
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Add index for function queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Optional: Create comment explaining this is legacy
COMMENT ON TABLE user_roles IS 'Legacy table for backwards compatibility. New roles use system_user_assignments, organization_memberships, and portal_memberships.';
```

**Pros**:
- ✅ Functions work immediately
- ✅ No function modifications needed
- ✅ Can be populated if needed
- ✅ Can migrate gradually

**Cons**:
- Data duplication if populated
- Extra maintenance

---

### Option 2: Modify All Functions

Update 20+ functions to remove `user_roles` references.

**Pros**:
- Cleaner architecture
- No legacy code

**Cons**:
- ❌ Time-consuming
- ❌ Risk of breaking functions
- ❌ Need to retest everything
- ❌ Functions may be auto-generated

---

### Option 3: Create Migration View

Create a view that combines the new tables:

```sql
CREATE VIEW user_roles AS
SELECT
  gen_random_uuid() as id,
  user_id,
  system_role as role,
  assigned_at as created_at,
  assigned_at as updated_at
FROM system_user_assignments
WHERE is_active = true
UNION ALL
SELECT
  gen_random_uuid() as id,
  user_id,
  org_role as role,
  joined_at as created_at,
  joined_at as updated_at
FROM organization_memberships
WHERE is_active = true
UNION ALL
SELECT
  gen_random_uuid() as id,
  user_id,
  portal_role as role,
  joined_at as created_at,
  joined_at as updated_at
FROM portal_memberships
WHERE is_active = true;
```

**Pros**:
- ✅ Functions work immediately
- ✅ Data unified from new tables
- ✅ Read-only safety

**Cons**:
- View complexity
- May need `INSTEAD OF` triggers for writes

---

## Recommended Action

**Use Option 1**: Create stub table now, decide migration strategy later.

### Step 1: Create the Table

```bash
# Create file
cat > 05a_CREATE_USER_ROLES_STUB.sql << 'EOF'
-- Create user_roles stub table for backwards compatibility
-- This satisfies function dependencies while we migrate to context-aware roles

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_roles_unique UNIQUE(user_id, role)
);

-- Indexes for function performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role);

-- Documentation
COMMENT ON TABLE user_roles IS 'Legacy compatibility table. New roles use system_user_assignments (system), organization_memberships (org), and portal_memberships (portal).';

-- Grant appropriate permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

-- Optional: Sync trigger to populate from new tables
-- (Can be added later if needed)

SELECT 'user_roles stub table created' as status;
EOF
```

### Step 2: Run It

In Supabase SQL Editor:
1. Copy `05a_CREATE_USER_ROLES_STUB.sql`
2. Run before `05_ADD_FUNCTIONS.sql`
3. Verify: `SELECT * FROM user_roles;` (should be empty)

### Step 3: Continue Migration

Now `05_ADD_FUNCTIONS.sql` should run successfully!

---

## Migration Path Forward

### Phase 1: Now (Stub Table)
- ✅ Create empty `user_roles` table
- ✅ Functions work

### Phase 2: Data Population (Optional)
If you need data in `user_roles`:

```sql
-- Copy from system_user_assignments
INSERT INTO user_roles (user_id, role)
SELECT user_id, system_role::text
FROM system_user_assignments
WHERE is_active = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy from organization_memberships (if needed)
INSERT INTO user_roles (user_id, role)
SELECT user_id, org_role::text
FROM organization_memberships
WHERE is_active = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Copy from portal_memberships (if needed)
INSERT INTO user_roles (user_id, role)
SELECT user_id, portal_role::text
FROM portal_memberships
WHERE is_active = true
ON CONFLICT (user_id, role) DO NOTHING;
```

### Phase 3: Future Cleanup (Optional)
- Replace view for unified access
- Update application code to use new tables
- Eventually deprecate `user_roles`

---

## Testing After Creation

```sql
-- Verify table exists
SELECT tablename FROM pg_tables WHERE tablename = 'user_roles';

-- Verify structure
\d user_roles

-- Test function that uses it
SELECT is_admin();

-- Test permissions query
SELECT * FROM get_user_permissions();
```

---

## Files to Create

1. **05a_CREATE_USER_ROLES_STUB.sql** - Create stub table (run BEFORE 05)
2. **05_ADD_FUNCTIONS.sql** - Run as planned (will now work)

---

## Updated Migration Order

```
✅ Step 1: Create Tables Part 1
✅ Step 2: Create Tables Part 2
✅ Step 3: Import Data
✅ Step 4: Add Foreign Keys
🆕 Step 5a: Create user_roles stub ← ADD THIS
🔧 Step 5b: Add Functions ← YOU ARE HERE
⏳ Step 6: Add Triggers
⏳ Step 7: Enable RLS
⏳ Step 8: Test & Deploy
```

---

**Recommendation**: Create `05a_CREATE_USER_ROLES_STUB.sql` and run it before continuing with `05_ADD_FUNCTIONS.sql`.

