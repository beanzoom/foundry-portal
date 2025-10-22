import React from 'react';
import { usePortalRole } from '@/hooks/usePortalRole';
import { hasAnyRole, hasMinimumRole, hasCapability, type PortalRole } from '@/lib/portal/roles';

/**
 * HOC for role-based rendering
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: PortalRole[]
): React.FC<P> {
  return (props: P) => {
    const { role } = usePortalRole();

    if (!hasAnyRole(role, allowedRoles)) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Component for conditional rendering based on role
 */
interface RoleGuardProps {
  children: React.ReactNode;
  roles?: PortalRole[];
  minRole?: PortalRole;
  capability?: string;
  fallback?: React.ReactNode;
}

export function RoleGuard({
  children,
  roles,
  minRole,
  capability,
  fallback = null
}: RoleGuardProps) {
  const { role } = usePortalRole();

  let hasAccess = false;

  if (roles) {
    hasAccess = hasAnyRole(role, roles);
  } else if (minRole) {
    hasAccess = hasMinimumRole(role, minRole);
  } else if (capability) {
    hasAccess = hasCapability(role, capability);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}