import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { portalRoute } from '@/lib/portal/navigation';

interface PortalAuthGuardProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export function PortalAuthGuard({ children, requireOnboarding = true }: PortalAuthGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        // Check if user has completed profile
        // Note: Using profile_complete (not profile_completed) as that's the actual column name
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_complete, role, company_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfileLoading(false);
          return;
        }

        // Store the user's role
        setUserRole(profile?.role || null);
        
        // Special case: If user is admin/super_admin/superadmin, always consider profile complete
        if (profile?.role === 'admin' || 
            profile?.role === 'super_admin' || 
            profile?.role === 'superadmin') {
          setProfileCompleted(true);
        } else {
          // For portal_member, portal_admin, portal_investor, check profile completion
          setProfileCompleted(profile?.profile_complete || false);
        }
        
        // Note: Compulsory updates checking has been moved to PortalOnboarding
        // to ensure it only happens after profile completion, not on every auth check
        
      } catch (err) {
        console.error('Profile check error:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading && user) {
      checkProfileCompletion();
    } else if (!authLoading && !user) {
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Skip checks while loading
    if (authLoading || profileLoading) return;

    // If not authenticated, redirect to portal root (which shows auth)
    if (!user) {
      // Only redirect if we're not already at the portal root
      if (location.pathname !== '/portal' && !location.pathname.includes('/portal/auth')) {
        navigate('/portal?redirect=' + encodeURIComponent(location.pathname));
      }
      return;
    }

    // If we're already on the onboarding page, don't redirect
    const onboardingPath = portalRoute('/onboarding');
    if (location.pathname === onboardingPath) {
      return;
    }

    // If profile is not completed and we require onboarding
    if (requireOnboarding && !profileCompleted) {
      // For portal users who haven't completed profile, go to onboarding
      const portalRoles = ['portal_member', 'portal_admin', 'portal_investor', 'investor'];
      if (portalRoles.includes(userRole || '')) {
        navigate(onboardingPath);
      } else {
        // For admin roles, they might have access without full profile
        // Let them through if they're admin/super_admin
        if (userRole !== 'admin' && userRole !== 'super_admin' && userRole !== 'superadmin') {
          navigate(onboardingPath);
        }
      }
      return;
    }
  }, [user, authLoading, profileLoading, profileCompleted, requireOnboarding, userRole, navigate, location]);

  // Show loading spinner while checking auth and profile
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!user) {
    return null;
  }

  // If profile not completed and onboarding required, don't render children (will redirect)
  if (requireOnboarding && !profileCompleted && location.pathname !== portalRoute('/onboarding')) {
    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
}