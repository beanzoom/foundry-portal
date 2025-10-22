# Foundry Portal - Setup Guide

## Phase 2: Portal Project Setup - COMPLETE ✅

**Date**: 2025-10-21
**Repository**: https://github.com/[your-org]/foundry-portal
**Local Path**: `/home/joeylutes/projects/foundry-portal`

---

## What Was Done

### 1. Code Migration ✅
- Copied 83 portal pages from a_fleetdrms
- Copied 78 portal components
- Copied 8 integration tests
- Copied shared UI components (shadcn/ui)
- Copied portal services, types, hooks, contexts
- Copied configuration files (vite, tailwind, tsconfig)

### 2. Configuration ✅
- Created `.env` with Supabase credentials (SAME database as main app)
- Updated `package.json` with portal name and version
- Created `main.tsx` entry point
- Created `App.tsx` with portal-only routing
- Created `index.html`
- Copied `PortalRoutes.tsx` routing configuration

### 3. Database Connection ✅
**IMPORTANT**: Portal connects to the SAME Supabase database as the main app

**Credentials**:
- Project ID: `kssbljbxapejckgassgf`
- URL: `https://kssbljbxapejckgassgf.supabase.co`
- Anon Key: (in `.env`)

---

## Next Steps

### Step 1: Install Dependencies
```bash
cd /home/joeylutes/projects/foundry-portal
npm install
```

### Step 2: Run Portal Locally
```bash
npm run dev
```

Portal will run on: **http://localhost:5173**

### Step 3: Test Portal
1. Navigate to http://localhost:5173
2. Portal should load without errors
3. Try logging in with your admin credentials
4. Verify portal pages load correctly

### Step 4: Run Integration Tests
```bash
npm run test:run
```

Expected: 71 tests passing (56 email + 15 portal)

---

## Portal Structure

```
foundry-portal/
├── src/
│   ├── pages/
│   │   └── portal/          # All portal pages (83 files)
│   │       ├── PortalRoutes.tsx
│   │       ├── admin/       # Admin pages
│   │       ├── invest/      # Investment pages
│   │       └── solutions/   # Solutions pages
│   ├── components/
│   │   ├── portal/          # Portal components (78 files)
│   │   └── ui/              # Shared UI components
│   ├── services/            # Portal services
│   ├── types/               # Portal types
│   ├── hooks/               # React hooks
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utilities
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── tests/
│   └── integration/         # Integration tests
├── .env                     # Environment variables
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

---

## Architecture

### Shared Database
- Portal and main app connect to SAME Supabase database
- Portal tables: `portal_events`, `portal_updates`, `portal_surveys`, etc.
- Email tables: Shared between portal and app (in public schema)
- RLS policies enforce data separation

### Portal Independence
- ✅ Portal has ZERO dependencies on app code
- ✅ App has ZERO dependencies on portal code
- ✅ Both depend on shared email infrastructure
- ✅ Separate repositories, separate deployments

### Email System
- Email tables remain in public schema (shared)
- Portal and app both use same email infrastructure
- Immediate email sending via Migration 119 (pg_net)
- 71 integration tests ensure email reliability

---

## Troubleshooting

### Issue: Dependencies fail to install
**Solution**: Ensure you're using Node.js v18+ and npm v9+
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### Issue: Portal fails to start
**Solution**: Check `.env` file exists and has correct Supabase credentials

### Issue: Database connection errors
**Solution**: Verify Supabase project is running and credentials are correct

### Issue: Import errors
**Solution**: Check `tsconfig.json` has correct path aliases:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Migration Status

**Phase 0**: ✅ COMPLETE (Security, Tests, Validation)
**Phase 1**: ❌ CANCELLED (Email stays in public schema)
**Phase 2**: ✅ COMPLETE (Portal repository setup)
**Phase 3**: ⏳ PENDING (Data migration - not needed yet)
**Phase 4**: ⏳ PENDING (Code separation refinement)
**Phase 5**: ⏳ PENDING (Testing & verification)
**Phase 6**: ⏳ PENDING (Production deployment)

---

## Important Files

**Documentation**:
- [MIGRATION_PROGRESS.md](../a_fleetdrms/database/portal_migration/MIGRATION_PROGRESS.md)
- [EMAIL_NOTIFICATION_STATUS.md](../a_fleetdrms/docs/EMAIL_NOTIFICATION_STATUS.md)
- [PHASE_2_PORTAL_PROJECT_SETUP.md](../a_fleetdrms/database/portal_migration/planning/PHASE_2_PORTAL_PROJECT_SETUP.md)

**Key Files**:
- `.env` - Environment configuration
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main app component
- `src/pages/portal/PortalRoutes.tsx` - Routing configuration

---

## Support

- Main app repository: `/home/joeylutes/projects/a_fleetdrms`
- Portal repository: `/home/joeylutes/projects/foundry-portal`
- VS Code: Use separate windows for each repository
- Database: Shared Supabase project (kssbljbxapejckgassgf)

---

**Ready to proceed!** Run `npm install` then `npm run dev` to start the portal locally.
