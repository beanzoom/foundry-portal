/**
 * Portal navigation utilities
 * Handles path generation for both subdomain and path-based routing
 */

/**
 * Check if we're on a portal subdomain (including Vercel preview URLs)
 */
export function isPortalSubdomain(): boolean {
  const hostname = window.location.hostname;
  return hostname === 'portal.localhost' ||
         hostname.startsWith('portal.') ||
         hostname.includes('vercel.app');
}

/**
 * Get the base path for portal routes
 * Returns "" for subdomain, "/portal" for path-based
 */
export function getPortalBasePath(): string {
  return isPortalSubdomain() ? '' : '/portal';
}

/**
 * Generate a portal route path
 * @param path - The path without the /portal prefix (e.g., "/dashboard", "/admin/users")
 * @returns The correct path based on the current environment
 */
export function portalRoute(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // For subdomain, use path as-is
  // For path-based, prepend /portal
  return isPortalSubdomain() ? normalizedPath : `/portal${normalizedPath}`;
}

/**
 * Generate an admin route path
 * @param path - The admin path without prefix (e.g., "users", "settings")
 * @returns The correct admin path based on the current environment
 */
export function adminRoute(path: string = ''): string {
  const adminPath = path ? `/admin/${path}` : '/admin';
  return portalRoute(adminPath);
}

/**
 * Navigation helper for programmatic navigation
 * @param navigate - React Router navigate function
 * @param path - The path to navigate to (without /portal prefix)
 */
export function navigateToPortal(navigate: (path: string) => void, path: string) {
  navigate(portalRoute(path));
}