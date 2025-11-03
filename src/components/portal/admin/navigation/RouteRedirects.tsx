import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route redirect mapping for backward compatibility
 * Maps old admin routes to new grouped navigation structure
 */
const redirectMap: Record<string, string> = {
  // Content Management redirects
  '/portal/admin/updates': '/portal/admin/content/updates',
  '/portal/admin/surveys': '/portal/admin/content/surveys',
  '/portal/admin/events': '/portal/admin/content/events',
  '/portal/admin/solutions': '/portal/admin/content/solutions',
  '/portal/admin/content': '/portal/admin/content/updates', // Default content page

  // Users & Community redirects
  '/portal/admin/users': '/portal/admin/users/directory',
  '/portal/admin/referrals': '/portal/admin/users/referrals',
  '/portal/admin/contact-submissions': '/portal/admin/users/contact-submissions',
  '/portal/admin/contacts': '/portal/admin/users/contacts',

  // Data & Reports redirects
  '/portal/admin/analytics': '/portal/admin/data/analytics',
  '/portal/admin/reports/calculator-submissions': '/portal/admin/data/calculator-submissions',

  // Communications redirects (already at correct path, but kept for consistency)
  // Note: These routes already exist at /portal/admin/communications/* and work correctly

  // Settings redirects
  '/portal/admin/docs': '/portal/admin/settings/docs',

  // Test routes (keep at top level for now)
  // '/portal/admin/test-email' - remains at this path
  // '/portal/admin/test-edge-function' - remains at this path
  // '/portal/admin/test-logging' - remains at this path
};

/**
 * Component that redirects old admin routes to new structure
 * Used in PortalRoutes to maintain backward compatibility
 */
export function AdminRouteRedirect() {
  const location = useLocation();
  const newPath = redirectMap[location.pathname];

  if (newPath) {
    console.log(`[RouteRedirect] Redirecting ${location.pathname} → ${newPath}`);
    return <Navigate to={newPath} replace />;
  }

  // If no redirect found, go to dashboard
  console.log(`[RouteRedirect] No redirect found for ${location.pathname}, going to dashboard`);
  return <Navigate to="/portal/admin/dashboard" replace />;
}

/**
 * Hook to get the new path for an old route
 * Useful for programmatic navigation
 */
export function useRedirectPath(oldPath: string): string {
  return redirectMap[oldPath] || oldPath;
}

/**
 * Export the map for reference in other components
 */
export { redirectMap };
