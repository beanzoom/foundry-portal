# Portal Migration Reference

> **This document provides context about how this portal repository was created and links to the full migration documentation in the main application repository.**

---

## Overview

This repository (`foundry-portal`) was created as part of a **portal separation migration** from the main Fleet DRMS application. The goal was to create a standalone portal application that shares the same Supabase database but has completely separate code.

---

## Migration Summary

**Date**: October 2025
**Status**: ✅ Phase 2 Complete - Portal repository setup finished
**Duration**: Phase 0-2 completed in ~2 days

### What Was Migrated

From `/home/joeylutes/projects/a_fleetdrms` → `/home/joeylutes/projects/foundry-portal`:

- **86 portal pages** from `src/pages/portal/`
- **80 portal components** from `src/components/portal/`
- **60+ dependencies** (services, hooks, types, contexts)
- **8 integration tests**
- **Shared UI components**
- **Company assets** (logos)

**Total**: 218+ files migrated

### What Was NOT Migrated (Intentionally)

The following were **explicitly excluded** from the portal:
- ❌ `/src/pages/bridge/` - Bridge application pages
- ❌ `/src/features/` - App-specific features (fleet, maintenance, drivers)
- ❌ `/src/components/dialog-library/` - Complex dialog system (unused by portal)
- ❌ `/src/pages/admin/` - Non-portal admin pages

**Result**: Portal contains ZERO fleet/maintenance/driver code ✅

---

## Migration Phases

### Phase 0: Pre-Migration Prep ✅ COMPLETE
**Goal**: Secure database and validate before migration

**Completed**:
- ✅ Security audit (117 vulnerable SECURITY DEFINER functions fixed)
- ✅ RLS policy validation
- ✅ Integration test suite created
- ✅ Pre-migration verification

**Duration**: 1 day

### Phase 1: Email Consolidation ❌ CANCELLED
**Original Plan**: Move email tables to portal schema
**Decision**: Keep email in `public` schema (shared infrastructure)
**Reason**: Email is used by both portal and app - simpler to keep shared

### Phase 2: Portal Project Setup ✅ COMPLETE
**Goal**: Create standalone portal repository

**Completed**:
- ✅ Repository created and configured
- ✅ Code migrated (218+ files)
- ✅ App code removed (100+ files)
- ✅ Import paths fixed (208 imports)
- ✅ Build verified (no errors)
- ✅ Documentation created (9 files)

**Duration**: 8 hours

### Phase 3-4: Data & Code Migration ⚠️ NOT NEEDED
**Reason**: Portal shares same database as main app
**Decision**: Keep shared database architecture

### Phase 5: Testing & Verification ⏳ NEXT
**Goal**: Test all portal features

**Planned**:
- ⏳ Test authentication flow
- ⏳ Test investor features
- ⏳ Test member features
- ⏳ Test portal admin features
- ⏳ Verify database connectivity
- ⏳ Run full integration test suite

### Phase 6: Production Deployment ⏳ PENDING
**Goal**: Deploy to Vercel

**Planned**:
- ⏳ Deploy to Vercel staging
- ⏳ Configure custom domain (portal.fleetdrms.com)
- ⏳ Test production build
- ⏳ Production rollout

---

## Architecture Decision

### Original Plan
- Separate Supabase database for portal
- Complete data migration
- Independent database schemas

### Final Decision
- **Shared Supabase database** (kssbljbxapejckgassgf)
- **Separate repositories** (independent code)
- **Shared tables**: profiles, email system, etc.
- **Portal tables**: portal_*, investors, members, etc.

### Why Shared Database?
1. Simpler deployment (no data migration needed)
2. Maintains data consistency
3. Shared email system stays functional
4. Easier authentication (same user base)
5. Reduced migration complexity

---

## Repository Structure

### Portal Repository (This Repo)
```
foundry-portal/
├── src/
│   ├── pages/portal/        # Portal pages only
│   ├── components/portal/   # Portal components only
│   ├── hooks/               # React hooks (including useAuth)
│   ├── services/            # API services
│   ├── contexts/            # React contexts
│   └── lib/                 # Utilities
├── docs/                    # Portal documentation
│   └── MIGRATION_REFERENCE.md  # This file
├── CLAUDE_HANDOFF.md        # Critical context for development
├── QUICK_REFERENCE.md       # One-page cheat sheet
└── README.md                # Project overview
```

### Main App Repository (Source)
```
a_fleetdrms/
├── database/
│   └── portal_migration/    # 🔗 MIGRATION DOCUMENTATION HERE
│       ├── MIGRATION_PROGRESS.md    # Detailed progress tracker
│       ├── PHASE_2_SUMMARY.md       # Phase 2 completion report
│       ├── planning/                # 20+ planning documents
│       └── scripts/                 # Migration scripts
└── src/
    ├── pages/
    │   ├── portal/          # ✅ Migrated to portal repo
    │   └── bridge/          # ❌ App-only, not migrated
    └── features/            # ❌ App-only, not migrated
```

---

## Full Migration Documentation

**All comprehensive migration documentation lives in the main app repository:**

📍 **Location**: `/home/joeylutes/projects/a_fleetdrms/database/portal_migration/`

### Key Documents

| Document | Purpose |
|----------|---------|
| **MIGRATION_PROGRESS.md** | Live progress tracker with all phase details |
| **PHASE_2_SUMMARY.md** | Complete Phase 2 summary and metrics |
| **EXECUTIVE_SUMMARY.md** | High-level migration overview |
| **planning/MASTER_ACTION_PLAN.md** | Overall migration strategy |
| **planning/PHASE_2_PORTAL_PROJECT_SETUP.md** | Phase 2 detailed plan |
| **planning/PORTAL_CODE_INVENTORY.md** | Complete code inventory |
| **planning/TABLE_CLASSIFICATION.md** | Database table classification |
| **planning/DECISION_EMAIL_IN_PUBLIC_SCHEMA.md** | Email architecture decision |

### Planning Documents (20+ files)
- Code analysis and inventory
- Database schema analysis
- Foreign key dependency mapping
- Email system reference
- Portal separation analysis
- Pre-migration checklists
- Query execution guides

---

## Database Tables

### Portal-Specific Tables
Tables that belong to the portal functionality:
- `portal_events`
- `portal_event_registrations`
- `portal_surveys`
- `portal_survey_responses`
- `portal_updates`
- `investors`
- `investor_profiles`
- `members`
- `member_profiles`
- `contact_tracking`
- `calculators`
- `calculator_submissions`

### Shared Tables
Tables used by both portal and main app:
- `profiles` - User profiles
- `email_queue` - Email queue
- `email_logs` - Email logs
- `email_templates` - Email templates
- `notification_rules` - Notification rules
- `recipient_lists` - Recipient lists
- `portal_roles` - Portal role assignments

---

## Critical Rules

These rules ensure the portal remains independent:

### 🚨 NEVER:
- Copy code from `/src/pages/bridge/` or `/src/features/`
- Import from `@/features/*` paths
- Add fleet/maintenance/driver features
- Modify main app code when working on portal

### ✅ ALWAYS:
- Keep portal code separate from app code
- Use `@/hooks/useAuth` NOT `@/features/auth/hooks/useAuth`
- Access portal at `portal.localhost:8082`
- Test changes don't break main app
- Document significant architectural changes

---

## Deployment

### Current (Main App)
- **Platform**: Lovable.dev
- **URL**: https://fleetdrms.com
- **Database**: Supabase (kssbljbxapejckgassgf)

### Portal (This Repo)
- **Platform**: Vercel
- **URL (planned)**: https://portal.fleetdrms.com
- **Database**: Same Supabase (kssbljbxapejckgassgf)
- **Local**: http://portal.localhost:8082/

---

## Migration Metrics

| Metric | Value |
|--------|-------|
| **Files Migrated** | 218+ |
| **Portal Pages** | 86 |
| **Portal Components** | 80 |
| **Dependencies** | 60+ |
| **App Files Removed** | 100+ |
| **Import Errors Fixed** | 208 |
| **Documentation Created** | 9 files |
| **Build Time** | 11.94s |
| **Bundle Size** | 2.8 MB (760 KB gzipped) |

---

## Success Criteria ✅

All Phase 2 success criteria were met:

- ✅ Portal repository created
- ✅ Code migrated successfully
- ✅ App code removed completely
- ✅ Builds without errors
- ✅ All imports resolved
- ✅ TypeScript compiles
- ✅ Development server runs
- ✅ Assets load correctly
- ✅ Vercel configured
- ✅ Documentation comprehensive

---

## Next Steps

1. **Testing** (Phase 5)
   - Test all portal features
   - Verify database connectivity
   - Run integration tests
   - Performance testing

2. **Deployment** (Phase 6)
   - Deploy to Vercel staging
   - Configure custom domain
   - Production rollout
   - Monitoring setup

---

## Related Documentation

**In This Repository**:
- [CLAUDE_HANDOFF.md](../CLAUDE_HANDOFF.md) - Critical development context
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - One-page cheat sheet
- [README.md](../README.md) - Project overview
- [SETUP.md](../SETUP.md) - Local setup guide
- [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md) - Deployment guide
- [MIGRATION_COMPLETE.md](../MIGRATION_COMPLETE.md) - Phase 2 completion

**In Main App Repository**:
- `/home/joeylutes/projects/a_fleetdrms/database/portal_migration/` - Full migration docs

---

## Questions or Issues?

**For Portal Development**:
- See [CLAUDE_HANDOFF.md](../CLAUDE_HANDOFF.md)
- See [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- Run `./verify-portal.sh` for verification

**For Migration Context**:
- See main app repo: `/home/joeylutes/projects/a_fleetdrms/database/portal_migration/`
- See [MIGRATION_PROGRESS.md](file:///home/joeylutes/projects/a_fleetdrms/database/portal_migration/MIGRATION_PROGRESS.md)

---

**Last Updated**: 2025-10-21
**Portal Version**: 1.0.0
**Migration Status**: ✅ Phase 2 Complete
