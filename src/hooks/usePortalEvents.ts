import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Hook to get count of upcoming events
export function useUpcomingEventsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['upcoming-events-count'],
    queryFn: async () => {
      const now = new Date().toISOString();

      // Get all upcoming published events
      const { data: events, error } = await supabase
        .from('portal_events')
        .select('id')
        .eq('status', 'published')
        .gte('event_date', now) // Only future events
        .order('event_date', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return 0;
      }

      return events?.length || 0;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to get events the user hasn't registered for yet
export function useUnregisteredEventsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unregistered-events-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const now = new Date().toISOString();

      // Get all upcoming published events
      const { data: events, error: eventsError } = await supabase
        .from('portal_events')
        .select('id')
        .eq('status', 'published')
        .gte('event_date', now);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return 0;
      }

      if (!events || events.length === 0) return 0;

      // Get user's registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id)
        .in('status', ['registered', 'attended']);

      if (regError) {
        console.error('Error fetching registrations:', regError);
        return events.length;
      }

      // Calculate unregistered events
      const registeredEventIds = new Set(registrations?.map(r => r.event_id) || []);
      const unregisteredEvents = events.filter(e => !registeredEventIds.has(e.id));

      return unregisteredEvents.length;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook to get all events with registration status
export function usePortalEvents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portal-events', user?.id],
    queryFn: async () => {
      // Get all published events
      const { data: events, error: eventsError } = await supabase
        .from('portal_events')
        .select('*')
        .eq('status', 'published')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      if (!events || !user) return events || [];

      // Get user's registrations
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations')
        .select('event_id, status, registered_at')
        .eq('user_id', user.id);

      if (regError) throw regError;

      // Map registrations by event_id
      const registrationMap = new Map(
        registrations?.map(r => [r.event_id, r]) || []
      );

      // Add registration status to each event
      const now = new Date().toISOString();
      return events.map(event => ({
        ...event,
        is_registered: registrationMap.has(event.id),
        registration_status: registrationMap.get(event.id)?.status || null,
        registered_at: registrationMap.get(event.id)?.registered_at || null,
        is_upcoming: event.event_date >= now,
        is_past: event.event_date < now
      }));
    },
    enabled: !!user
  });
}