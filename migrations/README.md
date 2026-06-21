# Database Migration Guide

**CRITICAL:** Follow this exact order. Do not skip steps.

---

## Pre-Migration Checklist

- [ ] **Backup your database** via Supabase dashboard (Settings → Database → Backups)
- [ ] Verify you can restore from backup
- [ ] Have Supabase SQL Editor open
- [ ] Have your app running locally for testing
- [ ] Can roll back if something breaks

---

## Migration Order

### Step 1: RLS Policies (CRITICAL - Do First)

**File:** `001_rls_policies.sql`  
**Risk:** HIGH if misconfigured  
**Time:** 2 minutes to run, 30 minutes to test

**What it does:**
- Enables Row Level Security on 9 core tables
- Adds full CRUD policies (SELECT, INSERT, UPDATE, DELETE)
- Prevents unauthorized data access

**How to run:**
1. Copy entire contents of `001_rls_policies.sql`
2. Paste into Supabase SQL Editor
3. Run it
4. **DO NOT PROCEED** until you complete testing

**Testing checklist:**
```
□ Log in as a user
□ Create a new chat - works?
□ View chat list - works?
□ Send messages - works?
□ Update chat title - works?
□ Archive/unarchive chat - works?
□ Create artifacts (BOM, wiring) - works?
□ Create projects - works?
□ Diagram generation - works?
□ Search component templates - works?
□ Open app as different user - cannot see other user's data?
□ Try to modify other user's chat via API - blocked?
```

**If ANY test fails:**
- Run the rollback section at the bottom of `001_rls_policies.sql`
- Debug the issue
- Do NOT proceed to Step 2

---

### Step 2: Drop Dead Tables

**File:** `002_drop_dead_tables.sql`  
**Risk:** LOW (all tables have 0 rows)  
**Time:** 1 minute

**What it does:**
- Removes 11 completely unused tables with 0 rows
- All tables have 0 code references
- Drops: profiles, user_quotas, artifact_sections, artifact_dependencies
- Drops: budget_snapshots, attachments, message_feedback
- Drops: agent_executions, error_logs, circuit_verifications, datasheet_analyses

**Pre-flight check:**

```sql
-- Run this first - ALL counts must be 0
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL SELECT 'user_quotas', COUNT(*) FROM user_quotas
UNION ALL SELECT 'artifact_sections', COUNT(*) FROM artifact_sections
UNION ALL SELECT 'artifact_dependencies', COUNT(*) FROM artifact_dependencies
UNION ALL SELECT 'budget_snapshots', COUNT(*) FROM budget_snapshots
UNION ALL SELECT 'attachments', COUNT(*) FROM attachments
UNION ALL SELECT 'message_feedback', COUNT(*) FROM message_feedback
UNION ALL SELECT 'agent_executions', COUNT(*) FROM agent_executions
UNION ALL SELECT 'error_logs', COUNT(*) FROM error_logs
UNION ALL SELECT 'circuit_verifications', COUNT(*) FROM circuit_verifications
UNION ALL SELECT 'datasheet_analyses', COUNT(*) FROM datasheet_analyses;
```

**If ANY table has rows > 0:** STOP and investigate before running migration.

**How to run:**
1. Run pre-flight check above
2. Verify all counts = 0
3. Copy contents of `002_drop_dead_tables.sql`
4. Run in Supabase SQL Editor

**Verification:**
Your app should still work exactly the same. These tables were never used.

---

### Step 3: Investigate approval_gates

**File:** `003_investigate_approval_gates.sql`  
**Risk:** None (investigation only)  
**Time:** 5 minutes

**What it does:**
- Checks if approval_gates table is actually used
- Only table with RLS already enabled (suspicious!)
- Queries row count, foreign keys, and policies

**How to run:**
1. Run queries in `003_investigate_approval_gates.sql`
2. Check results:
   - If `row_count > 0` → Table is in use, KEEP it
   - If `row_count = 0` → Check git history for "approval" or "gate"
3. Make decision based on findings

**Decision:**
- If in active use: Keep the table, skip to Step 4
- If not used: Uncomment the DROP statement at bottom of file and run

---

### Step 4: parts & connections Decision

**File:** `004_parts_connections_decision.sql`  
**Risk:** MEDIUM - makes architectural choice  
**Time:** 10 minutes to decide

**⚠️ CRITICAL: DROP statements are now commented out by default**

**The Decision:**
- **Option A (JSON-only)**: Drop parts + connections, stick with JSON storage
- **Option B (Relational)**: Keep tables, write sync logic, migrate data

**How to decide:**
```
Do you need to query parts across projects?
  e.g., "Show all projects using ESP32"
  e.g., "Total cost of all DHT22 sensors"
  
YES → Choose Option B (keep tables)
NO  → Choose Option A (drop tables)
```

**For most MVPs:** Choose Option A

**How to run:**
1. Open `004_parts_connections_decision.sql`
2. Read both options
3. **If choosing Option A:** Uncomment DROP statements and run
4. **If choosing Option B:** Follow Option B instructions in file

---

### Step 5: Cleanup Unused Columns

**File:** `005_cleanup_columns.sql`  
**Risk:** LOW  
**Time:** 5 minutes

**⚠️ STOP: Check intent column first**

```sql
SELECT DISTINCT intent, COUNT(*) 
FROM messages 
GROUP BY intent;
```

**Expected:** Only 'FALLBACK'  
**If other values exist:** Intent routing may be working - investigate!

**What it does:**
- Drops unused columns: agent_model, created_artifact_ids
- Conditionally drops intent (commented out - verify first)
- Adds chats.updated_at (was missing)

---

### Step 6: Add Performance Indexes

**File:** `006_add_indexes.sql`  
**Risk:** NONE  
**Time:** 2 minutes

**What it does:**
- Indexes for chat list, messages, artifacts
- Full-text search, diagram queue
- Safe to run anytime

---

### Step 7: Seed Component Templates

**File:** `007_seed_component_templates.sql`  
**Risk:** LOW  
**Time:** 1 minute

**⚠️ Run AFTER Step 4** (parts decision made)

**What it does:**
- Seeds 14 common components (ESP32, Arduino, DHT22, etc.)
- Fixes silent getPinout() failures

---

## Backend Auth Check (BEFORE Step 1!)

```typescript
// Check your API routes - using service role or anon key?

// ✅ SAFE: Service role (RLS bypassed)
const supabase = createClient(url, serviceRoleKey)

// ⚠️ CHECK: Anon key + JWT (RLS applies)
const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${jwt}` } }
})
```

If using anon key: Ensure `auth.uid()` matches chat owner for all writes.

---

## Summary

**Order:** 001 → test → 002 → 003 → 004 → 005 → 006 → 007  
**Total time:** 1-2 hours with testing  
**Risk:** Medium (RLS can break if auth misconfigured)  
**Reward:** Secure DB, 55% less cruft, better performance
