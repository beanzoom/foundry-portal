# Foundry Portal - Quick Reference Card

> **⚡ Quick commands and critical info for portal development**

---

## 🚀 Quick Start

```bash
# Navigate to portal
cd /home/joeylutes/projects/foundry-portal

# Start dev server
npm run dev

# Access portal
open http://portal.localhost:8082/
```

---

## 📍 Key URLs

| Environment | URL |
|-------------|-----|
| **Local Dev** | http://portal.localhost:8082/ |
| **Alternative** | http://localhost:8082/portal |
| **Production** | https://portal.fleetdrms.com |

---

## 🔧 Common Commands

```bash
# Development
npm run dev                  # Start dev server (port 8082)
npm run build                # Build for production
npm run preview              # Preview production build

# Testing
npm run test                 # Run tests in watch mode
npm run test:run             # Run tests once
npm run test:coverage        # Generate coverage report

# Linting & Type Checking
npm run lint                 # Run ESLint
npx tsc --noEmit             # Type check

# Verification
./verify-portal.sh           # Run verification script
```

---

## 📂 Key Directories

```
src/
├── pages/portal/           # Portal pages (86 files)
├── components/portal/      # Portal components (80 files)
├── hooks/                  # React hooks
│   └── useAuth.tsx         # ⚠️ Use this, NOT @/features/auth
├── services/               # API services
├── contexts/               # React contexts
│   └── PortalContext.tsx   # Main portal context
├── types/                  # TypeScript types
└── lib/                    # Utilities
```

---

## 🚨 Critical Rules

### ❌ NEVER:
- Copy from `/src/pages/bridge/` (doesn't exist in portal)
- Copy from `/src/features/` (removed, app-specific)
- Import from `@/features/*` paths
- Add fleet/maintenance/driver features

### ✅ ALWAYS:
- Use `@/hooks/useAuth` NOT `@/features/auth/hooks/useAuth`
- Keep portal code separate from app code
- Access at `portal.localhost:8082`
- Run `./verify-portal.sh` before commits

---

## 🔐 Environment Variables

Required in `.env`:
```env
VITE_SUPABASE_URL=https://kssbljbxapejckgassgf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=kssbljbxapejckgassgf
VITE_PRODUCTION_PORTAL_DOMAIN=https://portal.fleetdrms.com
```

---

## 🗄️ Database

| Config | Value |
|--------|-------|
| **Project** | kssbljbxapejckgassgf |
| **URL** | https://kssbljbxapejckgassgf.supabase.co |
| **Schema** | Shared with main app |

**Portal Tables**: `portal_*` (events, surveys, updates, etc.)
**Shared Tables**: `email_*`, `profiles`, etc.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **CLAUDE_HANDOFF.md** | 🚨 READ THIS FIRST - Critical context |
| **README.md** | Project overview |
| **SETUP.md** | Local development setup |
| **VERCEL_DEPLOYMENT.md** | Deployment guide |
| **MIGRATION_COMPLETE.md** | Migration completion report |
| **verify-portal.sh** | Verification script |

---

## 🔍 Import Patterns

### ✅ Correct:
```typescript
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { usePortal } from '@/contexts/PortalContext';
import { Button } from '@/components/ui/button';
```

### ❌ Incorrect:
```typescript
import { useAuth } from '@/features/auth/hooks/useAuth';  // ❌ Wrong!
import { FleetCard } from '@/features/fleet/...';         // ❌ Wrong!
import { DemoSlide } from '@/pages/bridge/...';           // ❌ Wrong!
```

---

## 👥 Portal Roles

| Role | Access Level |
|------|--------------|
| **superadmin** | Full admin access |
| **admin** | Admin access |
| **investor** | Investor features + analytics |
| **portal_admin** | Portal admin |
| **portal_member** | Member features |
| **pilotowner** | Member features |

---

## 🧪 Testing

```bash
# Run all tests
npm run test:run

# Run specific test file
npm run test -- UserService.test.ts

# Watch mode
npm run test

# Coverage
npm run test:coverage
```

---

## 🚀 Deployment (Vercel)

```bash
# Install Vercel CLI (if needed)
npm i -g vercel

# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

**Docs**: See `VERCEL_DEPLOYMENT.md` for full guide

---

## 🐛 Troubleshooting

### Port already in use?
```bash
# Find process on port 8082
lsof -ti:8082

# Kill process
kill -9 $(lsof -ti:8082)
```

### Import errors?
```bash
# Verify all imports
./verify-portal.sh

# Check specific import
grep -r "import.*from.*@/features" src
```

### Build errors?
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Portal Features

### What Portal Contains:
- ✅ Investor dashboard
- ✅ Member portal
- ✅ Portal admin interface
- ✅ Surveys, events, updates
- ✅ Contact tracking
- ✅ Calculators
- ✅ Solutions showcase

### What Portal Does NOT Contain:
- ❌ Fleet management
- ❌ Maintenance tracking
- ❌ Driver center
- ❌ Bridge application

---

## 🔗 Quick Links

| Resource | Location |
|----------|----------|
| **Portal Repo** | `/home/joeylutes/projects/foundry-portal` |
| **Main App Repo** | `/home/joeylutes/projects/a_fleetdrms` |
| **Migration Docs** | `../a_fleetdrms/database/portal_migration/` |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/kssbljbxapejckgassgf |

---

## 💡 Tips

1. **New Claude Session?** → Read `CLAUDE_HANDOFF.md` first
2. **Before Committing?** → Run `./verify-portal.sh`
3. **Adding Features?** → Verify it's portal-specific
4. **Import Errors?** → Check for `@/features` imports
5. **Testing Locally?** → Use `portal.localhost:8082`

---

## 📞 Help

**Having issues?** Check:
1. `CLAUDE_HANDOFF.md` - Critical rules and context
2. `README.md` - Project overview
3. `SETUP.md` - Setup instructions
4. `./verify-portal.sh` - Run verification

---

**Last Updated**: 2025-10-21
**Portal Version**: 1.0.0
**Status**: 🟢 Ready for Development
