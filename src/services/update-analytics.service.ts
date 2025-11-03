import { supabase } from '@/lib/supabase';

export interface UpdateMetrics {
  update_id: string;
  title: string;
  content: string;
  update_type: string;
  type: string | null;
  status: string | null;
  priority: number;
  target_audience: string | null;
  total_readers: number;
  acknowledged_count: number;
  dismissed_count: number;
  read_rate: number;
  acknowledgement_rate: number;
  avg_time_to_acknowledge: string | null;
  created_at: string;
  published_at: string | null;
}

export interface UpdateReader {
  read_id: string;
  update_id: string;
  update_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
  acknowledged_at: string | null;
  dismissed_at: string | null;
  time_to_acknowledge: string | null;
}

/**
 * Fetch all update metrics
 */
export async function fetchAllUpdateMetrics(): Promise<UpdateMetrics[]> {
  // Get all updates
  const { data: updates, error: updatesError } = await supabase
    .from('portal_updates')
    .select('id, title, content, update_type, type, status, priority, target_audience, view_count, acknowledgment_count, dismissal_count, created_at, published_at')
    .order('created_at', { ascending: false });

  if (updatesError) {
    console.error('Error fetching updates:', updatesError);
    throw updatesError;
  }

  if (!updates || updates.length === 0) {
    return [];
  }

  const updateIds = updates.map(u => u.id);

  // Get read counts and stats for all updates
  const { data: reads, error: readsError } = await supabase
    .from('portal_update_reads')
    .select('update_id, user_id, acknowledged_at, dismissed_at, time_to_acknowledge')
    .in('update_id', updateIds);

  if (readsError) {
    console.error('Error fetching reads:', readsError);
    // Don't throw - just use empty array
  }

  // Get total user count for calculating read rate
  const { count: totalUsers } = await supabase
    .from('user_acquisition_details')
    .select('user_id', { count: 'exact', head: true });

  // Calculate metrics for each update
  const metrics: UpdateMetrics[] = updates.map(update => {
    const updateReads = reads?.filter(r => r.update_id === update.id) || [];

    const total_readers = new Set(updateReads.map(r => r.user_id)).size;
    const acknowledged_count = updateReads.filter(r => r.acknowledged_at).length;
    const dismissed_count = updateReads.filter(r => r.dismissed_at).length;

    const read_rate = totalUsers && totalUsers > 0
      ? Math.round((total_readers / totalUsers) * 100)
      : 0;

    const acknowledgement_rate = total_readers > 0
      ? Math.round((acknowledged_count / total_readers) * 100)
      : 0;

    // Calculate average time to acknowledge (in minutes)
    const acknowledgeTimes = updateReads
      .filter(r => r.time_to_acknowledge)
      .map(r => {
        // Parse interval string (e.g., "00:15:30" or "1 day 02:30:00")
        const interval = r.time_to_acknowledge;
        if (!interval) return 0;

        // Simple parsing - handle common formats
        const parts = interval.toString().split(':');
        if (parts.length === 3) {
          const hours = parseInt(parts[0]);
          const minutes = parseInt(parts[1]);
          return hours * 60 + minutes;
        }
        return 0;
      })
      .filter(t => t > 0);

    const avg_time_to_acknowledge = acknowledgeTimes.length > 0
      ? Math.round(acknowledgeTimes.reduce((sum, t) => sum + t, 0) / acknowledgeTimes.length)
      : null;

    const avg_time_formatted = avg_time_to_acknowledge
      ? `${Math.floor(avg_time_to_acknowledge / 60)}h ${avg_time_to_acknowledge % 60}m`
      : null;

    return {
      update_id: update.id,
      title: update.title,
      content: update.content,
      update_type: update.update_type,
      type: update.type,
      status: update.status,
      priority: update.priority,
      target_audience: update.target_audience,
      total_readers,
      acknowledged_count,
      dismissed_count,
      read_rate,
      acknowledgement_rate,
      avg_time_to_acknowledge: avg_time_formatted,
      created_at: update.created_at,
      published_at: update.published_at
    };
  });

  return metrics;
}

/**
 * Fetch readers for a specific update
 */
export async function fetchUpdateReaders(updateId: string): Promise<UpdateReader[]> {
  // Get all reads for this update
  const { data: reads, error: readsError } = await supabase
    .from('portal_update_reads')
    .select(`
      id,
      update_id,
      user_id,
      view_count,
      first_viewed_at,
      last_viewed_at,
      acknowledged_at,
      dismissed_at,
      time_to_acknowledge
    `)
    .eq('update_id', updateId)
    .order('first_viewed_at', { ascending: false });

  if (readsError) {
    console.error('Error fetching reads:', readsError);
    throw readsError;
  }

  if (!reads || reads.length === 0) {
    return [];
  }

  // Get update info
  const { data: update } = await supabase
    .from('portal_updates')
    .select('id, title')
    .eq('id', updateId)
    .single();

  // Get user info
  const userIds = [...new Set(reads.map(r => r.user_id))];
  const { data: users } = await supabase
    .from('user_acquisition_details')
    .select('user_id, email, first_name, last_name')
    .in('user_id', userIds);

  // Map reads with user data
  const readers: UpdateReader[] = reads.map(read => {
    const user = users?.find(u => u.user_id === read.user_id);

    // Format time to acknowledge
    let timeToAck = null;
    if (read.time_to_acknowledge) {
      const interval = read.time_to_acknowledge.toString();
      const parts = interval.split(':');
      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        if (hours > 24) {
          const days = Math.floor(hours / 24);
          const remainingHours = hours % 24;
          timeToAck = `${days}d ${remainingHours}h ${minutes}m`;
        } else {
          timeToAck = `${hours}h ${minutes}m`;
        }
      }
    }

    return {
      read_id: read.id,
      update_id: read.update_id,
      update_title: update?.title || 'Unknown Update',
      user_id: read.user_id,
      user_name: user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.first_name || user?.last_name || user?.email || 'Unknown User',
      user_email: user?.email || 'unknown@example.com',
      user_first_name: user?.first_name || null,
      user_last_name: user?.last_name || null,
      view_count: read.view_count,
      first_viewed_at: read.first_viewed_at,
      last_viewed_at: read.last_viewed_at,
      acknowledged_at: read.acknowledged_at,
      dismissed_at: read.dismissed_at,
      time_to_acknowledge: timeToAck
    };
  });

  return readers;
}

/**
 * Get status badge info for update status
 */
export function getUpdateStatusInfo(status: string | null | undefined): {
  label: string;
  color: string;
  icon: string;
} {
  if (!status) {
    return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: '❓' };
  }

  switch (status.toLowerCase()) {
    case 'published':
    case 'active':
      return { label: 'Published', color: 'bg-green-100 text-green-700', icon: '✓' };
    case 'draft':
      return { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: '📝' };
    case 'archived':
      return { label: 'Archived', color: 'bg-blue-100 text-blue-700', icon: '📦' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: '•' };
  }
}

/**
 * Get badge info for read status
 */
export function getReadStatusInfo(read: { acknowledged_at: string | null; dismissed_at: string | null }): {
  label: string;
  color: string;
  icon: string;
} {
  if (read.acknowledged_at) {
    return { label: 'Acknowledged', color: 'bg-green-100 text-green-700', icon: '✓' };
  } else if (read.dismissed_at) {
    return { label: 'Dismissed', color: 'bg-yellow-100 text-yellow-700', icon: '⊘' };
  } else {
    return { label: 'Read', color: 'bg-blue-100 text-blue-700', icon: '👁' };
  }
}

/**
 * Get priority badge info
 */
export function getPriorityInfo(priority: number): {
  label: string;
  color: string;
} {
  if (priority >= 3) {
    return { label: 'High', color: 'bg-red-100 text-red-700' };
  } else if (priority === 2) {
    return { label: 'Medium', color: 'bg-orange-100 text-orange-700' };
  } else {
    return { label: 'Low', color: 'bg-gray-100 text-gray-700' };
  }
}
