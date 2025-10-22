
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { createLogger } from "@/lib/logging";
import type { AppRole } from "@/types/profile";
import { useDevSession } from "@/hooks/useDevSession";

const logger = createLogger('useUserRole');

/**
 * Hook to check for admin and owner role status efficiently
 */
export function useUserRole() {
  const [roles, setRoles] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { getDevSession } = useDevSession();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["user-roles-check"],
    queryFn: async () => {
      try {
        // Check if we should bypass cache (e.g., after deployment or login)
        const shouldBypassCache = sessionStorage.getItem('force_role_refresh') === 'true';
        
        // First check cache for quicker responses (unless we need to bypass)
        if (!shouldBypassCache) {
          const cachedRoles = sessionStorage.getItem('user_roles');
          if (cachedRoles) {
            logger.debug("Using cached user roles");
            return JSON.parse(cachedRoles);
          }
        } else {
          // Clear the force refresh flag
          sessionStorage.removeItem('force_role_refresh');
        }
        
        // IMPROVED: More robust maintenance edit mode detection
        const isMaintenanceEditMode = 
          (window.location.pathname.includes('/maintenance') && 
            (window.location.search.includes('edit=true') || 
             window.location.pathname.includes('/edit'))) || 
          sessionStorage.getItem('maintenanceEditMode') === 'true' ||
          document.querySelector('[data-maintenance-edit="true"]') !== null;
          
        if (isMaintenanceEditMode) {
          // Return dummy roles for maintenance edit mode to prevent errors
          logger.debug("In maintenance edit mode, using default roles");
          const defaultRoles = ['user', 'maintenance_editor'];
          sessionStorage.setItem('user_roles', JSON.stringify(defaultRoles));
          return defaultRoles;
        }
        
        // Check for dev session first
        const devSession = getDevSession();
        if (devSession && devSession.user) {
          logger.debug("Using dev session roles:", devSession.user.roles);
          const devRoles = devSession.user.roles || [];
          sessionStorage.setItem('user_roles', JSON.stringify(devRoles));
          return devRoles;
        }
        
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.error("Error fetching session:", sessionError);
          return [];
        }
        
        const currentSession = sessionData?.session;
        
        if (!currentSession) {
          logger.debug("No active session found in useUserRole - using cached roles if available");
          // Try to use cached roles as fallback instead of throwing an error
          const cachedRoles = sessionStorage.getItem('user_roles');
          return cachedRoles ? JSON.parse(cachedRoles) : [];
        }
        
        const userId = currentSession.user.id;
        logger.debug(`Checking roles for user ID: ${userId}`);
        
        // Get roles with single query
        const { data: userRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
          
        if (rolesError) {
          logger.error("Error fetching user roles:", rolesError);
          return [];
        }
        
        const rolesList = userRoles?.map(r => r.role) || [];
        
        // Cache the result
        sessionStorage.setItem('user_roles', JSON.stringify(rolesList));
        
        return rolesList;
      } catch (error) {
        logger.error("Failed to fetch user roles:", error);
        return []; // Return empty array instead of throwing
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data) {
      setRoles(data);
      // Check for admin or super_admin roles (developer is separate)
      const hasAdminRole = data.includes('admin') || data.includes('super_admin');
      setIsAdmin(hasAdminRole);
      setIsOwner(data.includes('owner'));
      logger.debug(`User roles set: ${data.join(', ')}, isAdmin: ${hasAdminRole}, isOwner: ${data.includes('owner')}`);
    }
  }, [data]);

  // Utility function to check if the user has a specific role
  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role);
  };

  // Utility function to check if the user has any of the provided roles
  const hasAnyRole = (checkRoles: AppRole[]): boolean => {
    return checkRoles.some(role => roles.includes(role));
  };

  // Utility function to check if the user has all of the provided roles
  const hasAllRoles = (checkRoles: AppRole[]): boolean => {
    return checkRoles.every(role => roles.includes(role));
  };

  // Force refresh function that clears cache and refetches
  const forceRefresh = useCallback(async () => {
    logger.debug("Force refreshing user roles");
    sessionStorage.removeItem('user_roles');
    sessionStorage.setItem('force_role_refresh', 'true');
    await refetch();
  }, [refetch]);

  return {
    roles,
    isAdmin,
    isOwner,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    forceRefresh
  };
}
