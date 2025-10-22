import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PortalRegisterRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Preserve all query parameters (especially ref= for referrals)
    const queryString = searchParams.toString();

    // Check if we're on a subdomain
    const isSubdomain = window.location.hostname === 'portal.localhost' ||
                       window.location.hostname.startsWith('portal.');

    // Use appropriate path based on subdomain
    const authPath = isSubdomain ? '/auth' : '/portal/auth';
    const redirectUrl = `${authPath}${queryString ? `?${queryString}` : ''}`;

    console.log('[PortalRegisterRedirect] Redirecting from /register to', redirectUrl);

    // Replace history entry so back button doesn't loop
    navigate(redirectUrl, { replace: true });
  }, [navigate, searchParams]);

  // Show nothing while redirecting
  return null;
}