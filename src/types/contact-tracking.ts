// ============================================================================
// Contact Tracking System - Type Definitions
// ============================================================================

// Enum types matching database
export type ContactTitle = 'Owner' | 'Ops' | 'Dispatch';
export type InteractionType = 'call' | 'email' | 'in-person' | 'other';
export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'active' | 'inactive';

// Region entity
export interface Region {
  id: string;
  code: string;
  name: string;
  states: string[];
  divisions?: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

// Market entity
export interface Market {
  id: string;
  name: string;
  description?: string;
  region_id?: string;
  region?: Region;
  states?: string[];
  primary_state?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Computed fields from views
  station_count?: number;
  dsp_count?: number;
  contact_count?: number;
}

// Station entity
export interface Station {
  id: string;
  market_id?: string;
  market?: Market;
  station_code: string;
  city?: string;
  state?: string;
  zip?: string;
  full_address?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Computed fields
  dsp_count?: number;
  contact_count?: number;
}

// DSP (Delivery Service Partner) entity
export interface DSP {
  id: string;
  station_id?: string;  // Legacy: primary station
  station?: Station;
  dsp_code?: string;
  dsp_name: string;
  website?: string;  // New field
  notes?: string;    // New field
  primary_station_id?: string;  // New field
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Computed fields
  contact_count?: number;
  location_count?: number;  // New field
  locations?: DSPLocation[];  // New field
}

// DSP Location entity
export interface DSPLocation {
  id: string;
  dsp_id: string;
  station_id: string;
  station?: Station;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Display fields
  station_code?: string;
  market_name?: string;
}

// Contact-DSP-Location association
export interface ContactDSPLocation {
  id: string;
  contact_id: string;
  dsp_location_id: string;
  dsp_location?: DSPLocation;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Contact entity
export interface Contact {
  id: string;
  // Optional hierarchy (legacy fields maintained for compatibility)
  dsp_id?: string;
  station_id?: string;
  market_id?: string;
  dsp?: DSP;
  station?: Station;
  market?: Market;
  // New multi-location support
  dsp_locations?: DSPLocation[];
  contact_dsp_locations?: ContactDSPLocation[];
  // Contact info
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  title?: ContactTitle;
  // Referral
  referred_by_contact_id?: string;
  referred_by_text?: string;
  referred_by?: Contact;
  // Metadata
  tags?: string[];
  notes?: string;
  last_contacted_at?: string;
  contact_status?: ContactStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  // Computed fields
  full_name?: string;
  display_name?: string;
  interactions?: Interaction[];
  interaction_count?: number;
  last_interaction_date?: string;
  created_by_email?: string;
  created_by_name?: string;
  referred_by_name?: string;
}

// Interaction entity
export interface Interaction {
  id: string;
  contact_id: string;
  contact?: Contact;
  interaction_type: InteractionType;
  details: string;
  interaction_date: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  created_by_email?: string;
  created_by_name?: string;
  contact_name?: string;
  contact_email?: string;
}

// Form input types
export interface ContactFormData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  title?: ContactTitle;
  dsp_id?: string;
  station_id?: string;
  market_id?: string;
  dsp_location_ids?: string[];  // New field for multi-location selection
  referred_by_contact_id?: string;
  referred_by_text?: string;
  tags?: string[];
  notes?: string;
  contact_status?: ContactStatus;
}

// DSP form data
export interface DSPFormData {
  dsp_code?: string;
  dsp_name: string;
  website?: string;
  notes?: string;
  primary_station_id?: string;
  location_ids?: string[];  // Station IDs for locations
}

export interface InteractionFormData {
  contact_id: string;
  interaction_type: InteractionType;
  details: string;
}

// Filter types
export interface ContactFilters {
  search?: string;
  market_id?: string;
  station_id?: string;
  dsp_id?: string;
  title?: ContactTitle;
  status?: ContactStatus;
  tags?: string[];
  has_interactions?: boolean;
  last_contacted_after?: string;
  last_contacted_before?: string;
  referred_by?: string;
}

// Analytics types
export interface ContactAnalytics {
  summary: {
    total_contacts: number;
    total_markets: number;
    total_stations: number;
    total_dsps: number;
    total_interactions: number;
  };
  contacts_by_status: Record<string, number>;
  contacts_by_title: Record<string, number>;
  interactions_by_type: Record<string, number>;
  recent_activity: Array<{
    date: string;
    new_contacts: number;
    interactions: number;
  }>;
  conversion_funnel: {
    new: number;
    contacted: number;
    qualified: number;
    active: number;
    new_to_contacted: number;
    contacted_to_qualified: number;
    qualified_to_active: number;
  };
}

// Hierarchy node for tree view
export interface HierarchyNode {
  id: string;
  type: 'market' | 'station' | 'dsp' | 'contact';
  label: string;
  data: Market | Station | DSP | Contact;
  children?: HierarchyNode[];
  count?: number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    pages: number;
  };
}

// Import/Export types
export interface ImportOptions {
  duplicate_handling: 'skip' | 'update' | 'create';
  create_missing_dsps?: boolean;
  default_status?: ContactStatus;
}

export interface ImportResult {
  import_id: string;
  status: 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json';
  filters?: ContactFilters;
  fields?: string[];
}