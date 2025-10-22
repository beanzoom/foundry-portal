import { useMemo } from 'react';

/**
 * Hook to get portal paths based on whether we're on subdomain or path-based routing
 */
export function usePortalPaths() {
  const isSubdomain = useMemo(() => {
    const hostname = window.location.hostname;
    return hostname === 'portal.localhost' ||
           hostname.startsWith('portal.') ||
           hostname.includes('vercel.app');
  }, []);
  
  const pathPrefix = isSubdomain ? '' : '/portal';
  
  /**
   * Generate a portal path
   * @param path - The path without the /portal prefix (e.g., '/dashboard', '/profile')
   * @returns The full path with appropriate prefix
   */
  const portalPath = (path: string): string => {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${pathPrefix}${cleanPath}`;
  };
  
  /**
   * Navigate to a portal path using window.location
   * Useful for hard navigation that requires page reload
   */
  const navigatePortal = (path: string): void => {
    window.location.href = portalPath(path);
  };
  
  return {
    isSubdomain,
    pathPrefix,
    portalPath,
    navigatePortal,
    // Common paths
    paths: {
      root: pathPrefix || '/',
      dashboard: portalPath('/dashboard'),
      profile: portalPath('/profile'),
      profileEdit: portalPath('/profile/edit'),
      surveys: portalPath('/surveys'),
      events: portalPath('/events'),
      updates: portalPath('/updates'),
      solutions: portalPath('/solutions'),
      referrals: portalPath('/referrals'),
      contact: portalPath('/contact'),
      calculators: portalPath('/calculators'),
      onboarding: portalPath('/onboarding'),
      terms: portalPath('/terms'),
      privacy: portalPath('/privacy'),
      unauthorized: portalPath('/unauthorized'),
      register: portalPath('/register'),
      auth: portalPath('/auth'),
      // Admin paths
      admin: {
        dashboard: portalPath('/admin/dashboard'),
        users: portalPath('/admin/users'),
        content: portalPath('/admin/content'),
        surveys: portalPath('/admin/surveys'),
        surveysNew: portalPath('/admin/surveys/new'),
        events: portalPath('/admin/events'),
        eventsNew: portalPath('/admin/events/new'),
        updates: portalPath('/admin/updates'),
        updatesNew: portalPath('/admin/updates/new'),
        solutions: portalPath('/admin/solutions'),
        analytics: portalPath('/admin/analytics'),
        settings: portalPath('/admin/settings'),
        contacts: portalPath('/admin/contacts'),
      }
    }
  };
}