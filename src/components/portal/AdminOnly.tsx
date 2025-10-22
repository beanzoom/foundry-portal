/**
 * AdminOnly Component - Conditionally renders content based on admin role
 */

import { RoleGuard } from '@/hooks/usePortalRole';
import { PORTAL_ROLES } from '@/lib/portal/roles';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleGuard
      roles={[
        PORTAL_ROLES.SUPER_ADMIN,
        PORTAL_ROLES.PORTAL_ADMIN,
        PORTAL_ROLES.ADMIN
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

/**
 * SuperAdminOnly Component - Only super admins see this content
 */
export function SuperAdminOnly({ children, fallback }: AdminOnlyProps) {
  return (
    <RoleGuard
      roles={[PORTAL_ROLES.SUPER_ADMIN, PORTAL_ROLES.PORTAL_ADMIN]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}