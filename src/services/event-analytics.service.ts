import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export interface EventMetrics {
  event_id: string;
  title: string;
  description: string | null;
  status: string | null;
  event_date: string;
  start_datetime: string;
  end_datetime: string;
  type: string;
  location: string | null;
  virtual_link: string | null;
  registration_required: boolean;
  registration_limit: number | null;
  total_registrations: number;
  attended_count: number;
  cancelled_count: number;
  no_show_count: number;
  attendance_rate: number;
  capacity_percentage: number | null;
  created_at: string;
  published_at: string | null;
}

export interface EventRegistration {
  registration_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string | null;
  attendance_status: string;
  payment_status: string | null;
  payment_amount: number | null;
  registered_at: string;
  check_in_time: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  guest_count: number;
}

export interface EventRegistrationDetail {
  registration_id: string;
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_first_name: string | null;
  user_last_name: string | null;
  attendance_status: string;
  payment_status: string | null;
  payment_amount: number | null;
  registered_at: string;
  check_in_time: string | null;
  attended_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
}

/**
 * Fetch all event metrics
 */
export async function fetchAllEventMetrics(): Promise<EventMetrics[]> {
  // Get all events
  const { data: events, error: eventsError } = await supabase
    .from('portal_events')
    .select('id, title, description, status, event_date, start_datetime, end_datetime, type, location, virtual_link, registration_required, registration_limit, created_at, published_at')
    .order('event_date', { ascending: false });

  if (eventsError) {
    console.error('Error fetching events:', eventsError);
    throw eventsError;
  }

  if (!events || events.length === 0) {
    return [];
  }

  const eventIds = events.map(e => e.id);

  // Get registration counts for all events
  const { data: registrations, error: registrationsError } = await supabase
    .from('portal_event_registrations')
    .select('event_id, attendance_status, attended_at')
    .in('event_id', eventIds);

  if (registrationsError) {
    console.error('Error fetching registrations:', registrationsError);
    // Don't throw - just use empty array
  }

  // Calculate metrics for each event
  const metrics: EventMetrics[] = events.map(event => {
    const eventRegistrations = registrations?.filter(r => r.event_id === event.id) || [];

    const total_registrations = eventRegistrations.length;
    const attended_count = eventRegistrations.filter(r => r.attendance_status === 'attended' || r.attended_at).length;
    const cancelled_count = eventRegistrations.filter(r => r.attendance_status === 'cancelled').length;
    const no_show_count = eventRegistrations.filter(r => r.attendance_status === 'no_show').length;

    const attendance_rate = total_registrations > 0
      ? Math.round((attended_count / total_registrations) * 100)
      : 0;

    const capacity_percentage = event.registration_limit
      ? Math.round((total_registrations / event.registration_limit) * 100)
      : null;

    return {
      event_id: event.id,
      title: event.title,
      description: event.description,
      status: event.status,
      event_date: event.event_date,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      type: event.type,
      location: event.location,
      virtual_link: event.virtual_link,
      registration_required: event.registration_required,
      registration_limit: event.registration_limit,
      total_registrations,
      attended_count,
      cancelled_count,
      no_show_count,
      attendance_rate,
      capacity_percentage,
      created_at: event.created_at,
      published_at: event.published_at
    };
  });

  return metrics;
}

/**
 * Fetch registrations for a specific event
 */
export async function fetchEventRegistrations(eventId: string): Promise<EventRegistrationDetail[]> {
  // Get all registrations for this event
  const { data: registrations, error: registrationsError } = await supabase
    .from('portal_event_registrations')
    .select(`
      id,
      event_id,
      user_id,
      attendance_status,
      payment_status,
      payment_amount,
      registered_at,
      check_in_time,
      attended_at,
      cancelled_at,
      cancellation_reason,
      notes
    `)
    .eq('event_id', eventId)
    .order('registered_at', { ascending: false });

  if (registrationsError) {
    console.error('Error fetching registrations:', registrationsError);
    throw registrationsError;
  }

  if (!registrations || registrations.length === 0) {
    return [];
  }

  // Get event info
  const { data: event } = await supabase
    .from('portal_events')
    .select('id, title')
    .eq('id', eventId)
    .single();

  // Get user info
  const userIds = [...new Set(registrations.map(r => r.user_id))];
  const { data: users } = await supabase
    .from('user_acquisition_details')
    .select('user_id, email, first_name, last_name')
    .in('user_id', userIds);

  // Map registrations with user data
  const details: EventRegistrationDetail[] = registrations.map(registration => {
    const user = users?.find(u => u.user_id === registration.user_id);

    return {
      registration_id: registration.id,
      event_id: registration.event_id,
      event_title: event?.title || 'Unknown Event',
      user_id: registration.user_id,
      user_name: user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.first_name || user?.last_name || user?.email || 'Unknown User',
      user_email: user?.email || 'unknown@example.com',
      user_first_name: user?.first_name || null,
      user_last_name: user?.last_name || null,
      attendance_status: registration.attendance_status,
      payment_status: registration.payment_status,
      payment_amount: registration.payment_amount,
      registered_at: registration.registered_at,
      check_in_time: registration.check_in_time,
      attended_at: registration.attended_at,
      cancelled_at: registration.cancelled_at,
      cancellation_reason: registration.cancellation_reason,
      notes: registration.notes
    };
  });

  return details;
}

/**
 * Get status badge info for event status
 */
export function getEventStatusInfo(status: string | null | undefined): {
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
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '✗' };
    case 'completed':
      return { label: 'Completed', color: 'bg-blue-100 text-blue-700', icon: '✓' };
    case 'upcoming':
      return { label: 'Upcoming', color: 'bg-purple-100 text-purple-700', icon: '📅' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: '•' };
  }
}

/**
 * Get status badge info for attendance status
 */
export function getAttendanceStatusInfo(status: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status.toLowerCase()) {
    case 'attended':
      return { label: 'Attended', color: 'bg-green-100 text-green-700', icon: '✓' };
    case 'registered':
      return { label: 'Registered', color: 'bg-blue-100 text-blue-700', icon: '📝' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '✗' };
    case 'no_show':
    case 'no-show':
      return { label: 'No Show', color: 'bg-yellow-100 text-yellow-700', icon: '⚠' };
    case 'waitlist':
      return { label: 'Waitlist', color: 'bg-orange-100 text-orange-700', icon: '⏳' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700', icon: '•' };
  }
}
