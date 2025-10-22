# Claude Code Handoff - Foundry Portal

**Date Created:** October 21, 2025
**Repository:** `/home/joeylutes/projects/foundry-portal`
**Status:** Phase 2 Complete - Portal is standalone and functional

---

## 🎯 Project Overview

This is the **Foundry Portal** - a standalone React application for the FleetDRMS investor and member portal. It was migrated from the main FleetDRMS application (`/home/joeylutes/projects/a_fleetdrms`) to run independently.

### Key Facts:
- **Portal URL (local):** `http://portal.localhost:8082/`
- **Alternative URL:** `http://localhost:8082/portal`
- **Main App URL:** `http://localhost:8081/` (separate repository)
- **Database:** Shared Supabase database with main app
- **Deployment Target:** Vercel (NOT Lovable.dev like main app)

---

## 🚨 CRITICAL RULES

### 1. Portal-Only Code
**This repository contains ONLY portal code. DO NOT:**
- Copy anything from `/src/pages/bridge/` (doesn't exist here, app-only)
- Copy anything from `/src/features/` (removed, app-specific)
- Import from `@/features/*` paths
- Add app-specific functionality (fleet management, maintenance, driver features)

**Portal contains:**
- Investor pages and features
- Member pages and features
- Portal admin pages (under `/src/pages/portal/admin/`)
- Authentication and onboarding
- Shared UI components
- Portal-specific services and hooks

### 2. Import Paths
**CORRECT imports:**
```typescript
import { useAuth } from '@/hooks/useAuth';           // ✅ Correct
import { supabase } from '@/lib/supabase';          // ✅ Correct
import { portalRoute } from '@/lib/portal/navigation'; // ✅ Correct
```

**INCORRECT imports (will fail):**
```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';  // ❌ Wrong
import { FleetVehicle } from '@/features/fleet/types';    // ❌ Wrong
import { Demo } from '@/pages/bridge/modules/demo';       // ❌ Wrong
```

### 3. Database
- Portal shares the **SAME** Supabase database as main app
- Do NOT create separate tables/migrations
- Coordinate any schema changes with main app
- Use existing tables: `profiles`, `portal_memberships`, `portal_updates`, etc.

---

## 📁 Repository Structure

```
/home/joeylutes/projects/foundry-portal/
├── src/
│   ├── pages/
│   │   └── portal/              # ONLY portal pages
│   │       ├── admin/           # Portal admin (NOT app admin)
│   │       ├── invest/          # Investor pages
│   │       ├── solutions/       # Portal solutions showcase
│   │       ├── PortalAuth.tsx   # Portal authentication
│   │       ├── PortalDashboard.tsx
│   │       └── ...
│   ├── components/
│   │   ├── portal/              # Portal-specific components
│   │   ├── ui/                  # Shared UI library
│   │   └── auth/                # Auth components
│   ├── hooks/                   # 16 portal hooks
│   │   ├── useAuth.tsx          # Auth hook (portal version)
│   │   ├── usePortalRole.ts
│   │   ├── usePortalUpdates.ts
│   │   └── ...
│   ├── services/                # 12 portal services
│   │   ├── email.service.ts
│   │   ├── calculator.service.ts
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client
│   │   ├── logging.ts
│   │   └── portal/              # Portal-specific utilities
│   │       ├── navigation.ts    # Route helpers
│   │       ├── roles.ts         # Role checking
│   │       └── investmentConstants.ts
│   ├── contexts/
│   │   └── PortalContext.tsx    # Main portal context
│   ├── types/                   # TypeScript types
│   └── integrations/
│       └── supabase/            # Supabase integration
├── public/
│   ├── logo-transparent.png     # Company logo
│   └── logo.jpeg                # Backup logo
├── .env                         # Environment variables
├── vite.config.ts               # Simplified (no app features)
├── package.json                 # Portal dependencies
└── *.md                         # Documentation
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
VITE_SUPABASE_PROJECT_ID="kssbljbxapejckgassgf"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci..."
VITE_SUPABASE_URL="https://kssbljbxapejckgassgf.supabase.co"
VITE_PRODUCTION_PORTAL_DOMAIN="https://portal.fleetdrms.com"
VITE_FOUNDRY_REFERRAL_CODE="FOUNDRB567"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # For tests only
```

### Development Server
```bash
npm run dev  # Runs on port 8082
```

### Access URLs
- Subdomain: `http://portal.localhost:8082/`
- Path-based: `http://localhost:8082/portal`

---

## 📚 Essential Documentation

**Read these files to understand the portal:**

1. **[PHASE_2_COMPLETE.md](PHASE_2_COMPLETE.md)** - Migration summary, what was completed
2. **[CLEANUP_LOG.md](CLEANUP_LOG.md)** - What app content was removed
3. **[DEPENDENCY_RESOLUTION_LOG.md](DEPENDENCY_RESOLUTION_LOG.md)** - All dependencies that were copied
4. **[APP_IMPORTS_FIXED.md](APP_IMPORTS_FIXED.md)** - How app imports were removed
5. **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - How to deploy to Vercel

**In main app repository (`/home/joeylutes/projects/a_fleetdrms`):**
- `database/portal_migration/MIGRATION_PROGRESS.md` - Overall migration plan
- `database/portal_migration/PHASE_2_MIGRATION_SCRIPT.sh` - Original migration script

---

## 🎭 Portal Roles & Permissions

The portal supports these user roles:

### Admin Roles
- `super_admin` - Full system access
- `admin` - Portal administration
- `portal_admin` - Portal-specific admin

### User Roles
- `portal_member` - Regular portal members (pilot owners)
- `portal_investor` / `investor` - Investors with special access
- `pilotowner` - Legacy role (being phased out)

### Role Checking
```typescript
import { isAdminRole, isInvestorRole } from '@/lib/portal/roles';
import { usePortalRole } from '@/hooks/usePortalRole';

// In components
const { isAdmin, isInvestor } = usePortalRole();

// Direct checks
if (isAdminRole(user.role)) {
  // Admin functionality
}
```

---

## 🔐 Authentication

**Portal uses shared auth with main app:**
- Same Supabase Auth
- Same user accounts
- Same sessions

**Key files:**
- `src/hooks/useAuth.tsx` - Auth hook
- `src/contexts/PortalContext.tsx` - Portal user context
- `src/components/portal/PortalAuthGuard.tsx` - Route protection
- `src/pages/portal/PortalAuth.tsx` - Login/signup page

---

## 🗄️ Database Tables Used by Portal

**User & Auth:**
- `profiles` - User profiles
- `portal_memberships` - Portal role assignments
- `system_user_assignments` - System-level roles

**Portal Content:**
- `portal_updates` - Portal news/updates
- `portal_surveys` - Surveys for members
- `portal_events` - Events and registrations
- `portal_solutions` - Solutions showcase

**Portal Activity:**
- `portal_referrals` - Referral tracking
- `calculator_submissions` - Calculator results
- `contact_submissions` - Contact form submissions
- `marketing_funnels` - Marketing tracking

**Communications:**
- `email_queue` - Email queue
- `email_templates` - Email templates
- `notification_rules` - Notification rules
- `recipient_lists` - Email recipient lists

---

## 🛠️ Common Development Tasks

### Adding a New Portal Page

1. Create in `/src/pages/portal/YourPage.tsx`
2. Add route in `/src/pages/portal/PortalRoutes.tsx`
3. Use portal navigation helpers:
```typescript
import { portalRoute } from '@/lib/portal/navigation';

// In component
navigate(portalRoute('/your-page'));

// In route definition
<Route path="your-page" element={<YourPage />} />
```

### Adding a New Component

1. Create in `/src/components/portal/YourComponent.tsx`
2. Import shared UI from `@/components/ui/*`
3. Use portal context:
```typescript
import { usePortal } from '@/contexts/PortalContext';

const { portalUser, portalPermissions, isLoading } = usePortal();
```

### Adding a New Service

1. Create in `/src/services/your-service.service.ts`
2. Use Supabase client:
```typescript
import { supabase } from '@/lib/supabase';

export async function yourFunction() {
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
  return { data, error };
}
```

### Creating Database Migrations

**IMPORTANT:** Don't create migrations directly!

1. Create SQL file in `/home/joeylutes/projects/a_fleetdrms/database/migrations/`
2. User will run it manually in Supabase
3. Tell user: "I've created migration file XXX_description.sql - please run it in Supabase"

Per CLAUDE.md instructions:
```
- I ran the 28 migration manually. you can't interact with Supabase directly
  apparently - I'll run any migrations you require and return any requested
  queries you require
- when creating migration files, limit them to 2 locations:
  /database/migrations (numbered) and
  /database/debug (debugging queries/instructions)
```

---

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Port 8082
```

### Production (Vercel)
Follow guide in [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

**Key steps:**
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Configure custom domain: `portal.fleetdrms.com`
5. Deploy

---

## 🐛 Common Issues & Solutions

### Issue: Import errors for @/features/*
**Solution:** Change to correct portal import path
```typescript
// Wrong
import { useAuth } from '@/features/auth/hooks/useAuth';

// Correct
import { useAuth } from '@/hooks/useAuth';
```

### Issue: Module not found from main app
**Solution:** The file might be app-specific. Check if it's needed for portal:
- If portal-specific: Create portal version
- If app-specific: Remove or replace with portal alternative
- If shared utility: Copy to portal's `/src/lib/` or `/src/utils/`

### Issue: Database table not found
**Solution:** Portal shares main app database. The table exists in Supabase, just query it:
```typescript
const { data } = await supabase.from('table_name').select('*');
```

### Issue: Role/permission check failing
**Solution:** Use portal role helpers:
```typescript
import { isAdminRole } from '@/lib/portal/roles';
import { usePortal } from '@/contexts/PortalContext';

const { portalUser } = usePortal();
if (isAdminRole(portalUser?.role)) {
  // Admin access
}
```

---

## 🎯 Current Status

### ✅ Complete
- Portal repository setup
- All portal pages migrated (83 pages)
- All portal components migrated (78 components)
- All dependencies resolved (60+ files)
- Import paths fixed
- App-specific code removed
- Logo and assets copied
- Development server running
- Portal loads successfully

### ⏭️ Next Steps (Future Work)
- Test all portal features thoroughly
- Replace demo placeholders with portal-specific demos (optional)
- Deploy to Vercel
- Configure custom domain
- Set up monitoring and analytics

### 🚧 Known Limitations
- Demo features show placeholders (FeatureExplorer, DocViewer diagrams)
- Some portal features may need testing
- Vercel deployment not yet configured

---

## 💡 Tips for Working with Portal

1. **Always check if it's portal-specific**
   - Is this feature for investors/members? → Portal
   - Is this for fleet/maintenance/drivers? → Main app (don't add here)

2. **Use existing patterns**
   - Look at existing portal pages for examples
   - Reuse portal components and services
   - Follow established routing patterns

3. **Test with portal users**
   - Test as `portal_member`
   - Test as `investor`
   - Test as `portal_admin`

4. **Check permissions**
   - Use `usePortal()` hook
   - Check `portalPermissions` array
   - Verify role-based access

5. **Shared database**
   - Remember: same database as main app
   - Check existing data before creating
   - Coordinate schema changes

---

## 📞 Quick Reference

**Repository Paths:**
- Main app: `/home/joeylutes/projects/a_fleetdrms`
- Portal: `/home/joeylutes/projects/foundry-portal`

**URLs:**
- Portal: `http://portal.localhost:8082/`
- Main app: `http://localhost:8081/`

**Key Commands:**
```bash
npm run dev          # Start dev server (port 8082)
npm run build        # Build for production
npm run test         # Run tests
npm run test:run     # Run tests once
```

**Key Files to Reference:**
- Routes: `src/pages/portal/PortalRoutes.tsx`
- Context: `src/contexts/PortalContext.tsx`
- Auth: `src/hooks/useAuth.tsx`
- Navigation: `src/lib/portal/navigation.ts`
- Roles: `src/lib/portal/roles.ts`

---

## 🤝 Working with Main App

**When you need something from main app:**

1. **Check if it's portal-relevant**
   - Portal features: Investors, members, updates, events, surveys
   - NOT portal: Fleet, maintenance, drivers, dispatchers

2. **If you need to copy a file:**
   - Make sure it's shared/utility code
   - Copy to appropriate location in portal
   - Update any imports to portal paths

3. **For database changes:**
   - Create migration in main app repository
   - User will run it manually
   - Both apps will use updated schema

---

## 🎓 Learning Resources

**To understand the portal better:**
1. Read the user-facing portal pages to understand features
2. Check `PortalContext.tsx` for how users are managed
3. Look at `PortalRoutes.tsx` for routing structure
4. Review services in `/src/services/` for backend interactions

**Key concepts:**
- Portal is subdomain-aware (`portal.localhost` vs `localhost/portal`)
- Shares database with main app
- Independent deployment (Vercel)
- Role-based access control
- Supabase RLS for security

---

## ✨ Summary

**You are working on the PORTAL ONLY.**

This is a standalone application for FleetDRMS investors and members. It's been cleanly separated from the main app. Focus on portal features (investments, updates, events, surveys, member management) and avoid app features (fleet, maintenance, drivers).

The portal is ready for development. All dependencies are resolved, imports are fixed, and it runs successfully on port 8082.

**When in doubt:** Check the documentation files in this repository first, especially `PHASE_2_COMPLETE.md` and `CLEANUP_LOG.md`.

Good luck! 🚀
