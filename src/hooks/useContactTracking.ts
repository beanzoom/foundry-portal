// ============================================================================
// Contact Tracking System - React Hooks
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { contactTrackingService } from '@/services/contact-tracking.service';
import type {
  Market,
  Station,
  DSP,
  Contact,
  Interaction,
  ContactFormData,
  InteractionFormData,
  ContactFilters,
  ContactAnalytics,
  PaginatedResponse,
} from '@/types/contact-tracking';

// ============================================================================
// MARKETS HOOK
// ============================================================================

export function useMarkets(includeInactive = false) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getMarkets(includeInactive);
      setMarkets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load markets';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [includeInactive, toast]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const createMarket = useCallback(async (market: Partial<Market>) => {
    try {
      const newMarket = await contactTrackingService.createMarket(market);
      setMarkets(prev => [...prev, newMarket]);
      toast({
        title: 'Success',
        description: 'Market created successfully',
      });
      return newMarket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create market';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const updateMarket = useCallback(async (id: string, updates: Partial<Market>) => {
    try {
      const updated = await contactTrackingService.updateMarket(id, updates);
      setMarkets(prev => prev.map(m => m.id === id ? updated : m));
      toast({
        title: 'Success',
        description: 'Market updated successfully',
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update market';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const deleteMarket = useCallback(async (id: string) => {
    try {
      await contactTrackingService.deleteMarket(id);
      setMarkets(prev => prev.filter(m => m.id !== id));
      toast({
        title: 'Success',
        description: 'Market deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete market';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    markets,
    loading,
    error,
    createMarket,
    updateMarket,
    deleteMarket,
    refetch: fetchMarkets,
  };
}

// ============================================================================
// STATIONS HOOK
// ============================================================================

export function useStations(marketId?: string, includeInactive = false) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getStations(marketId, includeInactive);
      setStations(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stations';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [marketId, includeInactive, toast]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const createStation = useCallback(async (station: Partial<Station>) => {
    try {
      const newStation = await contactTrackingService.createStation(station);
      setStations(prev => [...prev, newStation]);
      toast({
        title: 'Success',
        description: 'Station created successfully',
      });
      return newStation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create station';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const updateStation = useCallback(async (id: string, updates: Partial<Station>) => {
    try {
      const updated = await contactTrackingService.updateStation(id, updates);
      setStations(prev => prev.map(s => s.id === id ? updated : s));
      toast({
        title: 'Success',
        description: 'Station updated successfully',
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update station';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const deleteStation = useCallback(async (id: string) => {
    try {
      await contactTrackingService.deleteStation(id);
      setStations(prev => prev.filter(s => s.id !== id));
      toast({
        title: 'Success',
        description: 'Station deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete station';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    stations,
    loading,
    error,
    createStation,
    updateStation,
    deleteStation,
    refetch: fetchStations,
  };
}

// ============================================================================
// DSPS HOOK
// ============================================================================

export function useDSPs(includeInactive = false, stationId?: string) {
  const [dsps, setDSPs] = useState<DSP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDSPs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getDSPs(includeInactive, stationId);
      setDSPs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load DSPs';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [stationId, includeInactive, toast]);

  useEffect(() => {
    fetchDSPs();
  }, [fetchDSPs]);

  const createDSP = useCallback(async (dsp: Partial<DSP>) => {
    try {
      const newDSP = await contactTrackingService.createDSP(dsp);
      setDSPs(prev => [...prev, newDSP]);
      toast({
        title: 'Success',
        description: 'DSP created successfully',
      });
      return newDSP;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create DSP';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const updateDSP = useCallback(async (id: string, updates: Partial<DSP>) => {
    try {
      const updated = await contactTrackingService.updateDSP(id, updates);
      setDSPs(prev => prev.map(d => d.id === id ? updated : d));
      toast({
        title: 'Success',
        description: 'DSP updated successfully',
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update DSP';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const deleteDSP = useCallback(async (id: string) => {
    try {
      await contactTrackingService.deleteDSP(id);
      setDSPs(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Success',
        description: 'DSP deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete DSP';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    dsps,
    loading,
    error,
    createDSP,
    updateDSP,
    deleteDSP,
    refetch: fetchDSPs,
  };
}

// ============================================================================
// CONTACTS HOOK
// ============================================================================

export function useContacts(initialFilters?: ContactFilters) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContactFilters>(initialFilters || {});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contactTrackingService.getContacts(filters, page, perPage);
      setContacts(response.data);
      setTotalCount(response.meta.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contacts';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, perPage, toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = useCallback(async (contact: ContactFormData) => {
    try {
      const newContact = await contactTrackingService.createContact(contact);
      setContacts(prev => [newContact, ...prev]);
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
      return newContact;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create contact';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const updateContact = useCallback(async (id: string, updates: Partial<ContactFormData>) => {
    try {
      const updated = await contactTrackingService.updateContact(id, updates);
      setContacts(prev => prev.map(c => c.id === id ? updated : c));
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      await contactTrackingService.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Success',
        description: 'Contact deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete contact';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const searchContacts = useCallback(async (query: string) => {
    try {
      const results = await contactTrackingService.searchContacts(query);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  return {
    contacts,
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    refetch: fetchContacts,
  };
}

// ============================================================================
// INTERACTIONS HOOK
// ============================================================================

export function useInteractions(contactId: string) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInteractions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getInteractions(contactId);
      setInteractions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load interactions';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [contactId, toast]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const createInteraction = useCallback(async (interaction: Omit<InteractionFormData, 'contact_id'>) => {
    try {
      const newInteraction = await contactTrackingService.createInteraction({
        ...interaction,
        contact_id: contactId,
      });
      setInteractions(prev => [newInteraction, ...prev]);
      toast({
        title: 'Success',
        description: 'Interaction added successfully',
      });
      return newInteraction;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add interaction';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [contactId, toast]);

  const updateInteraction = useCallback(async (id: string, updates: Partial<InteractionFormData>) => {
    try {
      const updated = await contactTrackingService.updateInteraction(id, updates);
      setInteractions(prev => prev.map(i => i.id === id ? updated : i));
      toast({
        title: 'Success',
        description: 'Interaction updated successfully',
      });
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update interaction';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const deleteInteraction = useCallback(async (id: string) => {
    try {
      await contactTrackingService.deleteInteraction(id);
      setInteractions(prev => prev.filter(i => i.id !== id));
      toast({
        title: 'Success',
        description: 'Interaction deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete interaction';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  return {
    interactions,
    loading,
    error,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    refetch: fetchInteractions,
  };
}

// ============================================================================
// ANALYTICS HOOK
// ============================================================================

export function useContactAnalytics() {
  const [analytics, setAnalytics] = useState<ContactAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getContactAnalytics();
      setAnalytics(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load analytics';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

// ============================================================================
// CONTACT DETAILS HOOK
// ============================================================================

export function useContactDetails(contactId: string) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await contactTrackingService.getContact(contactId);
      setContact(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load contact';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [contactId, toast]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  return {
    contact,
    loading,
    error,
    refetch: fetchContact,
  };
}