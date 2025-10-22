import { supabase } from '@/lib/supabase';
import { sendEventRegistrationNotification } from './unified-notifications.service';
import { 
  PortalEvent, 
  EventDate, 
  EventRegistration, 
  EventGuest,
  EventTemplate,
  EventFormData,
  RegistrationFormData,
  EventAnalytics 
} from '@/types/portal-events';

export class PortalEventsService {
  // Events CRUD
  static async getEvents(status?: string) {
    let query = supabase
      .from('portal_events')
      .select(`
        *,
        dates:portal_event_dates(*),
        creator:profiles!portal_events_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as PortalEvent[];
  }

  static async getEvent(id: string) {
    const { data, error } = await supabase
      .from('portal_events')
      .select(`
        *,
        dates:portal_event_dates(*),
        creator:profiles!portal_events_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Increment view count
    await supabase.rpc('increment_event_view_count', { event_id: id });
    
    return data as PortalEvent;
  }

  static async createEvent(eventData: EventFormData) {
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error('User not authenticated');
    }

    // Generate a unique slug from the title
    const generateSlug = (title: string, suffix: number = 0): string => {
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (suffix === 0) {
        return baseSlug;
      }
      return `${baseSlug}-${suffix}`;
    };

    // Try to create a unique slug
    let slug = generateSlug(eventData.title);
    let slugSuffix = 0;
    let isUnique = false;

    while (!isUnique) {
      const { data: existingEvent } = await supabase
        .from('portal_events')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existingEvent) {
        isUnique = true;
      } else {
        slugSuffix++;
        slug = generateSlug(eventData.title, slugSuffix);
      }
    }

    // Prepare event data with defaults
    const eventPayload = {
      title: eventData.title,
      slug: slug, // Add the unique slug
      description: eventData.description || null,
      type: eventData.type || 'in_person',
      max_guests_per_registration: eventData.max_guests_per_registration ?? 0,
      registration_deadline: eventData.registration_deadline?.toISOString() || null,
      is_private: eventData.is_private ?? false,
      location_name: eventData.location_name || null,
      location_address: eventData.location_address || null,
      location_url: eventData.location_url || null,
      video_platform: eventData.video_platform || null,
      video_url: eventData.video_url || null,
      video_meeting_id: eventData.video_meeting_id || null,
      video_passcode: eventData.video_passcode || null,
      status: 'draft', // Explicitly set status
      views_count: 0, // Initialize views count
      event_date: eventData.dates?.[0]?.start_time?.toISOString() || new Date().toISOString(), // Use first date or current date
      created_by: userData.user.id
    };

    console.log('Creating event with payload:', eventPayload);

    const { data: event, error: eventError } = await supabase
      .from('portal_events')
      .insert(eventPayload)
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      throw eventError;
    }

    // Create event dates
    if (eventData.dates && eventData.dates.length > 0) {
      const dates = eventData.dates.map(date => ({
        event_id: event.id,
        start_time: date.start_time.toISOString(),
        end_time: date.end_time.toISOString(),
        max_attendees: date.max_attendees
      }));

      const { error: datesError } = await supabase
        .from('portal_event_dates')
        .insert(dates);

      if (datesError) throw datesError;
    }

    return event;
  }

  static async updateEvent(id: string, eventData: Partial<EventFormData>) {
    const updateData: any = {};
    
    // Only add fields that are being updated
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.type !== undefined) updateData.type = eventData.type;
    if (eventData.max_guests_per_registration !== undefined) 
      updateData.max_guests_per_registration = eventData.max_guests_per_registration;
    if (eventData.registration_deadline !== undefined) 
      updateData.registration_deadline = eventData.registration_deadline?.toISOString();
    if (eventData.is_private !== undefined) updateData.is_private = eventData.is_private;
    
    // Location fields
    if (eventData.location_name !== undefined) updateData.location_name = eventData.location_name;
    if (eventData.location_address !== undefined) updateData.location_address = eventData.location_address;
    if (eventData.location_url !== undefined) updateData.location_url = eventData.location_url;
    
    // Video fields
    if (eventData.video_platform !== undefined) updateData.video_platform = eventData.video_platform;
    if (eventData.video_url !== undefined) updateData.video_url = eventData.video_url;
    if (eventData.video_meeting_id !== undefined) updateData.video_meeting_id = eventData.video_meeting_id;
    if (eventData.video_passcode !== undefined) updateData.video_passcode = eventData.video_passcode;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('portal_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEventStatus(id: string, status: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // If publishing, set published_at
    if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }
    // If unpublishing (setting to draft), clear published_at
    else if (status === 'draft') {
      updateData.published_at = null;
    }

    const { data, error } = await supabase
      .from('portal_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEvent(id: string) {
    const { error } = await supabase
      .from('portal_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Event Dates
  static async addEventDate(eventId: string, dateData: {
    start_time: Date;
    end_time: Date;
    max_attendees?: number;
  }) {
    const { data, error } = await supabase
      .from('portal_event_dates')
      .insert({
        event_id: eventId,
        start_time: dateData.start_time.toISOString(),
        end_time: dateData.end_time.toISOString(),
        max_attendees: dateData.max_attendees
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateEventDate(id: string, dateData: Partial<EventDate>) {
    const { data, error } = await supabase
      .from('portal_event_dates')
      .update(dateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEventDate(id: string) {
    const { error } = await supabase
      .from('portal_event_dates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Registrations
  static async registerForEvent(registrationData: RegistrationFormData) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('portal_event_registrations')
      .insert({
        event_id: (await this.getEventDateInfo(registrationData.event_date_id)).event_id,
        event_date_id: registrationData.event_date_id,
        user_id: user.id
      })
      .select()
      .single();

    if (regError) throw regError;

    // Add guests if any
    if (registrationData.guests && registrationData.guests.length > 0) {
      const guests = registrationData.guests.map(guest => ({
        registration_id: registration.id,
        first_name: guest.first_name,
        last_name: guest.last_name,
        email: guest.email
      }));

      const { error: guestsError } = await supabase
        .from('portal_event_guests')
        .insert(guests);

      if (guestsError) throw guestsError;
    }

    // Send registration notifications
    try {
      // Get event and user details for notification
      const eventDateInfo = await this.getEventDateInfo(registrationData.event_date_id);
      const { data: eventDetails } = await supabase
        .from('portal_events')
        .select('title, description, location, max_attendees')
        .eq('id', eventDateInfo.event_id)
        .single();

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, company_name')
        .eq('id', user.id)
        .single();

      // Get total registrations for this event
      const { count: totalRegistrations } = await supabase
        .from('portal_event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventDateInfo.event_id);

      if (eventDetails && userProfile) {
        const userName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || 'User';

        await sendEventRegistrationNotification({
          eventId: eventDateInfo.event_id,
          eventTitle: eventDetails.title,
          eventDate: new Date(eventDateInfo.start_datetime).toLocaleDateString(),
          eventTime: new Date(eventDateInfo.start_datetime).toLocaleTimeString(),
          eventLocation: eventDetails.location,
          eventDescription: eventDetails.description,
          userId: user.id,
          userEmail: userProfile.email,
          userName: userName,
          userCompany: userProfile.company_name,
          registrationDate: new Date().toISOString(),
          totalRegistrations: (totalRegistrations || 0) + 1, // +1 for current registration
          maxAttendees: eventDetails.max_attendees
        });
      }
    } catch (notificationError) {
      // Log notification errors but don't fail the registration
      console.error('Failed to send registration notification:', notificationError);
    }

    return registration;
  }

  static async cancelRegistration(registrationId: string) {
    const { data, error } = await supabase
      .from('portal_event_registrations')
      .update({ cancelled_at: new Date().toISOString() })
      .eq('id', registrationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserRegistrations() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('portal_event_registrations')
      .select(`
        *,
        event:portal_events(*),
        event_date:portal_event_dates(*),
        guests:portal_event_guests(*)
      `)
      .eq('user_id', user.id)
      .is('cancelled_at', null)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return data as EventRegistration[];
  }

  static async getEventRegistrations(eventId: string) {
    const { data, error } = await supabase
      .from('portal_event_registrations')
      .select(`
        *,
        event_date:portal_event_dates(*),
        guests:portal_event_guests(*),
        user:profiles(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('event_id', eventId)
      .order('registered_at', { ascending: false });

    if (error) throw error;
    return data as EventRegistration[];
  }

  // Templates
  static async getTemplates() {
    const { data, error } = await supabase
      .from('portal_event_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as EventTemplate[];
  }

  static async createFromTemplate(templateId: string, overrides?: Partial<EventFormData>) {
    const { data: template, error: templateError } = await supabase
      .from('portal_event_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    const eventData: EventFormData = {
      title: overrides?.title || template.default_title || '',
      description: overrides?.description || template.default_description || '',
      type: template.type,
      dates: overrides?.dates || [],
      max_guests_per_registration: overrides?.max_guests_per_registration || template.default_max_guests || 1,
      is_private: overrides?.is_private ?? true,
      location_name: overrides?.location_name || template.default_location_name,
      location_address: overrides?.location_address || template.default_location_address,
      video_platform: overrides?.video_platform || template.default_video_platform,
      ...overrides
    };

    return this.createEvent(eventData);
  }

  // Analytics
  static async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    // Get all registrations for the event
    const { data: registrations, error: regError } = await supabase
      .from('portal_event_registrations')
      .select(`
        *,
        event_date:portal_event_dates(*),
        guests:portal_event_guests(*)
      `)
      .eq('event_id', eventId);

    if (regError) throw regError;

    // Get event dates
    const { data: dates, error: datesError } = await supabase
      .from('portal_event_dates')
      .select('*')
      .eq('event_id', eventId)
      .order('start_time');

    if (datesError) throw datesError;

    // Calculate analytics
    const totalRegistrations = registrations?.length || 0;
    const totalAttendees = registrations?.filter(r => r.attended).length || 0;
    const totalGuests = registrations?.reduce((sum, r) => sum + (r.guests?.length || 0), 0) || 0;
    const attendanceRate = totalRegistrations > 0 ? (totalAttendees / totalRegistrations) * 100 : 0;

    // Dates summary
    const datesSummary = dates?.map(date => {
      const dateRegs = registrations?.filter(r => r.event_date_id === date.id) || [];
      const dateAttendees = dateRegs.filter(r => r.attended).length;
      const capacityUsed = date.max_attendees ? (date.current_attendees / date.max_attendees) * 100 : 0;

      return {
        date: date.start_time,
        registrations: dateRegs.length,
        attendees: dateAttendees,
        capacity_used: capacityUsed
      };
    }) || [];

    // Registration trend (group by date)
    const trendMap = new Map<string, number>();
    registrations?.forEach(reg => {
      const date = new Date(reg.registered_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    const registrationTrend = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_registrations: totalRegistrations,
      total_attendees: totalAttendees,
      total_guests: totalGuests,
      attendance_rate: attendanceRate,
      dates_summary: datesSummary,
      registration_trend: registrationTrend
    };
  }

  // Helper methods
  private static async getEventDateInfo(dateId: string) {
    const { data, error } = await supabase
      .from('portal_event_dates')
      .select('event_id')
      .eq('id', dateId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUpcomingEvents(limit = 5) {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('portal_events')
      .select(`
        *,
        dates:portal_event_dates(*)
      `)
      .eq('status', 'published')
      .gte('portal_event_dates.start_time', now)
      .order('portal_event_dates.start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as PortalEvent[];
  }
}