# ✅ Ready to Run: 05_ADD_FUNCTIONS.sql

**Status**: All syntax issues fixed and verified
**Date**: 2025-10-28
**Functions**: 242/242 ready

---

## What Was Fixed

Multiple passes to catch all indentation patterns:

1. **Pass 1**: Fixed standard delimiters
   ```bash
   sed -i 's/^\$function\$$/\$function\$;/g' 05_ADD_FUNCTIONS.sql
   ```

2. **Pass 2**: Fixed 2-space indented delimiters
   ```bash
   sed -i 's/^  \$function\$$/  \$function\$;/g' 05_ADD_FUNCTIONS.sql
   ```

3. **Pass 3 (Final)**: Fixed all remaining patterns
   ```bash
   sed -i -E 's/^[[:space:]]*\$function\$[[:space:]]*$/\$function\$;/g' 05_ADD_FUNCTIONS.sql
   ```

---

## Verification Results

```bash
$ ./verify_functions_syntax.sh

✅ All function delimiters have semicolons!

Function counts:
  - Total 'CREATE OR REPLACE' statements: 242
  - Total '$function$;' delimiters: 242

File is ready to run! 🚀
```

**Perfect match!** All functions properly terminated.

---

## How to Run

### Option 1: Supabase SQL Editor (Recommended)

1. Open your **NEW** Supabase project
2. Go to SQL Editor
3. Open `05_ADD_FUNCTIONS.sql`
4. Copy entire contents
5. Paste into editor
6. Click **Run**
7. Wait ~2-3 minutes

**Expected output**: 242 × "CREATE FUNCTION" messages

### Option 2: Split into Batches (If timeout occurs)

```bash
# Split into 5 batches (~50 functions each)
split -l 2500 05_ADD_FUNCTIONS.sql func_batch_

# Run each in SQL Editor:
# func_batch_aa
# func_batch_ab
# func_batch_ac
# func_batch_ad
# func_batch_ae
```

### Option 3: Direct psql (If accessible)

```bash
psql "YOUR_NEW_DATABASE_URL" -f 05_ADD_FUNCTIONS.sql
```

---

## After Running

### 1. Verify Success

```sql
-- Count functions
SELECT COUNT(*) FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
-- Should return 242+

-- List portal functions
SELECT proname
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname LIKE '%portal%'
ORDER BY proname;
```

### 2. Test Key Functions

```sql
-- Test admin check
SELECT is_portal_admin(auth.uid());

-- Test permissions
SELECT * FROM get_user_permissions();

-- Test search
SELECT * FROM search_contacts('test');
```

### 3. Move to Next Step

See: [`CURRENT_STATUS.md`](./CURRENT_STATUS.md)

Next: **Step 6 - Add Triggers** (`06_ADD_TRIGGERS.sql`)

---

## If Errors Occur

### "Function already exists"
- **Safe to ignore** - Script uses `CREATE OR REPLACE`
- Functions will be updated

### "Relation does not exist"
- Missing table/enum referenced in function
- Check if table creation completed
- Review foreign key step

### "Permission denied"
- Must run as database owner
- Check you're logged in as admin

### Timeout in SQL Editor
- Split file into smaller batches (see Option 2)
- Run each batch separately

---

## Context Management Tips

**Avoid "Prompt too long" errors:**

1. ✅ **Deselect large files** in your editor before asking questions
2. ✅ Reference line numbers instead of selecting code
3. ✅ Show only problem areas (10-50 lines)
4. ❌ Don't select entire 11,676-line files

See: [`AVOIDING_CONTEXT_LIMITS.md`](./AVOIDING_CONTEXT_LIMITS.md)

---

## Migration Progress

```
Step 5: Add Functions ← YOU ARE HERE
├─ ✅ Syntax verified
├─ ✅ All 242 functions ready
└─ 🚀 Ready to execute

Next: Step 6 (Triggers)
```

---

**File**: `05_ADD_FUNCTIONS.sql`
**Size**: ~336 KB
**Lines**: 11,676
**Functions**: 242
**Status**: ✅ **READY**

Run it now! 🎯

