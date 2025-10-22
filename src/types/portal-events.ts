// Portal Events System Types

export type EventType = 'in_person' | 'video_call';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface PortalEvent {
  id: string;
  title: string;
  slug?: string; // URL-friendly identifier
  description?: string; // HTML content
  type: EventType;
  status: EventStatus;
  
  // Configuration
  max_guests_per_registration: number;
  registration_deadline?: string;
  is_private: boolean;
  
  // Location (for in-person)
  location_name?: string;
  location_address?: string;
  location_url?: string;
  
  // Video (for video calls)
  video_platform?: string;
  video_url?: string;
  video_meeting_id?: string;
  video_passcode?: string;
  
  // Analytics
  views_count: number;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Relations (when joined)
  dates?: EventDate[];
  registration_count?: number;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface EventDate {
  id: string;
  event_id: string;
  start_time: string;
  end_time: string;
  max_attendees?: number;
  current_attendees: number;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  event_date_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  cancelled_at?: string;
  
  // Relations
  event?: PortalEvent;
  event_date?: EventDate;
  guests?: EventGuest[];
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface EventGuest {
  id: string;
  registration_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  created_at: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  description?: string;
  type: EventType;
  
  // Defaults
  default_title?: string;
  default_description?: string;
  default_duration_hours: number;
  default_max_guests: number;
  default_location_name?: string;
  default_location_address?: string;
  default_video_platform?: string;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Form types for creating/editing
export interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  dates: {
    start_time: Date;
    end_time: Date;
    max_attendees?: number;
  }[];
  max_guests_per_registration: number;
  registration_deadline?: Date;
  is_private: boolean;
  
  // Location fields
  location_name?: string;
  location_address?: string;
  location_url?: string;
  
  // Video fields
  video_platform?: string;
  video_url?: string;
  video_meeting_id?: string;
  video_passcode?: string;
}

export interface RegistrationFormData {
  event_date_id: string;
  guests: {
    first_name: string;
    last_name: string;
    email?: string;
  }[];
}

// Analytics types
export interface EventAnalytics {
  total_registrations: number;
  total_attendees: number;
  total_guests: number;
  attendance_rate: number;
  dates_summary: {
    date: string;
    registrations: number;
    attendees: number;
    capacity_used: number;
  }[];
  registration_trend: {
    date: string;
    count: number;
  }[];
}