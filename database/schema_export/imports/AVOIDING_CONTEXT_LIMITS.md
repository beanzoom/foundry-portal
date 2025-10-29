# Avoiding "Prompt Too Long" Errors in Claude

**Problem**: When you select large files (like `05_ADD_FUNCTIONS.sql` with 11,676 lines), every message includes the full file content, quickly exhausting Claude's context window.

---

## Quick Fixes

### 1. **Deselect the File** ✅ BEST
- Click somewhere else in your editor
- The selection won't be sent to Claude anymore
- Context usage drops dramatically

### 2. **Use File Paths Instead of Selections**
Instead of selecting the file, just reference it:
```
"Check line 1128 of 05_ADD_FUNCTIONS.sql"
```
Claude will read only what's needed.

### 3. **Split Large Files** (For Future)
If you need to edit large SQL files:
```bash
# Split into manageable chunks
split -l 2500 05_ADD_FUNCTIONS.sql func_batch_

# Results in:
# func_batch_aa (lines 1-2500)
# func_batch_ab (lines 2501-5000)
# func_batch_ac (lines 5001-7500)
# func_batch_ad (lines 7501-10000)
# func_batch_ae (lines 10001-end)
```

Then work with one chunk at a time.

---

## Why This Happens

Claude's context window:
- **Total capacity**: ~200,000 tokens
- **Your 11,676-line file**: ~100,000+ tokens
- **After 1-2 messages**: Context exhausted

Every message includes:
1. System instructions (~5,000 tokens)
2. IDE selection (your 11,676 lines)
3. Conversation history
4. Claude's responses

This adds up fast!

---

## Best Practices

### For Large SQL Files

**DON'T**:
- ❌ Select entire file in editor
- ❌ Paste entire file in messages
- ❌ Ask Claude to "review this file" with full selection

**DO**:
- ✅ Reference specific line numbers
- ✅ Show only problem areas (10-50 lines)
- ✅ Use `sed -n 'START,ENDp'` to show snippets
- ✅ Split large files into batches

### Example: Good vs Bad Requests

**Bad** (Exhausts context):
```
[Selects all 11,676 lines]
"Fix any issues in this file"
```

**Good** (Efficient):
```
"There's a syntax error at line 1128 in 05_ADD_FUNCTIONS.sql.
Can you check that specific function?"
```

---

## For This Migration

You're currently on **Step 5: Add Functions** (`05_ADD_FUNCTIONS.sql`).

### What to do now:

1. **Deselect the file in your editor** ✅
2. Run the fixed `05_ADD_FUNCTIONS.sql` in Supabase SQL Editor
3. If you get errors, just tell Claude:
   - The error message
   - Line number
   - Function name (if shown)

Claude will read only what's needed to fix it.

---

## Quick Commands for Working with Large Files

### Show specific line range:
```bash
sed -n '1120,1135p' file.sql
```

### Search for pattern and show context:
```bash
grep -n -A 5 -B 5 "pattern" file.sql
```

### Count lines:
```bash
wc -l file.sql
```

### Show function boundaries:
```bash
grep -n "^-- Function" file.sql
```

---

## File Size Guidelines

| Size | Approach |
|------|----------|
| < 500 lines | Safe to select/paste |
| 500-2000 lines | Select only problem areas |
| 2000-5000 lines | Reference by line number |
| 5000+ lines | Never select; always use snippets |

---

## Current Migration Context Usage

Approximate token usage when you selected the 11,676-line file:

```
System instructions:       ~5,000 tokens
Selected file content:   ~100,000 tokens
Conversation history:     ~10,000 tokens
File metadata:             ~1,000 tokens
───────────────────────────────────────
Total per message:       ~116,000 tokens
Available for Claude:     ~84,000 tokens
```

After 1-2 back-and-forth messages: **Context exhausted!**

---

## Solution Applied

✅ **Fixed the syntax error** in `05_ADD_FUNCTIONS.sql`
- Added semicolons to 3 indented `$function$` delimiters
- File is now ready to run

✅ **Now deselect the file** to continue working efficiently

---

*Remember*: Claude can read files on demand. You don't need to select them!

