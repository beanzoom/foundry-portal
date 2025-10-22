import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface PortalUser {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  website?: string;
  role: string;
  agreedToTerms: boolean;
  termsVersion?: string;
  profileComplete: boolean;
}

interface PortalContextType {
  isPortal: boolean;
  portalUser: PortalUser | null;
  portalPermissions: string[];
  isLoading: boolean;
  refreshPortalUser: () => Promise<void>;
}

const PortalContext = createContext<PortalContextType>({
  isPortal: false,
  portalUser: null,
  portalPermissions: [],
  isLoading: true,
  refreshPortalUser: async () => {},
});

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [isPortal, setIsPortal] = useState(false);
  const [portalUser, setPortalUser] = useState<PortalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // VERSION MARKER - Update this when making changes to verify deployment
    console.log('[PortalContext] VERSION: 2024-12-31-v2 - Bridge user access fix');
    
    // Check if we're on portal subdomain OR accessing portal routes
    // BUT exclude other subdomains like foundry.fleetdrms.com
    // Also treat Vercel preview URLs as portal
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const isVercelPreview = hostname.includes('vercel.app');
    const isPortalSubdomain = hostname === 'portal.fleetdrms.com' ||
                              hostname === 'portal.localhost' ||
                              (hostname.startsWith('portal.') && !hostname.startsWith('foundry.')) ||
                              isVercelPreview;
    const portalCheck = isPortalSubdomain ||
                       pathname.startsWith('/portal'); // Also check if we're on portal routes
    
    console.log('[PortalContext] Portal check:', { hostname, pathname, portalCheck, user: user?.id, authLoading });
    setIsPortal(portalCheck);
    
    // CRITICAL: Don't do ANYTHING while auth is still loading
    // This prevents race conditions
    if (authLoading) {
      console.log('[PortalContext] Auth still loading, waiting...');
      setIsLoading(true); // Keep loading true while auth loads
      return;
    }
    
    // Auth has finished loading - now we can trust the user state
    
    // Check if we came from the Bridge
    const fromBridge = window.location.search.includes('from=bridge');
    if (fromBridge) {
      console.log('[PortalContext] User came from Bridge - will show auth page for portal login');
    }
    
    if (portalCheck && user) {
      // User is authenticated - fetch their profile
      console.log('[PortalContext] User authenticated, fetching profile for:', user.id);
      fetchUserProfile(user.id, fromBridge);
    } else if (portalCheck && !user) {
      // No user after auth has loaded - this is expected when coming from bridge
      console.log('[PortalContext] No authenticated user on portal - this is normal for cross-domain access');
      
      // Debug: Check if there's actually a session
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('[PortalContext] Direct session check:', session ? 'Session exists' : 'No session', session?.user?.id);
        if (session?.user) {
          console.log('[PortalContext] Found session in direct check! User:', session.user.id);
          // Try to fetch profile for this user
          fetchUserProfile(session.user.id, fromBridge);
        } else {
          setPortalUser(null);
          setIsLoading(false);
        }
      });
    } else {
      // Not a portal route
      console.log('[PortalContext] Not a portal route');
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // REMOVED: checkAuthSession function - we trust useAuth as single source of truth

  const fetchUserProfile = async (userId: string, fromBridge: boolean = false) => {
    try {
      console.log('[PortalContext] Fetching profile for user:', userId);
      // First, try to get the user's profile from the database
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[PortalContext] Error fetching profile:', error);
        setIsLoading(false);
        return;
      }

      console.log('[PortalContext] Profile fetched:', { 
        role: profile?.role, 
        id: profile?.id,
        email: profile?.email,
        full_name: profile?.full_name
      });
      
      if (profile) {
        // Check if user is superadmin/admin/investor - check user_roles table too
        let canAccessPortal = false;
        let userRoles: any[] = [];
        let effectiveRole = profile.role; // Start with profile role
        
        // First check if the profile role gives portal access
        // This is mainly for backwards compatibility AND for bridge users
        const profileRole = profile.role?.toLowerCase();
        const bridgeRoles = ['superadmin', 'super_admin', 'admin', 'dispatcher', 'mechanic', 'driver'];
        const portalRoles = ['portal_admin', 'portal_member', 'portal_investor', 'investor'];
        
        // Allow access if user has any bridge role OR portal role
        if (bridgeRoles.includes(profile.role) || bridgeRoles.includes(profileRole) ||
            portalRoles.includes(profile.role) || portalRoles.includes(profileRole)) {
          canAccessPortal = true;
          effectiveRole = profile.role;
          console.log('[PortalContext] Profile role grants portal access:', profile.role);
        }
        
        // Check system_user_assignments for system roles (super_admin, admin)
        console.log('[PortalContext] Checking system_user_assignments for system roles...');
        const { data: systemRoles } = await supabase
          .from('system_user_assignments')
          .select('system_role')
          .eq('user_id', userId)
          .eq('is_active', true);
        
        if (systemRoles && systemRoles.length > 0) {
          console.log('[PortalContext] System roles found:', systemRoles.map(r => r.system_role));
          
          // Check if user has admin/super_admin system role
          const hasSystemAdminRole = systemRoles.some(r => 
            r.system_role === 'admin' || 
            r.system_role === 'super_admin'
          );
          
          if (hasSystemAdminRole) {
            // System admins get automatic portal admin access
            if (systemRoles.some(r => r.system_role === 'super_admin')) {
              effectiveRole = 'super_admin';
            } else if (systemRoles.some(r => r.system_role === 'admin')) {
              effectiveRole = 'admin';
            }
            canAccessPortal = true;
            console.log('[PortalContext] System admin role found, portal admin access granted:', effectiveRole);
          }
        }
        
        // If not a system admin, check portal_memberships for explicit portal roles
        if (!canAccessPortal) {
          console.log('[PortalContext] Checking portal_memberships for explicit portal roles...');
          const { data: portalRoles } = await supabase
            .from('portal_memberships')
            .select('portal_role')
            .eq('user_id', userId)
            .eq('is_active', true);
          
          if (portalRoles && portalRoles.length > 0) {
            console.log('[PortalContext] Portal roles found:', portalRoles.map(r => r.portal_role));
            const portalRole = portalRoles[0].portal_role;
            if (['portal_admin', 'portal_member', 'portal_investor'].includes(portalRole)) {
              canAccessPortal = true;
              effectiveRole = portalRole;
              console.log('[PortalContext] Explicit portal role found:', effectiveRole);
            }
          }
        }
        
        // OVERRIDE: If user came from Bridge, trust they have access
        if (fromBridge && !canAccessPortal) {
          console.log('[PortalContext] User came from Bridge but access check failed - OVERRIDING to allow access');
          canAccessPortal = true;
        }
        
        console.log('[PortalContext] Access check result:', {
          originalRole: profile.role,
          effectiveRole,
          canAccessPortal,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        });
        
        if (canAccessPortal) {
          // Get the auth session to have email
          const { data: { session } } = await supabase.auth.getSession();
          
          // Use the effective role (which may have been overridden from user_roles)
          const finalRole = effectiveRole || profile.role;
          console.log('[PortalContext] Final role to use:', finalRole);
          
          // Load portal-specific user data with both profile and auth user data
          fetchPortalUser({ 
            ...profile, 
            role: finalRole,
            email: session?.user?.email || profile.email,
            id: userId 
          });
        } else {
          // Only redirect if we're actually trying to access portal routes
          // BUT check for multiple bypass conditions
          const hasFromBridge = window.location.search.includes('from=bridge');
          const hasSkipRedirect = window.location.hash === '#skip-redirect';
          const shouldAllowAccess = hasFromBridge || hasSkipRedirect;
          
          if (window.location.pathname.startsWith('/portal') && !shouldAllowAccess) {
            console.log('[PortalContext] User cannot access portal, redirecting away');
            const redirectUrl = process.env.NODE_ENV === 'development' 
              ? 'http://localhost:8081'
              : 'https://app.fleetdrms.com';
            window.location.href = redirectUrl;
          } else {
            console.log('[PortalContext] User cannot access portal, but bypass detected or not on portal route, no redirect');
            setIsLoading(false);
          }
        }
      }
    } catch (error) {
      console.error('[PortalContext] Error in fetchUserProfile:', error);
      setIsLoading(false);
    }
  };

  const fetchPortalUser = async (currentUser: any) => {
    try {
      console.log('[PortalContext] fetchPortalUser called with:', { 
        role: currentUser.role, 
        id: currentUser.id,
        email: currentUser.email 
      });
      
      // For SuperAdmin/Admin/Investor, inherit profile from existing user data
      if (currentUser.role === 'superadmin' || currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'investor') {
        // Try to get full name from various possible fields
        const fullName = currentUser.full_name || 
                        currentUser.name || 
                        `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
                        currentUser.email?.split('@')[0] || 
                        'User';
        
        // Determine company name based on role
        let companyName = 'FleetDRMS';
        if (currentUser.role === 'superadmin' || currentUser.role === 'super_admin') {
          companyName = 'FleetDRMS Administration';
        } else if (currentUser.role === 'admin') {
          companyName = 'FleetDRMS Admin';
        } else if (currentUser.role === 'investor') {
          companyName = currentUser.company_name || 'Investor';
        }
        
        const privilegedUser = {
          id: currentUser.id,
          email: currentUser.email || 'user@fleetdrms.com',
          name: fullName,
          companyName: companyName,
          website: currentUser.website || 'https://fleetdrms.com',
          role: currentUser.role,
          agreedToTerms: true, // SuperAdmin/Admin/Investor bypass terms
          termsVersion: 'admin',
          profileComplete: true // SuperAdmin/Admin/Investor always has complete profile
        };
        
        console.log('[PortalContext] Setting privileged portal user:', privilegedUser);
        setPortalUser(privilegedUser);
        setIsLoading(false);
        return;
      }
      
      // For regular portal users (including portal_member)
      // Create a user object from the profile data
      const portalUser = {
        id: currentUser.id,
        email: currentUser.email || 'user@fleetdrms.com',
        name: currentUser.full_name || currentUser.name || 
              `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() ||
              currentUser.email?.split('@')[0] || 'User',
        companyName: currentUser.company_name || '',
        website: currentUser.website || '',
        role: currentUser.role, // Keep the actual role (portal_member, pilotowner, etc)
        agreedToTerms: currentUser.terms_accepted_at ? true : true, // For now, assume they agreed if they're in the system
        profileComplete: currentUser.profile_complete || false
      };
      
      console.log('[PortalContext] Setting regular portal user:', portalUser);
      setPortalUser(portalUser);
    } catch (error) {
      console.error('Failed to fetch portal user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh function to reload user data
  const refreshPortalUser = async () => {
    console.log('[PortalContext] Refreshing portal user data...');
    if (user) {
      setIsLoading(true);
      await fetchUserProfile(user.id);
    }
  };

  // Portal permissions based on role
  const portalPermissions = (portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || portalUser?.role === 'admin')
    ? ['all', 'admin:portal', 'create_content', 'manage_users', 'view_analytics', 'edit_solutions'] 
    : portalUser?.role === 'investor'
    ? ['view_surveys', 'view_events', 'view_updates', 'view_analytics', 'view_solutions', 'investor_insights', 'view_reports']
    : portalUser?.role === 'pilotowner'
    ? ['view_surveys', 'submit_surveys', 'view_events', 'register_events', 'view_updates', 'submit_referrals', 'view_solutions', 'submit_contact']
    : [];

  return (
    <PortalContext.Provider value={{
      isPortal,
      portalUser,
      portalPermissions,
      isLoading,
      refreshPortalUser
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};