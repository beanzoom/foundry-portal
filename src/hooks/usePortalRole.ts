/**
 * Portal Role Hook - Provides role checking utilities within components
 */

import { useMemo } from 'react';
import { usePortal } from '@/contexts/PortalContext';
import {
  hasCapability,
  hasMinimumRole,
  hasAnyRole,
  isAdminRole,
  isSuperAdminRole,
  isInvestorRole,
  type PortalRole,
  PORTAL_ROLES
} from '@/lib/portal/roles';

export function usePortalRole() {
  const { portalUser } = usePortal();

  const userRole = useMemo(() => {
    return (portalUser?.role as PortalRole) || PORTAL_ROLES.PORTAL_MEMBER;
  }, [portalUser?.role]);

  return useMemo(() => ({
    // Current user's role
    role: userRole,

    // Check if user has a specific capability
    can: (capability: string) => hasCapability(userRole, capability),

    // Check if user meets minimum role requirement
    hasMinRole: (minRole: PortalRole) => hasMinimumRole(userRole, minRole),

    // Check if user has any of the specified roles
    hasAnyRole: (roles: PortalRole[]) => hasAnyRole(userRole, roles),

    // Common role checks
    isAdmin: isAdminRole(userRole),
    isSuperAdmin: isSuperAdminRole(userRole),
    isInvestor: isInvestorRole(userRole),
    isPortalMember: userRole === PORTAL_ROLES.PORTAL_MEMBER,

    // Check specific roles
    is: (role: PortalRole) => userRole === role,
  }), [userRole]);
}