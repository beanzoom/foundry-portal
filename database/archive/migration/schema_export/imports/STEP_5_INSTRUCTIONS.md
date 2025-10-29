# Step 5: Add Functions - Complete Instructions

**Date**: 2025-10-28
**Status**: Ready to run (with dependency fix)

---

## ⚠️ Critical: Missing Dependency Found

The functions reference `user_roles` table which doesn't exist in the new database.

**Solution**: Create a stub table first.

---

## 📋 Run Order (MUST follow this sequence)

### Step 5a: Create user_roles Stub Table ⭐ RUN FIRST

**File**: `05a_CREATE_USER_ROLES_STUB.sql`

**What it does**:
- Creates empty `user_roles` table
- Adds indexes for performance
- Sets up RLS policies
- Provides backwards compatibility

**How to run**:
1. Open Supabase SQL Editor (NEW database)
2. Copy entire contents of `05a_CREATE_USER_ROLES_STUB.sql`
3. Paste and click **Run**
4. Wait for completion

**Expected output**:
```
✅ user_roles stub table created successfully
   - Table: Created
   - Indexes: 4 created
   - RLS: Enabled
   - Ready for 05_ADD_FUNCTIONS.sql
```

**Duration**: ~10 seconds

---

### Step 5b: Add All Functions

**File**: `05_ADD_FUNCTIONS.sql`

**What it does**:
- Creates 242 database functions
- Includes email, user management, permissions, etc.

**How to run**:
1. Keep SQL Editor open
2. Copy entire contents of `05_ADD_FUNCTIONS.sql`
3. Paste and click **Run**
4. Wait ~2-3 minutes

**Expected output**:
```
CREATE FUNCTION
CREATE FUNCTION
CREATE FUNCTION
...
(242 times)
```

**Duration**: ~2-3 minutes

---

## ✅ Verification

After both files complete:

```sql
-- 1. Verify user_roles table exists
SELECT tablename FROM pg_tables
WHERE tablename = 'user_roles';
-- Should return: user_roles

-- 2. Verify it's empty (for now)
SELECT COUNT(*) FROM user_roles;
-- Should return: 0

-- 3. Count functions created
SELECT COUNT(*) FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
-- Should return: 242+

-- 4. Test a function that uses user_roles
SELECT is_admin();
-- Should work without errors

-- 5. Test another key function
SELECT * FROM get_user_permissions() LIMIT 5;
-- Should return permissions
```

---

## 🚨 If Errors Occur

### "relation user_roles does not exist"
❌ **You skipped Step 5a!**
✅ Go back and run `05a_CREATE_USER_ROLES_STUB.sql` first

### "syntax error at or near CREATE"
❌ Missing semicolons (should be fixed)
✅ Re-download the file from the repo

### "permission denied"
❌ Not logged in as database owner
✅ Check you're using admin credentials

### Timeout in SQL Editor
❌ File too large for single execution
✅ Split `05_ADD_FUNCTIONS.sql` into batches:

```bash
split -l 2500 05_ADD_FUNCTIONS.sql func_batch_
# Run each batch separately: func_batch_aa, func_batch_ab, etc.
```

---

## 📊 What Gets Created

### user_roles Table Structure
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  role text NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  UNIQUE(user_id, role)
);
```

### 242 Functions by Category

| Category | Count | Examples |
|----------|-------|----------|
| Email/Notifications | 35 | `queue_notification`, `send_email_batch` |
| User Management | 20 | `create_new_user`, `reset_user_password` |
| Referrals | 15 | `create_referral`, `process_referral` |
| Portal Content | 25 | `save_survey_response`, `register_for_event` |
| Admin/Audit | 15 | `log_admin_activity`, `delete_portal_user` |
| Security | 20 | `is_portal_admin`, `has_fleet_permission` |
| Maintenance | 15 | `update_maintenance_record` |
| Contacts/CRM | 10 | `search_contacts`, `get_contact_analytics` |
| System/Utility | 30 | `update_updated_at_column` |
| Marketing | 10 | `create_marketing_funnel` |
| Other | 47 | Various helpers and utilities |

---

## 🔄 Migration Progress Update

```
[████████████████████░░] 82%

✅ Tables Created (40/40)
✅ Data Migrated (~600 rows)
✅ Foreign Keys Added (32/32)
🆕 user_roles Stub (pending) ← Step 5a
🔧 Functions (0/242) ← Step 5b
⏳ Triggers (0/28)
⏳ RLS Policies
⏳ Testing
⏳ Production
```

---

## 📁 Files Reference

| Order | File | Purpose | Status |
|-------|------|---------|--------|
| 1 | `01_CREATE_TABLES_PART1.sql` | Foundation tables | ✅ Done |
| 2 | `01_CREATE_TABLES_PART2.sql` | Remaining tables | ✅ Done |
| 3 | `03_COPY_DATA.sql` | Data migration | ✅ Done |
| 4 | `04_ADD_FOREIGN_KEYS.sql` | FK constraints | ✅ Done |
| **5a** | **`05a_CREATE_USER_ROLES_STUB.sql`** | **Stub table** | **🔧 Next** |
| **5b** | **`05_ADD_FUNCTIONS.sql`** | **Functions** | **⏳ After 5a** |
| 6 | `06_ADD_TRIGGERS.sql` | Triggers | ⏳ Future |

---

## 🎯 Quick Start Checklist

- [ ] 1. Open Supabase SQL Editor (NEW database)
- [ ] 2. Run `05a_CREATE_USER_ROLES_STUB.sql`
- [ ] 3. Verify success message
- [ ] 4. Run `05_ADD_FUNCTIONS.sql`
- [ ] 5. Wait for 242 "CREATE FUNCTION" messages
- [ ] 6. Run verification queries
- [ ] 7. Proceed to Step 6 (triggers)

---

## 📖 Additional Documentation

- [MISSING_USER_ROLES_TABLE.md](./MISSING_USER_ROLES_TABLE.md) - Why stub table is needed
- [FUNCTION_FIX_APPLIED.md](./FUNCTION_FIX_APPLIED.md) - Syntax fixes applied
- [CURRENT_STATUS.md](./CURRENT_STATUS.md) - Overall migration status
- [AVOIDING_CONTEXT_LIMITS.md](./AVOIDING_CONTEXT_LIMITS.md) - Working with large files

---

**Total Time**: ~3-5 minutes
**Difficulty**: Easy (copy/paste)
**Risk**: Low (can rollback functions)

**Ready to run!** 🚀

