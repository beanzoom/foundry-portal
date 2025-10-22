import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface PortalUpdate {
  id: string;
  title: string;
  content: string;
  update_type: 'compulsory' | 'advisory';
  status: 'draft' | 'published' | 'archived';
  target_audience: 'all' | 'investors';
  priority: number;
  created_by: string;
  created_at: string;
  published_at: string | null;
  is_correction_of: string | null;
  has_correction: boolean;
  view_count: number;
  acknowledgment_count: number;
  // User-specific fields
  is_read?: boolean;
  is_acknowledged?: boolean;
  is_dismissed?: boolean;
  read_record?: UpdateReadRecord;
}

export interface UpdateReadRecord {
  id: string;
  update_id: string;
  user_id: string;
  first_viewed_at: string;
  last_viewed_at: string;
  view_count: number;
  acknowledged_at: string | null;
  dismissed_at: string | null;
  time_to_acknowledge: string | null;
}

interface UnreadUpdate {
  update_id: string;
  title: string;
  content: string;
  update_type: 'compulsory' | 'advisory';
  target_audience: 'all' | 'investors';
  priority: number;
  published_at: string;
  is_read: boolean;
  is_acknowledged: boolean;
  is_dismissed: boolean;
}

// Hook to get updates for USER pages (only sees published updates)
export function usePortalUpdates(filter?: 'all' | 'compulsory' | 'advisory') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portal-updates', filter],
    queryFn: async () => {
      let query = supabase
        .from('portal_updates')
        .select(`
          *,
          read_records:portal_update_reads!left (
            *
          )
        `)
        .eq('status', 'published') // ALWAYS filter for published status for users
        .order('published_at', { ascending: false, nullsFirst: false });

      // Apply additional filters
      if (filter && filter !== 'all') {
        query = query.eq('update_type', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Process updates to add user-specific fields
      const processedUpdates = data?.map(update => {
        const userReadRecord = update.read_records?.find(
          (record: UpdateReadRecord) => record.user_id === user?.id
        );
        
        return {
          ...update,
          is_read: !!userReadRecord,
          is_acknowledged: !!userReadRecord?.acknowledged_at,
          is_dismissed: !!userReadRecord?.dismissed_at,
          read_record: userReadRecord
        };
      });

      return processedUpdates as PortalUpdate[];
    },
    enabled: !!user
  });
}

// Hook to get ALL updates for ADMIN pages (includes drafts, archived, etc.)
export function useAdminPortalUpdates(statusFilter?: 'all' | 'draft' | 'published' | 'archived') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-updates', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('portal_updates')
        .select(`
          *,
          read_records:portal_update_reads (
            user_id,
            acknowledged_at,
            dismissed_at,
            first_viewed_at
          )
        `)
        .order('created_at', { ascending: false });

      // Apply status filter if specified
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process updates to include stats (temporarily remove creator info until profile join is fixed)
      const processedUpdates = data?.map(update => {
        const acknowledgedCount = update.read_records?.filter(
          (r: any) => r.acknowledged_at
        ).length || 0;

        const viewedCount = update.read_records?.filter(
          (r: any) => r.first_viewed_at
        ).length || 0;

        return {
          ...update,
          creator_name: 'Admin', // Temporarily hardcode until profile join is fixed
          acknowledged_count: acknowledgedCount,
          viewed_count: viewedCount,
          total_recipients: update.target_audience === 'all' ? 'All Users' : 'Investors Only'
        };
      });

      return processedUpdates as PortalUpdate[];
    },
    enabled: !!user
  });
}

// Hook to get unread updates for the current user
export function useUnreadUpdates() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unread-updates', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .rpc('get_unread_updates_for_user', { p_user_id: user.id });
      
      if (error) throw error;
      
      return data as UnreadUpdate[];
    },
    enabled: !!user,
    refetchInterval: 30000 // Refetch every 30 seconds for real-time feel
  });
}

// Hook to get unread count for the bell icon
export function useUnreadUpdateCount() {
  const { data: unreadUpdates } = useUnreadUpdates();
  return unreadUpdates?.length || 0;
}

// Hook to acknowledge an update
export function useAcknowledgeUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      if (!user) throw new Error('User not authenticated');
      if (!updateId) throw new Error('Update ID is required');

      // First check if a read record exists
      const { data: existingRead } = await supabase
        .from('portal_update_reads')
        .select('id, first_viewed_at')
        .eq('update_id', updateId)
        .eq('user_id', user.id)
        .single();

      const now = new Date().toISOString();
      const firstViewedAt = existingRead?.first_viewed_at || now;

      if (existingRead) {
        // Update existing record
        const { error } = await supabase
          .from('portal_update_reads')
          .update({
            acknowledged_at: now,
            last_viewed_at: now,
            time_to_acknowledge: `${Math.floor((new Date(now).getTime() - new Date(firstViewedAt).getTime()) / 1000)} seconds`
          })
          .eq('update_id', updateId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('portal_update_reads')
          .insert({
            update_id: updateId,
            user_id: user.id,
            first_viewed_at: now,
            last_viewed_at: now,
            acknowledged_at: now,
            view_count: 1,
            time_to_acknowledge: '0 seconds'
          });
        
        if (error) throw error;
      }

      // Update acknowledgment count on the update
      const { data: updateData } = await supabase
        .from('portal_updates')
        .select('acknowledgment_count')
        .eq('id', updateId)
        .single();

      if (updateData) {
        await supabase
          .from('portal_updates')
          .update({
            acknowledgment_count: (updateData.acknowledgment_count || 0) + 1
          })
          .eq('id', updateId);
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
    }
  });
}

// Hook to dismiss an update
export function useDismissUpdate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      if (!user) throw new Error('User not authenticated');
      if (!updateId) throw new Error('Update ID is required');

      // First check if a read record exists
      const { data: existingRead } = await supabase
        .from('portal_update_reads')
        .select('id')
        .eq('update_id', updateId)
        .eq('user_id', user.id)
        .single();

      if (existingRead) {
        // Update existing record
        const { error } = await supabase
          .from('portal_update_reads')
          .update({
            dismissed_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString()
          })
          .eq('update_id', updateId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('portal_update_reads')
          .insert({
            update_id: updateId,
            user_id: user.id,
            first_viewed_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString(),
            dismissed_at: new Date().toISOString(),
            view_count: 1
          });
        
        if (error) throw error;
      }

      // Update dismissal count on the update
      const { data: updateData } = await supabase
        .from('portal_updates')
        .select('dismissal_count')
        .eq('id', updateId)
        .single();

      if (updateData) {
        await supabase
          .from('portal_updates')
          .update({
            dismissal_count: (updateData.dismissal_count || 0) + 1
          })
          .eq('id', updateId);
      }

      return true;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
    }
  });
}

// Hook to mark an update as viewed
export function useMarkUpdateViewed() {
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .rpc('mark_update_viewed', {
          p_update_id: updateId,
          p_user_id: user.id
        });
      
      if (error) throw error;
    }
  });
}

// Admin hooks

// Hook to create an update
export function useCreateUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<PortalUpdate>) => {
      // ALWAYS create as draft, never published directly
      const updateData = {
        ...update,
        status: 'draft',
        published_at: null
      };

      const { data, error } = await supabase
        .from('portal_updates')
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
    }
  });
}

// Hook to update an update (drafts only)
export function useUpdateUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<PortalUpdate> & { id: string }) => {
      const { data, error } = await supabase
        .from('portal_updates')
        .update(update)
        .eq('id', id)
        .eq('status', 'draft') // Only allow updating drafts
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
    }
  });
}

// Hook to publish an update
export function usePublishUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateId: string) => {
      // First check the current status
      const { data: currentUpdate, error: fetchError } = await supabase
        .from('portal_updates')
        .select('id, status')
        .eq('id', updateId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch update: ${fetchError.message}`);
      }

      if (!currentUpdate) {
        throw new Error('Update not found');
      }

      if (currentUpdate.status !== 'draft') {
        throw new Error(`Cannot publish update with status "${currentUpdate.status}". Only drafts can be published.`);
      }

      const { data, error } = await supabase
        .from('portal_updates')
        .update({
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', updateId)
        .eq('status', 'draft') // Only allow publishing drafts
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to publish update: ${error.message}`);
      }

      if (!data) {
        throw new Error('Update was not published. It may have been modified by another user.');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
    }
  });
}

// Hook to delete an update (drafts only)
export function useDeleteUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('portal_updates')
        .delete()
        .eq('id', updateId)
        .eq('status', 'draft'); // Only allow deleting drafts
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
    }
  });
}

// Hook to archive an update (published only)
export function useArchiveUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      const { data, error } = await supabase
        .from('portal_updates')
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', updateId)
        .eq('status', 'published') // Only allow archiving published updates
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      queryClient.invalidateQueries({ queryKey: ['admin-updates'] });
      queryClient.invalidateQueries({ queryKey: ['unread-updates'] });
    }
  });
}

// Hook to get update analytics
export function useUpdateAnalytics(updateId: string) {
  return useQuery({
    queryKey: ['update-analytics', updateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('portal_update_reads')
        .select('*')
        .eq('update_id', updateId)
        .order('first_viewed_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!updateId
  });
}

// Hook to get unread updates count
export function useUnreadCount() {
  const { data: unreadUpdates = [] } = useUnreadUpdates();
  return unreadUpdates.length;
}