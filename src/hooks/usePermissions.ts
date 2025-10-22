
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createLogger } from "@/lib/logging";
import { useUserRole } from "@/hooks/useUserRole";
import { usePermissionNotifications } from "@/hooks/usePermissionNotifications";
import { useDevSession } from "@/hooks/useDevSession";

const logger = createLogger('usePermissions');

// Enhanced permission types based on our new database system
export type Permission = string; // Dynamic permissions from database

// Database permission structure
interface PermissionData {
  permission: string;
  context: {
    scope: 'company' | 'organization';
    resource: string;
    action: string;
    role?: string;
    organization_id?: string;
    wildcard_source?: string;
  };
  expires_at?: string;
  inherited_from: 'direct' | 'wildcard' | 'legacy';
}

/**
 * Hook to check user permissions
 */
export function usePermissions() {
  const queryClient = useQueryClient();
  const { isAdmin, isOwner, roles } = useUserRole();
  const { getDevSession } = useDevSession();
  
  // Initialize real-time notifications
  const { refreshPermissions, isConnected, getConnectionStatus } = usePermissionNotifications();
  
  const { data: permissionData, isLoading, error } = useQuery({
    queryKey: ["user-permissions", roles],
    queryFn: async () => {
      try {
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        const currentSession = sessionData?.session;
        
        if (!currentSession) {
          logger.debug("No active session found in usePermissions");
          return [];
        }
        
        // Handle impersonation
        const isImpersonating = localStorage.getItem('impersonation_active') === 'true';
        const impersonatedUserId = localStorage.getItem('impersonated_user_id');
        
        const targetUserId = isImpersonating && impersonatedUserId 
          ? impersonatedUserId 
          : currentSession.user.id;
        
        logger.debug(`Fetching permissions for user: ${targetUserId}`);
        
        // For dev sessions with admin role, return basic permissions
        const devSession = getDevSession();
        if (devSession && devSession.user && devSession.user.roles) {
          const userRoles = devSession.user.roles;
          if (userRoles.includes('super_admin')) {
            logger.debug('Dev session super_admin - granting all permissions');
            return [
              { permission: 'admin:*', context: { scope: 'company', resource: 'admin', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet:*', context: { scope: 'company', resource: 'fleet', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet_maintenance:*', context: { scope: 'company', resource: 'fleet_maintenance', action: '*' }, inherited_from: 'direct' },
              { permission: 'developer:*', context: { scope: 'company', resource: 'developer', action: '*' }, inherited_from: 'direct' },
              { permission: 'bridge:*', context: { scope: 'company', resource: 'bridge', action: '*' }, inherited_from: 'direct' },
            ] as PermissionData[];
          } else if (userRoles.includes('admin')) {
            logger.debug('Dev session admin - granting permissions except auth debug');
            return [
              { permission: 'admin:*', context: { scope: 'company', resource: 'admin', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet:*', context: { scope: 'company', resource: 'fleet', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet_maintenance:*', context: { scope: 'company', resource: 'fleet_maintenance', action: '*' }, inherited_from: 'direct' },
              { permission: 'developer:*', context: { scope: 'company', resource: 'developer', action: '*' }, inherited_from: 'direct' },
              { permission: 'bridge:*', context: { scope: 'company', resource: 'bridge', action: '*' }, inherited_from: 'direct' }
            ] as PermissionData[];
          } else if (userRoles.includes('developer')) {
            logger.debug('Dev session developer - granting development permissions');
            return [
              { permission: 'developer:*', context: { scope: 'company', resource: 'developer', action: '*' }, inherited_from: 'direct' },
              { permission: 'bridge:*', context: { scope: 'company', resource: 'bridge', action: '*' }, inherited_from: 'direct' },
            ] as PermissionData[];
          }
        }
        
        // Call our new RPC function
        const { data, error } = await supabase.rpc('get_user_permissions', { 
          p_user_id: targetUserId 
        });
        
        if (error) {
          logger.error("Error getting permissions via RPC:", error);
          // For dev mode, if RPC fails, check roles and grant basic permissions
          if (roles.includes('super_admin')) {
            return [
              { permission: 'admin:*', context: { scope: 'company', resource: 'admin', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet:*', context: { scope: 'company', resource: 'fleet', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet_maintenance:*', context: { scope: 'company', resource: 'fleet_maintenance', action: '*' }, inherited_from: 'direct' },
              { permission: 'developer:*', context: { scope: 'company', resource: 'developer', action: '*' }, inherited_from: 'direct' },
              { permission: 'bridge:*', context: { scope: 'company', resource: 'bridge', action: '*' }, inherited_from: 'direct' },
            ] as PermissionData[];
          } else if (roles.includes('admin')) {
            return [
              { permission: 'admin:*', context: { scope: 'company', resource: 'admin', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet:*', context: { scope: 'company', resource: 'fleet', action: '*' }, inherited_from: 'direct' },
              { permission: 'fleet_maintenance:*', context: { scope: 'company', resource: 'fleet_maintenance', action: '*' }, inherited_from: 'direct' },
              { permission: 'developer:*', context: { scope: 'company', resource: 'developer', action: '*' }, inherited_from: 'direct' },
              { permission: 'bridge:*', context: { scope: 'company', resource: 'bridge', action: '*' }, inherited_from: 'direct' },
            ] as PermissionData[];
          }
          return [];
        }
        
        return data as PermissionData[];
      } catch (error) {
        logger.error("Error fetching permissions:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Memoized permission processing
  const permissions = useMemo(() => {
    if (!permissionData) return [];
    return permissionData.map(p => p.permission);
  }, [permissionData]);

  // Performance tracking
  const trackPermissionCheck = useCallback((permission: string, startTime: number, result: boolean) => {
    const duration = performance.now() - startTime;
    if (duration > 10) {
      logger.warn(`Slow permission check: ${permission} took ${duration.toFixed(2)}ms`);
    }
  }, []);

  // Enhanced permission checking function
  // Override for super_admin - they have ALL permissions
  const isSuperAdmin = roles.includes('super_admin');
  
  const hasPermission = useCallback((
    permission: Permission, 
    context?: { 
      scope?: 'company' | 'organization';
      organizationId?: string;
    }
  ): boolean => {
    const startTime = performance.now();
    
    // Safety checks
    if (!permission || typeof permission !== 'string') {
      trackPermissionCheck(permission || 'undefined', startTime, false);
      return false;
    }
    
    // Super admin bypass - they have ALL permissions
    if (isSuperAdmin) {
      trackPermissionCheck(permission, startTime, true);
      return true;
    }
    
    // Admin users have all developer permissions EXCEPT developer:auth
    if (roles.includes('admin') && permission === 'developer:auth') {
      trackPermissionCheck(permission, startTime, false);
      return false;
    }
    
    // Check for dev session with super_admin or admin role
    const devSession = getDevSession();
    if (devSession && devSession.user && devSession.user.roles) {
      const userRoles = devSession.user.roles;
      logger.debug('Dev session permission check:', { permission, userRoles });
      
      // Admin users have all developer permissions EXCEPT developer:auth
      if (userRoles.includes('admin') && permission === 'developer:auth') {
        logger.debug('Admin user denied developer:auth permission');
        trackPermissionCheck(permission, startTime, false);
        return false;
      }
      
      // Check for super_admin specific permissions
      if (permission.startsWith('super_admin:') && !userRoles.includes('super_admin')) {
        logger.debug('Non-super_admin denied super_admin permission:', permission);
        trackPermissionCheck(permission, startTime, false);
        return false;
      }
      
      const hasAdminRole = userRoles.some((r: string) => 
        ['super_admin', 'admin', 'developer'].includes(r)
      );
      if (hasAdminRole) {
        logger.debug('Dev session admin role granted permission:', permission);
        trackPermissionCheck(permission, startTime, true);
        return true;
      }
    }
    
    if (!permissionData || permissionData.length === 0) {
      trackPermissionCheck(permission, startTime, false);
      return false;
    }
    
    const result = permissionData.some(p => {
      // Safety check for permission data
      if (!p || !p.permission || typeof p.permission !== 'string') {
        return false;
      }
      
      // Exact match
      if (p.permission === permission) {
        if (context?.scope && p.context?.scope !== context.scope) return false;
        if (context?.organizationId && p.context?.organization_id !== context.organizationId) return false;
        return true;
      }
      
      // Wildcard match (admin:* matches admin:organizations)
      if (permission.includes(':')) {
        const [resource] = permission.split(':');
        if (resource && p.permission === `${resource}:*`) {
          // Check for admin restriction on developer:auth BEFORE returning true
          if (roles.includes('admin') && !roles.includes('super_admin') && permission === 'developer:auth') {
            return false;
          }
          if (context?.scope && p.context?.scope !== context.scope) return false;
          if (context?.organizationId && p.context?.organization_id !== context.organizationId) return false;
          return true;
        }
      }
      
      return false;
    });

    trackPermissionCheck(permission, startTime, result);
    return result;
  }, [permissionData, trackPermissionCheck, roles]);

  // Helper functions
  const hasAnyPermission = useCallback((permissions: Permission[], context?: any) => {
    if (!permissions || !Array.isArray(permissions)) return false;
    return permissions.some(p => hasPermission(p, context));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[], context?: any) => {
    if (!permissions || !Array.isArray(permissions)) return false;
    return permissions.every(p => hasPermission(p, context));
  }, [hasPermission]);

  // Get all permissions for a resource
  const getResourcePermissions = useCallback((resource: string) => {
    if (!permissionData) return [];
    return permissionData.filter(p => p.context.resource === resource);
  }, [permissionData]);

  // Check if user has wildcard permission for a resource
  const hasResourceWildcard = useCallback((resource: string) => {
    return hasPermission(`${resource}:*`);
  }, [hasPermission]);

  // Real-time updates are now handled by usePermissionNotifications hook

  // Helper functions for role checking
  const hasCompanyRole = (role: string): boolean => {
    return roles.includes(role);
  };
  
  const hasAnyCompanyRole = (): boolean => {
    return roles.some(role => ['super_admin', 'admin', 'developer', 'finance'].includes(role));
  };
  
  const hasOrganizationRole = (role: string): boolean => {
    return roles.includes(role);
  };
  
  const isCompanyUser = (): boolean => {
    return hasAnyCompanyRole();
  };
  
  const isOrganizationUser = (): boolean => {
    return roles.some(role => ['owner', 'manager', 'dispatch', 'tech', 'driver'].includes(role));
  };

  // Memoized convenience helpers
  const helpers = useMemo(() => ({
    // Company roles
    isCompanyAdmin: hasPermission('admin:*'),
    isDeveloper: hasPermission('developer:*'),
    isFinanceUser: hasPermission('finance:*'),
    
    // Organization roles  
    isOrgOwner: hasPermission('fleet:*') && hasPermission('maintenance:*'),
    isManager: hasPermission('fleet:vehicles:edit') && !hasPermission('reports:financial'),
    isDispatcher: hasPermission('fleet:vehicles:view') && hasPermission('users:view'), // Lead driver with some oversight
    isTech: hasPermission('maintenance:*'),
    isDriver: hasPermission('fleet:vehicles:view') && !hasPermission('fleet:vehicles:edit'),
  }), [hasPermission]);

  return {
    // Core data
    permissions,
    permissionData,
    isLoading,
    error,
    
    // Permission checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Resource helpers
    getResourcePermissions,
    hasResourceWildcard,
    
    // Real-time features
    refreshPermissions,
    isConnected,
    getConnectionStatus,
    
    // Role checking functions (legacy compatibility)
    hasCompanyRole: (role: string) => roles.includes(role),
    hasAnyCompanyRole: () => roles.some(role => ['super_admin', 'admin', 'developer', 'finance'].includes(role)),
    hasOrganizationRole: (role: string) => roles.includes(role),
    isCompanyUser: () => roles.some(role => ['super_admin', 'admin', 'developer', 'finance'].includes(role)),
    isOrganizationUser: () => roles.some(role => ['owner', 'manager', 'dispatch', 'tech', 'driver'].includes(role)),
    
    // Legacy compatibility
    isAdmin,
    isOwner,
    roles,
    
    // Convenience helpers
    ...helpers,
  };
}
