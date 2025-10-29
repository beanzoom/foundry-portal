# Foundry Landing Page Migration - Context Document

**Date**: 2025-10-29
**Status**: ✅ COMPLETE - Foundry page successfully migrated to foundry-portal
**Commit**: 1a2b5a3

---

## What Happened

The **Foundry landing page** was migrated from the `a_fleetdrms` repository to this `foundry-portal` repository because it is part of the **portal marketing funnel**, not the FleetDRMS app.

---

## Why This Migration Was Needed

### The Problem

The Foundry landing page was originally located in the **FleetDRMS app** repository:
- Location: `a_fleetdrms/src/pages/public/FoundryLanding.tsx`
- Route: `/foundry`
- Purpose: Market the DSP Foundry Portal to potential members

**This was incorrect** because:
1. The Foundry page is **portal marketing content**, not FleetDRMS app functionality
2. It directs visitors to **portal registration** with the `FOUNDRY` referral code
3. It's part of the **portal user acquisition funnel**
4. During "Phase 7A" (portal code removal from FleetDRMS), it would have been deleted

### The Solution

The Foundry page needed to move to the **foundry-portal** repository where it belongs, alongside:
- Portal authentication (`/auth`)
- Portal registration (`/register`)
- Portal onboarding (`/onboarding`)
- Portal dashboard, events, surveys, referrals, etc.

---

## What Was Migrated

### Files Added to foundry-portal

1. **`src/pages/public/FoundryLanding.tsx`** (397 lines)
   - Full Foundry DSP landing page with mission, vision, benefits
   - Marketing content for invite-only DSP community
   - Call-to-action button that directs to portal auth with `FOUNDRY` referral code

2. **`src/components/public/PublicLayout.tsx`** (31 lines)
   - Simple public page layout (header-less, with footer)
   - Used by Foundry landing page
   - Provides consistent public page styling

3. **Route: `/foundry`** (added to `src/pages/portal/PortalRoutes.tsx`)
   - Public route (no authentication required)
   - Renders `FoundryLanding` component

---

## Key Changes Made During Migration

### Change 1: Simplified Navigation

**Before** (in FleetDRMS - cross-domain routing):
```typescript
const handleJoinFoundry = () => {
  // Determine portal URL based on environment
  const currentPort = window.location.port;
  let portalUrl = '';

  if (import.meta.env.DEV) {
    // Development: use localhost
    portalUrl = `http://portal.localhost${currentPort ? ':' + currentPort : ':8081'}`;
  } else {
    // Production: use environment variable or default
    portalUrl = import.meta.env.VITE_PRODUCTION_PORTAL_DOMAIN || 'https://portal.fleetdrms.com';
  }

  // Navigate to portal auth (cross-domain)
  window.location.href = `${portalUrl}/auth?ref=FOUNDRY`;
};
```

**After** (in foundry-portal - internal routing):
```typescript
const handleJoinFoundry = () => {
  // Capture campaign parameter from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const campaign = urlParams.get('campaign');

  // Navigate to portal auth with referral code (internal)
  let authUrl = `/auth?ref=FOUNDRY`;
  if (campaign) {
    authUrl += `&campaign=${encodeURIComponent(campaign)}`;
  }

  // Use React Router navigation since we're in the portal app
  navigate(authUrl);
};
```

**Benefits**:
- ✅ No environment variables needed
- ✅ No cross-domain navigation (faster, better UX)
- ✅ Uses React Router (standard SPA navigation)
- ✅ Simpler, cleaner code

### Change 2: Import Paths

All imports updated to use foundry-portal's structure:
```typescript
import { PublicLayout } from '@/components/public/PublicLayout';  // ✅ Now exists in foundry-portal
import { Card } from '@/components/ui/card';                      // ✅ Already in foundry-portal
import { Button } from '@/components/ui/button';                  // ✅ Already in foundry-portal
import { Badge } from '@/components/ui/badge';                    // ✅ Already in foundry-portal
import { useNavigate } from 'react-router-dom';                   // ✅ Standard React Router
```

### Change 3: Route Configuration

Added to `src/pages/portal/PortalRoutes.tsx`:
```typescript
import { FoundryLanding } from '@/pages/public/FoundryLanding';

// Inside Routes component:
<Route path="/foundry" element={<FoundryLanding />} />
```

**Placement**: Added near other public routes (`/auth`, `/register`, `/terms`)

---

## How It Works Now

### User Journey

1. **User visits**: `foundry.fleetdrms.com` (or `portal.fleetdrms.com/foundry`)
2. **Page loads**: Foundry landing page with DSP Foundry marketing content
3. **User clicks**: "Join the Foundry" button
4. **Navigation**: Internal route to `/auth?ref=FOUNDRY` (same app, no page reload)
5. **Portal Auth**: User sees registration/login page with FOUNDRY referral code pre-filled
6. **Onboarding**: After registration, user is onboarded as a Foundry member

### Referral Code Flow

The `FOUNDRY` referral code is special:
- **Purpose**: Identifies users who joined through the Foundry landing page
- **Usage**: Tracked in `portal_referrals` table
- **Benefit**: Helps measure effectiveness of Foundry marketing campaign

---

## DNS Configuration (Future)

Currently, `foundry.fleetdrms.com` points to the FleetDRMS app (old location).

**After Phase 7A** (when Foundry is removed from FleetDRMS):
```
DNS Configuration:
Type: CNAME
Name: foundry
Value: cname.vercel-dns.com  (or portal's Vercel deployment URL)

Result: foundry.fleetdrms.com → portal.fleetdrms.com/foundry
```

**Alternative approach** (if preferred):
- Keep `foundry.fleetdrms.com` pointing to portal
- Portal can serve `/foundry` route
- Both `foundry.fleetdrms.com` and `portal.fleetdrms.com/foundry` work

---

## What's in FleetDRMS Now (Phase 7A Pending)

The **FleetDRMS repository** (`a_fleetdrms`) is preparing to remove all portal code:

**Phase 7A: Portal Code Removal** (not yet executed):
- Will remove `src/pages/portal/` (83 files)
- Will remove `src/components/portal/` (78 files)
- **Will remove Foundry page** (2 files) - this is why we migrated it!
- Will remove portal services, types, contexts, hooks (~30 files)
- Will remove portal tests (8 files)
- **Total**: ~202 files removed

**Status**: Planned but not executed yet. Waiting for approval.

**Removal script**: `a_fleetdrms/database/portal_migration/scripts/remove_portal.sh`
**Step 1b**: Removes Foundry landing page and PublicLayout

---

## Verification Steps (When Needed)

To verify the Foundry page works correctly in foundry-portal:

### 1. Check Files Exist
```bash
ls -la src/pages/public/FoundryLanding.tsx       # Should exist
ls -la src/components/public/PublicLayout.tsx    # Should exist
```

### 2. Check Route Exists
```bash
grep -n "foundry" src/pages/portal/PortalRoutes.tsx  # Should find route definition
```

### 3. Test Locally
```bash
npm run dev
# Navigate to: http://localhost:8081/foundry
# Should see: Foundry landing page with purple gradient hero
# Click: "Join the Foundry" button
# Should navigate to: http://localhost:8081/auth?ref=FOUNDRY
```

### 4. Test Referral Code
```bash
# After clicking "Join" button, check URL:
# URL should be: /auth?ref=FOUNDRY
# Auth page should pre-fill referral code field with "FOUNDRY"
```

### 5. Test Campaign Tracking (Optional)
```bash
# Visit: http://localhost:8081/foundry?campaign=social-media
# Click "Join" button
# Should navigate to: /auth?ref=FOUNDRY&campaign=social-media
```

---

## File Structure in foundry-portal

```
foundry-portal/
├── src/
│   ├── pages/
│   │   ├── public/                          🆕 NEW DIRECTORY
│   │   │   └── FoundryLanding.tsx          🆕 NEW FILE (397 lines)
│   │   └── portal/
│   │       ├── PortalAuth.tsx              ✅ Existing (receives FOUNDRY referral)
│   │       ├── PortalRoutes.tsx            ✏️ Modified (added /foundry route)
│   │       ├── PortalDashboard.tsx
│   │       └── ...
│   ├── components/
│   │   ├── public/                          🆕 NEW DIRECTORY
│   │   │   └── PublicLayout.tsx            🆕 NEW FILE (31 lines)
│   │   ├── portal/
│   │   ├── auth/
│   │   └── ui/
│   └── ...
└── ...
```

---

## Content Summary

The Foundry landing page includes:

### Hero Section
- FleetDRMS logo with purple gradient
- "DSP Foundry Portal" title
- "Invite Only" and "Limited Spots Available" badges
- Compelling subtitle about DSP owner collaboration

### Introduction
- Mission statement: Building WITH the DSP community, not FOR it
- Why invite-only (quality over quantity)

### Mission Content
- Core mission: Revolutionize DSP industry with community input
- Vision: Co-creation model
- Product features, integrations, priorities driven by community

### Why the Foundry Exists
- 5 key industry gaps addressed:
  1. Fragmented systems
  2. Industry-specific needs
  3. Lack of community voice
  4. Missing integration
  5. Cost vs value imbalance

### How We're Different
- Community-driven development
- Proof through partnership
- No barriers to entry (free to join)

### Our Commitment
- 6 commitments: Listen first, maintain transparency, prioritize input, etc.

### Call to Action
- "Ready to Join the Revolution?" headline
- Large "Join the Foundry" button (navigates to `/auth?ref=FOUNDRY`)
- "Free to join. No commitment required."

### Final Quote
- Mission statement from FleetDRMS Foundry Team

---

## Related Files to Know About

### In foundry-portal (this repo):

1. **`src/pages/portal/PortalAuth.tsx`**
   - Handles both sign-in and registration
   - Reads `ref` query parameter for referral codes
   - Processes `FOUNDRY` referral code
   - Creates referral record in `portal_referrals` table

2. **`src/pages/portal/PortalOnboarding.tsx`**
   - First-time user onboarding flow
   - Collects DSP information
   - Shown after successful registration from Foundry page

3. **`src/components/portal/PortalLayout.tsx`**
   - Standard portal layout (with navigation)
   - NOT used by Foundry page (uses PublicLayout instead)

4. **`src/pages/portal/PortalDashboard.tsx`**
   - Where users land after completing onboarding
   - Foundry members see this after registration

### In FleetDRMS (a_fleetdrms):

1. **`src/pages/public/FoundryLanding.tsx`** ⚠️ OLD LOCATION
   - Will be removed in Phase 7A
   - DO NOT modify this file
   - Use foundry-portal version instead

2. **`database/portal_migration/scripts/remove_portal.sh`**
   - Automated removal script
   - Step 1b removes Foundry page from FleetDRMS

---

## Environment Variables

### No Longer Needed

These environment variables were removed during migration:

- ❌ `VITE_PRODUCTION_PORTAL_DOMAIN` - Not needed (we're in portal)
- ❌ `VITE_FOUNDRY_REFERRAL_CODE` - Hardcoded as `FOUNDRY` (can still override if needed)

### Current Configuration

```bash
# .env (foundry-portal)
# No special configuration needed for Foundry page
# It uses the same Supabase config as rest of portal

VITE_SUPABASE_URL=<portal database URL>
VITE_SUPABASE_ANON_KEY=<portal anon key>
```

---

## Deployment Notes

When deploying foundry-portal to production:

1. **Ensure `/foundry` route works**:
   ```bash
   # Test route exists
   curl https://portal.fleetdrms.com/foundry
   # Should return: 200 OK with Foundry landing page HTML
   ```

2. **Verify referral code flow**:
   ```bash
   # Visit Foundry page → Click "Join" → Should see auth page with ref=FOUNDRY
   ```

3. **Update DNS** (if using dedicated subdomain):
   ```bash
   # Point foundry.fleetdrms.com to portal deployment
   # OR keep it pointing to portal with /foundry path
   ```

4. **Test campaign tracking** (optional):
   ```bash
   # Marketing links should include campaign parameter:
   # https://foundry.fleetdrms.com/?campaign=linkedin
   # Should preserve campaign in auth URL
   ```

---

## Git Commit History

**Commit**: 1a2b5a3 (foundry-portal)
```
feat: add Foundry landing page to portal

ADDED:
- src/pages/public/FoundryLanding.tsx - Foundry DSP marketing landing page
- src/components/public/PublicLayout.tsx - Simple public page layout
- Route: /foundry - Public marketing page with FOUNDRY referral code

DETAILS:
The Foundry landing page is part of the portal marketing funnel.
It showcases the DSP Foundry community and directs visitors to
portal registration with the FOUNDRY referral code.

Updated routing:
- Navigates to /auth?ref=FOUNDRY when 'Join' button clicked
- Captures optional campaign parameter from URL
- Works within portal app (uses navigate(), not window.location)

This page was previously in FleetDRMS app but belongs with portal
as it's part of the portal user acquisition funnel.

See: foundry.fleetdrms.com → portal.fleetdrms.com/auth?ref=FOUNDRY
```

---

## Summary

✅ **Foundry landing page successfully migrated to foundry-portal**
✅ **Route `/foundry` added to portal routing**
✅ **Navigation simplified (internal routing, no cross-domain)**
✅ **Ready for production deployment**
✅ **Will work when Phase 7A removes Foundry from FleetDRMS**

The Foundry page is now in its proper home - the portal repository where it belongs as part of the portal marketing and user acquisition funnel. 🎉

---

**Questions?** Review this document or check:
- `src/pages/public/FoundryLanding.tsx` - The page itself
- `src/pages/portal/PortalRoutes.tsx` - Route configuration
- `src/pages/portal/PortalAuth.tsx` - Referral code handling
