/**
 * Portal Role Definitions - Single Source of Truth
 * This file defines all portal roles and their capabilities
 *
 * IMPORTANT: 'user' role = System users (NOT portal users)
 * Portal members use 'portal_member' role
 */

export const PORTAL_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  INVESTOR: 'investor',
  PORTAL_MEMBER: 'portal_member'
} as const;

export type PortalRole = typeof PORTAL_ROLES[keyof typeof PORTAL_ROLES];

/**
 * Role hierarchy - higher index = higher privileges
 * Used for simple privilege comparison
 */
export const ROLE_HIERARCHY: PortalRole[] = [
  PORTAL_ROLES.PORTAL_MEMBER,
  PORTAL_ROLES.INVESTOR,
  PORTAL_ROLES.ADMIN,
  PORTAL_ROLES.SUPER_ADMIN
];

/**
 * Role capabilities - defines what each role can do
 *
 * Hierarchy:
 * - super_admin: Full unrestricted access, can promote users
 * - admin: Full site access, cannot promote users
 * - investor: Full user site with investor-specific content
 * - portal_member: Full user site except investor-only content
 */
export const ROLE_CAPABILITIES = {
  [PORTAL_ROLES.SUPER_ADMIN]: [
    'portal:*',  // Full unrestricted access to everything
  ],
  [PORTAL_ROLES.ADMIN]: [
    'portal:*',  // Full access (cannot promote users - handled separately)
  ],
  [PORTAL_ROLES.INVESTOR]: [
    // Portal features
    'portal:dashboard:view',
    'portal:profile:*',
    'portal:surveys:take',
    'portal:surveys:view',
    'portal:events:view',
    'portal:events:register',
    'portal:updates:view',
    'portal:updates:acknowledge',
    'portal:solutions:view',
    'portal:referrals:*',
    'portal:contact:*',
    'portal:calculators:*',
    // Investor-specific content
    'portal:investor:*',
  ],
  [PORTAL_ROLES.PORTAL_MEMBER]: [
    // Portal features (same as investor except no investor-specific content)
    'portal:dashboard:view',
    'portal:profile:*',
    'portal:surveys:take',
    'portal:surveys:view',
    'portal:events:view',
    'portal:events:register',
    'portal:updates:view',
    'portal:updates:acknowledge',
    'portal:solutions:view',
    'portal:referrals:*',
    'portal:contact:*',
    'portal:calculators:*',
  ]
} as const;

/**
 * Check if a user role has access to a specific capability
 */
export function hasCapability(
  userRole: PortalRole | PortalRole[],
  requiredCapability: string
): boolean {
  const roles = Array.isArray(userRole) ? userRole : [userRole];

  return roles.some(role => {
    const capabilities = ROLE_CAPABILITIES[role] || [];
    return capabilities.some(cap => {
      // Support wildcard matching
      if (cap.endsWith('*')) {
        const prefix = cap.slice(0, -1);
        return requiredCapability.startsWith(prefix);
      }
      return cap === requiredCapability;
    });
  });
}

/**
 * Check if a user role meets the minimum required role level
 */
export function hasMinimumRole(
  userRole: PortalRole | PortalRole[],
  minimumRole: PortalRole
): boolean {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole);

  return roles.some(role => {
    const roleIndex = ROLE_HIERARCHY.indexOf(role);
    return roleIndex >= minIndex;
  });
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  userRole: PortalRole | PortalRole[],
  allowedRoles: PortalRole[]
): boolean {
  const roles = Array.isArray(userRole) ? userRole : [userRole];
  return roles.some(role => allowedRoles.includes(role));
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: PortalRole): string {
  const displayNames: Record<PortalRole, string> = {
    [PORTAL_ROLES.SUPER_ADMIN]: 'Super Admin',
    [PORTAL_ROLES.ADMIN]: 'Admin',
    [PORTAL_ROLES.INVESTOR]: 'Investor',
    [PORTAL_ROLES.PORTAL_MEMBER]: 'Portal Member',
  };
  return displayNames[role] || role;
}

/**
 * Admin role check - commonly used throughout portal
 */
export function isAdminRole(userRole: PortalRole | PortalRole[]): boolean {
  return hasAnyRole(userRole, [
    PORTAL_ROLES.SUPER_ADMIN,
    PORTAL_ROLES.ADMIN
  ]);
}

/**
 * Super admin role check
 */
export function isSuperAdminRole(userRole: PortalRole | PortalRole[]): boolean {
  return hasAnyRole(userRole, [
    PORTAL_ROLES.SUPER_ADMIN
  ]);
}

/**
 * Check if user has investor privileges
 */
export function isInvestorRole(userRole: PortalRole | PortalRole[]): boolean {
  return hasAnyRole(userRole, [
    PORTAL_ROLES.SUPER_ADMIN,
    PORTAL_ROLES.ADMIN,
    PORTAL_ROLES.INVESTOR
  ]);
}