import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/lib/logging';
import { Shield, UserX, UserCheck, AlertTriangle } from 'lucide-react';

const logger = createLogger('PermissionNotifications');

interface PermissionChangeNotification {
  type: 'permission_granted' | 'permission_revoked' | 'role_changed' | 'permission_error';
  user_id: string;
  permission?: string;
  role?: string;
  changed_by?: string;
  timestamp: string;
  context?: {
    scope?: 'company' | 'organization';
    organization_id?: string;
  };
}

/**
 * Hook for real-time permission change notifications
 * Provides toast notifications and cache invalidation when permissions change
 */
export function usePermissionNotifications() {
  const queryClient = useQueryClient();
  const currentUserRef = useRef<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        currentUserRef.current = session.user.id;
      }
    };
    getCurrentUser();
  }, []);

  // Show notification based on change type
  const showNotification = useCallback((notification: PermissionChangeNotification) => {
    const { type, permission, role, changed_by } = notification;
    
    let title = '';
    let description = '';
    let icon = Shield;
    let variant: 'default' | 'destructive' = 'default';

    switch (type) {
      case 'permission_granted':
        title = 'Permission Granted';
        description = `You've been granted the "${permission}" permission${changed_by ? ` by an administrator` : ''}.`;
        icon = UserCheck;
        variant = 'default';
        break;
        
      case 'permission_revoked':
        title = 'Permission Revoked';
        description = `The "${permission}" permission has been revoked${changed_by ? ` by an administrator` : ''}.`;
        icon = UserX;
        variant = 'destructive';
        break;
        
      case 'role_changed':
        title = 'Role Updated';
        description = `Your role has been updated${role ? ` to "${role}"` : ''}${changed_by ? ` by an administrator` : ''}.`;
        icon = Shield;
        variant = 'default';
        break;
        
      case 'permission_error':
        title = 'Permission System Error';
        description = 'There was an error updating permissions. Please refresh the page.';
        icon = AlertTriangle;
        variant = 'destructive';
        break;
    }

    toast({
      title,
      description,
      variant,
      duration: 5000,
    });

    logger.info(`Permission notification shown: ${type}`, { notification });
  }, []);

  // Invalidate relevant caches when permissions change
  const invalidatePermissionCaches = useCallback(async () => {
    logger.debug('Invalidating permission caches due to real-time update');
    
    // Invalidate all permission-related queries
    await queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    await queryClient.invalidateQueries({ queryKey: ['role-permissions-matrix'] });
    await queryClient.invalidateQueries({ queryKey: ['all-permissions'] });
    
    // Force refetch of current user permissions
    await queryClient.refetchQueries({ 
      queryKey: ['user-permissions'], 
      type: 'active' 
    });
    
    logger.debug('Permission caches invalidated successfully');
  }, [queryClient]);

  // Handle permission change events
  const handlePermissionChange = useCallback(async (payload: any) => {
    logger.debug('Permission change event received', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Always invalidate caches when permissions change
    await invalidatePermissionCaches();
    
    // Only show notifications for changes affecting the current user
    if (!currentUserRef.current) {
      logger.debug('No current user, skipping notification');
      return;
    }

    // Check if this change affects the current user
    const affectsCurrentUser = 
      newRecord?.user_id === currentUserRef.current ||
      oldRecord?.user_id === currentUserRef.current;
    
    if (!affectsCurrentUser) {
      logger.debug('Permission change does not affect current user');
      return;
    }

    // Determine notification type based on event
    let notificationType: PermissionChangeNotification['type'] = 'permission_granted';
    let permission = '';
    let role = '';

    if (eventType === 'INSERT') {
      notificationType = 'permission_granted';
      permission = newRecord?.permission_name || 'Unknown';
    } else if (eventType === 'DELETE') {
      notificationType = 'permission_revoked';
      permission = oldRecord?.permission_name || 'Unknown';
    } else if (eventType === 'UPDATE') {
      // Handle role changes or permission updates
      if (newRecord?.role !== oldRecord?.role) {
        notificationType = 'role_changed';
        role = newRecord?.role || 'Unknown';
      } else {
        notificationType = 'permission_granted'; // Default for updates
        permission = newRecord?.permission_name || 'Unknown';
      }
    }

    // Show notification
    showNotification({
      type: notificationType,
      user_id: currentUserRef.current,
      permission,
      role,
      changed_by: newRecord?.granted_by || oldRecord?.granted_by,
      timestamp: new Date().toISOString(),
      context: {
        scope: newRecord?.scope || oldRecord?.scope,
        organization_id: newRecord?.organization_id || oldRecord?.organization_id
      }
    });
  }, [showNotification, invalidatePermissionCaches]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUserRef.current) return;

    logger.debug('Setting up permission change subscription');

    // Subscribe to role_permissions table changes
    subscriptionRef.current = supabase
      .channel('permission-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'role_permissions'
        },
        handlePermissionChange
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'permissions'
        },
        async () => {
          // Permission definitions changed, invalidate caches
          await invalidatePermissionCaches();
          logger.debug('Permission definitions updated');
        }
      )
      .subscribe((status) => {
        logger.debug(`Permission subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          logger.info('Permission change notifications active');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('Failed to subscribe to permission changes');
          showNotification({
            type: 'permission_error',
            user_id: currentUserRef.current!,
            timestamp: new Date().toISOString()
          });
        }
      });

    // Cleanup subscription
    return () => {
      if (subscriptionRef.current) {
        logger.debug('Cleaning up permission subscription');
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [handlePermissionChange, invalidatePermissionCaches, showNotification]);

  // Manual cache invalidation function
  const refreshPermissions = useCallback(async () => {
    logger.info('Manual permission refresh requested');
    await invalidatePermissionCaches();
    
    toast({
      title: 'Permissions Refreshed',
      description: 'Your permissions have been updated.',
      duration: 3000,
    });
  }, [invalidatePermissionCaches]);

  // Check connection status
  const getConnectionStatus = useCallback(() => {
    return subscriptionRef.current?.state || 'disconnected';
  }, []);

  return {
    // Utilities
    refreshPermissions,
    getConnectionStatus,
    
    // For debugging/monitoring
    isConnected: getConnectionStatus() === 'joined',
  };
}