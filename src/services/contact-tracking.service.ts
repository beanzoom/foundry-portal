// ============================================================================
// Contact Tracking System - API Service Layer
// ============================================================================

import { supabase } from '@/lib/supabase';
import type {
  Market,
  Station,
  DSP,
  DSPLocation,
  Contact,
  Interaction,
  ContactFormData,
  InteractionFormData,
  ContactFilters,
  ContactAnalytics,
  PaginatedResponse,
} from '@/types/contact-tracking';

export class ContactTrackingService {
  // ============================================================================
  // MARKETS
  // ============================================================================

  async getMarkets(includeInactive = false): Promise<Market[]> {
    let query = supabase
      .from('markets')
      .select('*')
      .order('name');
    
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Return markets without counts for now - we'll get these separately if needed
    return data || [];
  }

  async getMarket(id: string): Promise<Market | null> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createMarket(market: Partial<Market>): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .insert({
        ...market,
        is_active: market.is_active ?? true, // Default to true if not specified
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateMarket(id: string, updates: Partial<Market>): Promise<Market> {
    const { data, error } = await supabase
      .from('markets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteMarket(id: string): Promise<void> {
    const { error } = await supabase
      .from('markets')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============================================================================
  // STATIONS
  // ============================================================================

  async getStations(marketId?: string, includeInactive = false): Promise<Station[]> {
    let query = supabase
      .from('stations')
      .select('*')
      .order('station_code');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch market data separately for each station
    const stationsWithMarkets = await Promise.all(
      (data || []).map(async (station) => {
        let market = null;
        if (station.market_id) {
          const { data: marketData } = await supabase
            .from('markets')
            .select('*')
            .eq('id', station.market_id)
            .single();
          market = marketData;
        }
        return { ...station, market };
      })
    );

    return stationsWithMarkets;
  }

  async getStation(id: string): Promise<Station | null> {
    const { data, error } = await supabase
      .from('stations')
      .select(`
        *,
        market:markets(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createStation(station: Partial<Station>): Promise<Station> {
    const { data, error } = await supabase
      .from('stations')
      .insert({
        ...station,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select(`
        *,
        market:markets(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createStationsBatch(stations: Partial<Station>[]): Promise<Station[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const stationsWithUser = stations.map(station => ({
      ...station,
      created_by: userId,
    }));
    
    const { data, error } = await supabase
      .from('stations')
      .insert(stationsWithUser)
      .select(`
        *,
        market:markets(*)
      `);
    
    if (error) throw error;
    return data || [];
  }

  async updateStation(id: string, updates: Partial<Station>): Promise<Station> {
    const { data, error } = await supabase
      .from('stations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        market:markets(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteStation(id: string): Promise<void> {
    const { error } = await supabase
      .from('stations')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============================================================================
  // DSPS
  // ============================================================================

  async getDSPs(includeInactive = false, stationId?: string): Promise<DSP[]> {
    let query = supabase
      .from('dsps')
      .select('*')
      .order('dsp_name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (stationId) {
      query = query.eq('station_id', stationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch related data separately for each DSP
    const dspsWithRelations = await Promise.all(
      (data || []).map(async (dsp) => {
        // Get station info if station_id exists
        let station = null;
        if (dsp.station_id) {
          const { data: stationData } = await supabase
            .from('stations')
            .select('*')
            .eq('id', dsp.station_id)
            .single();

          if (stationData) {
            // Get market for the station
            let market = null;
            if (stationData.market_id) {
              const { data: marketData } = await supabase
                .from('markets')
                .select('*')
                .eq('id', stationData.market_id)
                .single();
              market = marketData;
            }
            station = { ...stationData, market };
          }
        }

        // Get location count
        const { count: locationCount } = await supabase
          .from('dsp_locations')
          .select('*', { count: 'exact', head: true })
          .eq('dsp_id', dsp.id)
          .eq('is_active', true);

        return {
          ...dsp,
          station,
          contact_count: 0,
          location_count: locationCount || 0
        };
      })
    );

    return dspsWithRelations;
  }

  async getDSP(id: string): Promise<DSP | null> {
    const { data, error } = await supabase
      .from('dsps')
      .select(`
        *,
        station:stations(
          *,
          market:markets(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getDSPWithLocations(dspId: string): Promise<DSP | null> {
    const { data: dsp, error: dspError } = await supabase
      .from('dsps')
      .select('*')
      .eq('id', dspId)
      .single();
    
    if (dspError) throw dspError;
    if (!dsp) return null;
    
    // Fetch locations directly from table instead of RPC for now
    const { data: locations, error: locError } = await supabase
      .from('dsp_locations')
      .select(`
        *,
        station:stations(
          *,
          market:markets(*)
        )
      `)
      .eq('dsp_id', dspId)
      .eq('is_active', true);
    
    if (locError) {
      console.error('Error fetching DSP locations:', locError);
      // Return DSP without locations if query fails
      return dsp;
    }
    
    // Transform locations to expected format
    const transformedLocations = (locations || []).map(loc => ({
      ...loc,
      station_code: loc.station?.station_code,
      market_name: loc.station?.market?.name
    }));
    
    return {
      ...dsp,
      locations: transformedLocations,
      location_count: transformedLocations.length
    };
  }

  async addDSPLocation(dspId: string, stationId: string, isPrimary = false): Promise<string> {
    // If setting as primary, unset other primaries first
    if (isPrimary) {
      await supabase
        .from('dsp_locations')
        .update({ is_primary: false })
        .eq('dsp_id', dspId)
        .eq('is_primary', true);
        
      await supabase
        .from('dsps')
        .update({ primary_station_id: stationId })
        .eq('id', dspId);
    }
    
    // Insert or update the location
    const { data, error } = await supabase
      .from('dsp_locations')
      .upsert({
        dsp_id: dspId,
        station_id: stationId,
        is_primary: isPrimary,
        is_active: true
      }, {
        onConflict: 'dsp_id,station_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data.id;
  }

  async removeDSPLocation(dspId: string, locationId: string): Promise<void> {
    const { error } = await supabase
      .from('dsp_locations')
      .update({ is_active: false })
      .eq('id', locationId)
      .eq('dsp_id', dspId);
    
    if (error) throw error;
  }

  async getDSPContacts(dspId: string, locationId?: string): Promise<Contact[]> {
    let query = supabase
      .from('contacts')
      .select(`
        *,
        dsp:dsps(*),
        station:stations(*),
        market:markets(*)
      `)
      .eq('dsp_id', dspId)
      .eq('is_active', true);
    
    // If specific location provided, filter by it
    if (locationId) {
      const { data: location } = await supabase
        .from('dsp_locations')
        .select('station_id')
        .eq('id', locationId)
        .single();
        
      if (location) {
        query = query.eq('station_id', location.station_id);
      }
    }
    
    const { data, error } = await query.order('last_name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createDSP(dsp: Partial<DSP> & { location_ids?: string[] }): Promise<DSP> {
    const { location_ids, ...dspData } = dsp;
    
    // Create the DSP
    const { data: newDSP, error: dspError } = await supabase
      .from('dsps')
      .insert({
        ...dspData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select(`
        *,
        station:stations(
          *,
          market:markets(*)
        )
      `)
      .single();
    
    if (dspError) throw dspError;
    
    // Add locations if provided
    if (location_ids && location_ids.length > 0) {
      for (let i = 0; i < location_ids.length; i++) {
        await this.addDSPLocation(
          newDSP.id, 
          location_ids[i], 
          i === 0 // First location is primary
        );
      }
    }
    
    return newDSP;
  }

  async updateDSP(id: string, updates: Partial<DSP> & { location_ids?: string[] }): Promise<DSP> {
    const { location_ids, ...dspUpdates } = updates;
    
    // Update DSP data
    const { data, error } = await supabase
      .from('dsps')
      .update(dspUpdates)
      .eq('id', id)
      .select(`
        *,
        station:stations(
          *,
          market:markets(*)
        )
      `)
      .single();
    
    if (error) throw error;
    
    // Update locations if provided
    if (location_ids !== undefined) {
      // Deactivate all current locations
      await supabase
        .from('dsp_locations')
        .update({ is_active: false })
        .eq('dsp_id', id);
      
      // Add/reactivate new locations
      for (let i = 0; i < location_ids.length; i++) {
        await this.addDSPLocation(
          id,
          location_ids[i],
          i === 0 // First location is primary
        );
      }
    }
    
    return data;
  }

  async deleteDSP(id: string): Promise<void> {
    const { error } = await supabase
      .from('dsps')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============================================================================
  // CONTACTS
  // ============================================================================

  async getContacts(
    filters?: ContactFilters,
    page = 1,
    perPage = 50
  ): Promise<PaginatedResponse<Contact>> {
    // Fetch contacts with basic data first (no relationships since FKs aren't set up)
    let query = supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('is_active', true);
    
    // Apply filters
    if (filters?.search) {
      // Use the search function for full-text search
      const { data: searchResults, error: searchError } = await supabase
        .rpc('search_contacts', {
          search_query: filters.search,
          p_market_id: filters.market_id || null,
          p_station_id: filters.station_id || null,
          p_dsp_id: filters.dsp_id || null,
          p_status: filters.status || null,
          p_limit: perPage,
          p_offset: (page - 1) * perPage,
        });
      
      if (searchError) throw searchError;
      
      // Get total count for search results
      const { data: totalCount, error: countError } = await supabase
        .rpc('count_search_contacts', {
          search_query: filters.search,
          p_market_id: filters.market_id || null,
          p_station_id: filters.station_id || null,
          p_dsp_id: filters.dsp_id || null,
          p_status: filters.status || null,
        });
      
      if (countError) {
        console.error('Error getting search count:', countError);
      }
      
      // Transform flat search results to match expected Contact structure
      const transformedResults = (searchResults || []).map((result: any) => ({
        ...result,
        dsp: result.dsp_id ? {
          id: result.dsp_id,
          dsp_name: result.dsp_name,
          dsp_code: result.dsp_code || result.dsp_name // Fallback to name if code not available
        } : null,
        market: result.market_id ? {
          id: result.market_id,
          name: result.market_name
        } : null,
        station: result.station_id ? {
          id: result.station_id,
          station_code: result.station_code
        } : null
      }));
      
      const total = totalCount || searchResults?.length || 0;
      
      return {
        data: transformedResults,
        meta: {
          total,
          page,
          per_page: perPage,
          pages: Math.ceil(total / perPage),
        },
      };
    }
    
    // Standard filtering without search
    if (filters?.market_id) query = query.eq('market_id', filters.market_id);
    if (filters?.station_id) query = query.eq('station_id', filters.station_id);
    if (filters?.dsp_id) query = query.eq('dsp_id', filters.dsp_id);
    if (filters?.status) query = query.eq('contact_status', filters.status);
    if (filters?.title) query = query.eq('title', filters.title);
    if (filters?.referred_by) query = query.eq('referred_by_contact_id', filters.referred_by);
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    if (filters?.has_interactions !== undefined) {
      if (filters.has_interactions) {
        query = query.gt('interaction_count', 0);
      } else {
        query = query.eq('interaction_count', 0);
      }
    }
    
    if (filters?.last_contacted_after) {
      query = query.gte('last_contacted_at', filters.last_contacted_after);
    }
    
    if (filters?.last_contacted_before) {
      query = query.lte('last_contacted_at', filters.last_contacted_before);
    }
    
    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    query = query
      .range(from, to)
      .order('created_at', { ascending: false });
    
    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch related data separately for each contact
    const enrichedContacts = await Promise.all(
      (data || []).map(async (contact) => {
        // Get interaction count
        const { count: interactionCount } = await supabase
          .from('interactions')
          .select('*', { count: 'exact', head: true })
          .eq('contact_id', contact.id);

        // Get DSP info if dsp_id exists
        let dsp = null;
        if (contact.dsp_id) {
          const { data: dspData } = await supabase
            .from('dsps')
            .select('id, dsp_code, dsp_name')
            .eq('id', contact.dsp_id)
            .single();
          dsp = dspData;
        }

        // Get station info if station_id exists
        let station = null;
        if (contact.station_id) {
          const { data: stationData } = await supabase
            .from('stations')
            .select('id, station_code')
            .eq('id', contact.station_id)
            .single();
          station = stationData;
        }

        // Get market info if market_id exists
        let market = null;
        if (contact.market_id) {
          const { data: marketData } = await supabase
            .from('markets')
            .select('id, name')
            .eq('id', contact.market_id)
            .single();
          market = marketData;
        }

        return {
          ...contact,
          interaction_count: interactionCount || 0,
          dsp,
          station,
          market,
        };
      })
    );

    return {
      data: enrichedContacts,
      meta: {
        total: count || 0,
        page,
        per_page: perPage,
        pages: Math.ceil((count || 0) / perPage),
      },
    };
  }

  async getContactDSPLocations(contactId: string): Promise<DSPLocation[]> {
    const { data, error } = await supabase
      .from('contact_dsp_locations')
      .select(`
        *,
        dsp_location:dsp_locations(
          *,
          station:stations(
            *,
            market:markets(*)
          )
        )
      `)
      .eq('contact_id', contactId)
      .eq('dsp_location.is_active', true);
    
    if (error) throw error;
    
    return (data || []).map(item => ({
      ...item.dsp_location,
      station_code: item.dsp_location?.station?.station_code,
      market_name: item.dsp_location?.station?.market?.name
    }));
  }

  async getContact(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        dsp:dsps(id, dsp_code, dsp_name),
        station:stations(id, station_code),
        market:markets(id, name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Fetch interactions separately
    if (data) {
      const { data: interactions } = await this.getInteractions(id);
      data.interactions = interactions;
    }
    
    return data;
  }

  async createContact(contact: ContactFormData): Promise<Contact> {
    const { dsp_location_ids, ...contactData } = contact;
    
    const insertData = {
      ...contactData,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    };
    console.log('Creating contact with data:', insertData);
    
    const { data, error } = await supabase
      .from('contacts')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
    
    // Add DSP location associations if provided
    if (dsp_location_ids && dsp_location_ids.length > 0) {
      const locationAssociations = dsp_location_ids.map((locationId, index) => ({
        contact_id: data.id,
        dsp_location_id: locationId,
        is_primary: index === 0
      }));
      
      const { error: locError } = await supabase
        .from('contact_dsp_locations')
        .insert(locationAssociations);
      
      if (locError) {
        console.error('Error adding contact DSP locations:', locError);
      }
    }
    
    // Fetch the full contact with relations
    const fullContact = await this.getContact(data.id);
    if (!fullContact) throw new Error('Contact created but not found');
    
    return fullContact;
  }

  async updateContact(id: string, updates: Partial<ContactFormData>): Promise<Contact> {
    const { dsp_location_ids, ...contactUpdates } = updates;
    
    const { data, error } = await supabase
      .from('contacts')
      .update(contactUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update DSP location associations if provided
    if (dsp_location_ids !== undefined) {
      // Remove existing associations
      await supabase
        .from('contact_dsp_locations')
        .delete()
        .eq('contact_id', id);
      
      // Add new associations
      if (dsp_location_ids.length > 0) {
        const locationAssociations = dsp_location_ids.map((locationId, index) => ({
          contact_id: id,
          dsp_location_id: locationId,
          is_primary: index === 0
        }));
        
        const { error: locError } = await supabase
          .from('contact_dsp_locations')
          .insert(locationAssociations);
        
        if (locError) {
          console.error('Error updating contact DSP locations:', locError);
        }
      }
    }
    
    // Fetch the full contact with relations
    const fullContact = await this.getContact(data.id);
    if (!fullContact) throw new Error('Contact updated but not found');
    
    return fullContact;
  }

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }

  async searchContacts(query: string, limit = 10): Promise<Contact[]> {
    const { data, error } = await supabase
      .rpc('search_contacts', {
        search_query: query,
        p_limit: limit,
      });
    
    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  async getInteractions(contactId: string): Promise<Interaction[]> {
    const { data, error } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createInteraction(interaction: InteractionFormData): Promise<Interaction> {
    const { data, error } = await supabase
      .from('interactions')
      .insert({
        ...interaction,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Fetch full interaction with user info
    const { data: fullInteraction } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('id', data.id)
      .single();
    
    return fullInteraction || data;
  }

  async updateInteraction(id: string, updates: Partial<InteractionFormData>): Promise<Interaction> {
    const { data, error } = await supabase
      .from('interactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteInteraction(id: string): Promise<void> {
    const { error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  async getContactAnalytics(): Promise<ContactAnalytics> {
    const { data, error } = await supabase
      .rpc('get_contact_analytics');
    
    if (error) throw error;
    return data as ContactAnalytics;
  }

  async getHierarchyView(): Promise<any[]> {
    const { data, error } = await supabase
      .from('hierarchy_view')
      .select('*')
      .order('market_name, station_code, dsp_name');
    
    if (error) throw error;
    return data || [];
  }

  async getTopReferrers(limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('top_referrers')
      .select('*')
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkUpdateContacts(
    contactIds: string[],
    updates: Partial<ContactFormData>
  ): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update(updates)
      .in('id', contactIds);
    
    if (error) throw error;
  }

  async bulkDeleteContacts(contactIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .update({ is_active: false })
      .in('id', contactIds);
    
    if (error) throw error;
  }
}

// Export singleton instance
export const contactTrackingService = new ContactTrackingService();