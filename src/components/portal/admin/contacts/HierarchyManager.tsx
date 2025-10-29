import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  useMarkets, 
  useStations, 
  useDSPs 
} from '@/hooks/useContactTracking';
import { contactTrackingService } from '@/services/contact-tracking.service';
import type { Market, Station, DSP, Contact } from '@/types/contact-tracking';
import { ContactFormDialog } from './ContactFormDialog';
import { HierarchyOverview } from './HierarchyOverview';
import { StationImporter } from './StationImporter';
import { DSPFormEnhanced } from './DSPFormEnhanced';
import { ContactList } from './ContactList';
import { useNavigate, useLocation } from 'react-router-dom';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { portalRoute } from '@/lib/portal/navigation';
import {
  Building,
  MapPin,
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  Users,
  AlertCircle,
  Globe,
  Building2,
  Package,
  MoreVertical,
  Search,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// US Census Regions data
const US_REGIONS = {
  NE: {
    name: 'Northeast',
    states: ['ME','NH','VT','MA','RI','CT','NY','NJ','PA']
  },
  MW: {
    name: 'Midwest',
    states: ['OH','IN','IL','MI','WI','MN','IA','MO','ND','SD','NE','KS']
  },
  S: {
    name: 'South',
    states: ['DE','MD','DC','VA','WV','NC','SC','GA','FL','KY','TN','AL','MS','AR','LA','OK','TX']
  },
  W: {
    name: 'West',
    states: ['MT','ID','WY','CO','NM','AZ','UT','NV','WA','OR','CA','AK','HI']
  }
};

// Get region code from state
const getRegionFromState = (stateCode: string): string | null => {
  const upperState = stateCode.toUpperCase();
  for (const [code, region] of Object.entries(US_REGIONS)) {
    if (region.states.includes(upperState)) {
      return code;
    }
  }
  return null;
};

// Sorting types
type StationSortField = 'code' | 'market' | 'location' | 'dsps';
type DSPSortField = 'code' | 'name' | 'station' | 'contacts';
type SortDirection = 'asc' | 'desc';

export function HierarchyManager() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/organization/contacts')) return 'contacts';
    if (path.includes('/organization/dsps')) return 'dsps';
    if (path.includes('/organization/stations')) return 'stations';
    if (path.includes('/organization/markets')) return 'markets';
    if (path.includes('/organization/regions')) return 'regions';
    if (path.includes('/organization/overview')) return 'overview';
    if (path.includes('/organization')) return 'overview';
    return 'overview';
  };
  
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'dsps' | 'stations' | 'markets' | 'regions'>(getActiveTabFromPath());
  
  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  
  // Search states for each tab
  const [marketSearchTerm, setMarketSearchTerm] = useState('');
  const [stationSearchTerm, setStationSearchTerm] = useState('');
  const [dspSearchTerm, setDspSearchTerm] = useState('');
  
  // Sorting states
  const [stationSortField, setStationSortField] = useState<StationSortField>('code');
  const [stationSortDirection, setStationSortDirection] = useState<SortDirection>('asc');
  const [dspSortField, setDspSortField] = useState<DSPSortField>('code');
  const [dspSortDirection, setDspSortDirection] = useState<SortDirection>('asc');
  
  // Dialog states
  const [marketDialog, setMarketDialog] = useState<{ open: boolean; market?: Market }>({ open: false });
  const [stationDialog, setStationDialog] = useState<{ open: boolean; station?: Station }>({ open: false });
  const [dspDialog, setDspDialog] = useState<{ open: boolean; dsp?: DSP }>({ open: false });
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [preselectedDspId, setPreselectedDspId] = useState<string | null>(null);
  const [showOwnerPrompt, setShowOwnerPrompt] = useState(false);
  const [createdDspId, setCreatedDspId] = useState<string | null>(null);
  
  const { toast } = useToast();
  // Include inactive markets to ensure we see all markets
  const { markets, loading: marketsLoading, refetch: refetchMarkets } = useMarkets(true);
  const { stations, loading: stationsLoading, refetch: refetchStations } = useStations();
  const { dsps, loading: dspsLoading, refetch: refetchDSPs } = useDSPs();

  // Sort handlers
  const handleStationSort = (field: StationSortField) => {
    if (stationSortField === field) {
      setStationSortDirection(stationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setStationSortField(field);
      setStationSortDirection('asc');
    }
  };

  const handleDspSort = (field: DSPSortField) => {
    if (dspSortField === field) {
      setDspSortDirection(dspSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDspSortField(field);
      setDspSortDirection('asc');
    }
  };

  // Filter data based on search and selection
  const filteredMarkets = markets.filter(market => {
    if (!marketSearchTerm) return true;
    const searchLower = marketSearchTerm.toLowerCase();
    return market.name?.toLowerCase().includes(searchLower);
  });

  const filteredStations = stations.filter(station => {
    // Apply station search filter
    if (stationSearchTerm) {
      const searchLower = stationSearchTerm.toLowerCase();
      const market = markets.find(m => m.id === station.market_id);
      const matchesSearch = 
        station.station_code?.toLowerCase().includes(searchLower) ||
        station.city?.toLowerCase().includes(searchLower) ||
        market?.name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Apply old search query if still exists (backwards compatibility)
    const matchesOldSearch = !searchQuery || 
      station.station_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMarket = !selectedMarket || station.market_id === selectedMarket;
    return matchesOldSearch && matchesMarket;
  });

  // Sort stations
  const sortedStations = React.useMemo(() => {
    return [...filteredStations].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (stationSortField) {
        case 'code':
          aValue = a.station_code?.toLowerCase() || '';
          bValue = b.station_code?.toLowerCase() || '';
          break;
        case 'market':
          aValue = markets.find(m => m.id === a.market_id)?.name?.toLowerCase() || '';
          bValue = markets.find(m => m.id === b.market_id)?.name?.toLowerCase() || '';
          break;
        case 'location':
          aValue = `${a.city || ''} ${a.state || ''}`.toLowerCase();
          bValue = `${b.city || ''} ${b.state || ''}`.toLowerCase();
          break;
        case 'dsps':
          aValue = dsps.filter(d => d.station_id === a.id).length;
          bValue = dsps.filter(d => d.station_id === b.id).length;
          break;
      }
      
      if (aValue < bValue) return stationSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return stationSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredStations, stationSortField, stationSortDirection, markets, dsps]);

  const filteredDSPs = dsps.filter(dsp => {
    // Apply DSP search filter
    if (dspSearchTerm) {
      const searchLower = dspSearchTerm.toLowerCase();
      const matchesSearch = 
        dsp.dsp_code?.toLowerCase().includes(searchLower) ||
        dsp.dsp_name?.toLowerCase().includes(searchLower) ||
        dsp.contact_email?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    
    // Apply old search query if still exists (backwards compatibility)
    const matchesOldSearch = !searchQuery || 
      dsp.dsp_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dsp.dsp_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStation = !selectedStation || dsp.station_id === selectedStation;
    return matchesOldSearch && matchesStation;
  });

  // Sort DSPs
  const sortedDSPs = React.useMemo(() => {
    return [...filteredDSPs].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (dspSortField) {
        case 'code':
          aValue = a.dsp_code?.toLowerCase() || '';
          bValue = b.dsp_code?.toLowerCase() || '';
          break;
        case 'name':
          aValue = a.dsp_name?.toLowerCase() || '';
          bValue = b.dsp_name?.toLowerCase() || '';
          break;
        case 'station':
          const aStation = stations.find(s => s.id === a.station_id);
          const bStation = stations.find(s => s.id === b.station_id);
          aValue = aStation?.station_code?.toLowerCase() || '';
          bValue = bStation?.station_code?.toLowerCase() || '';
          break;
        case 'contacts':
          // This would need a count from the contacts table
          aValue = 0; // Placeholder - you could add contact count to DSP query
          bValue = 0;
          break;
      }
      
      if (aValue < bValue) return dspSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return dspSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDSPs, dspSortField, dspSortDirection, stations]);

  // Sortable header component
  const SortableHeader = ({ 
    field, 
    sortField, 
    sortDirection, 
    onSort, 
    children 
  }: { 
    field: string;
    sortField: string;
    sortDirection: SortDirection;
    onSort: (field: any) => void;
    children: React.ReactNode;
  }) => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className="cursor-pointer hover:bg-muted/50 select-none"
        onClick={() => onSort(field)}
      >
        <div className="flex items-center gap-1">
          {children}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </div>
      </TableHead>
    );
  };

  // Market Form Component
  const MarketForm = ({ market, onClose }: { market?: Market; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: market?.name || '',
      description: market?.description || '',
      primary_state: (market as any)?.primary_state || '',
      states: (market as any)?.states || [],
      is_active: market?.is_active ?? true,
    });
    const [selectedStates, setSelectedStates] = useState<string[]>((market as any)?.states || []);
    const [stateInput, setStateInput] = useState('');
    const [regionInfo, setRegionInfo] = useState<{ code: string; name: string } | null>(null);

    // Update region when primary state changes
    React.useEffect(() => {
      if (formData.primary_state) {
        const regionCode = getRegionFromState(formData.primary_state);
        if (regionCode) {
          const region = US_REGIONS[regionCode as keyof typeof US_REGIONS];
          setRegionInfo({ code: regionCode, name: region.name });
        } else {
          setRegionInfo(null);
        }
      }
    }, [formData.primary_state]);

    const handleAddState = () => {
      const upperState = stateInput.toUpperCase();
      if (upperState.length === 2 && !selectedStates.includes(upperState)) {
        const newStates = [...selectedStates, upperState];
        setSelectedStates(newStates);
        setFormData({ ...formData, states: newStates });
        setStateInput('');
        
        // Auto-select primary state if it's the first one
        if (newStates.length === 1) {
          setFormData({ ...formData, states: newStates, primary_state: upperState });
        }
      }
    };

    const handleRemoveState = (state: string) => {
      const newStates = selectedStates.filter(s => s !== state);
      setSelectedStates(newStates);
      setFormData({ ...formData, states: newStates });
      
      // Clear primary state if it was removed
      if (formData.primary_state === state) {
        setFormData({ ...formData, states: newStates, primary_state: newStates[0] || '' });
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Include region-related fields
        const dataToSend = {
          name: formData.name,
          description: formData.description || null,
          primary_state: formData.primary_state || null,
          states: selectedStates.length > 0 ? selectedStates : null,
          is_active: formData.is_active,
        };
        
        if (market) {
          await contactTrackingService.updateMarket(market.id, dataToSend);
          toast({ title: 'Market updated successfully' });
        } else {
          const newMarket = await contactTrackingService.createMarket(dataToSend);
          console.log('Created market:', newMarket);
          toast({ title: 'Market created successfully' });
        }
        // Force refetch with a small delay to ensure database consistency
        setTimeout(() => {
          refetchMarkets();
        }, 100);
        onClose();
      } catch (error) {
        console.error('Error saving market:', error);
        toast({ 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to save market',
          variant: 'destructive' 
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="market-name">Market Name *</Label>
          <Input
            id="market-name"
            placeholder="e.g., Kansas City, Dallas-Fort Worth"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>States Covered</Label>
          <div className="flex gap-2">
            <Input
              placeholder="State code (e.g., MO)"
              value={stateInput}
              onChange={(e) => setStateInput(e.target.value.toUpperCase())}
              maxLength={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddState();
                }
              }}
            />
            <Button type="button" onClick={handleAddState} variant="outline">
              Add State
            </Button>
          </div>
          {selectedStates.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedStates.map(state => (
                <Badge key={state} variant="secondary" className="gap-1">
                  {state}
                  <button
                    type="button"
                    onClick={() => handleRemoveState(state)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedStates.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="primary-state">Primary State (for multi-state markets)</Label>
            <Select 
              value={formData.primary_state} 
              onValueChange={(value) => setFormData({ ...formData, primary_state: value })}
            >
              <SelectTrigger id="primary-state">
                <SelectValue placeholder="Select primary state" />
              </SelectTrigger>
              <SelectContent>
                {selectedStates.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {regionInfo && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This market will be automatically assigned to the <strong>{regionInfo.name}</strong> region based on the {formData.primary_state || 'selected'} state.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="market-description">Description (Optional)</Label>
          <Input
            id="market-description"
            placeholder="e.g., Coverage area description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{market ? 'Update' : 'Create'} Market</Button>
        </DialogFooter>
      </form>
    );
  };

  // Station Form Component
  const StationForm = ({ station, onClose }: { station?: Station; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      station_code: station?.station_code || '',
      market_id: station?.market_id || '',
      city: station?.city || '',
      state: station?.state || '',
      zip: station?.zip || '',
      full_address: station?.full_address || '',
      is_active: station?.is_active ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (station) {
          await contactTrackingService.updateStation(station.id, formData);
          toast({ title: 'Station updated successfully' });
        } else {
          await contactTrackingService.createStation(formData);
          toast({ title: 'Station created successfully' });
        }
        refetchStations();
        onClose();
      } catch (error) {
        toast({ 
          title: 'Error', 
          description: error instanceof Error ? error.message : 'Failed to save station',
          variant: 'destructive' 
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="station-code">Station Code *</Label>
          <Input
            id="station-code"
            placeholder="e.g., DCA1, LAX3"
            value={formData.station_code}
            onChange={(e) => setFormData({ ...formData, station_code: e.target.value.toUpperCase() })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="station-market">Market</Label>
          <Select value={formData.market_id} onValueChange={(value) => setFormData({ ...formData, market_id: value })} required>
            <SelectTrigger id="station-market">
              <SelectValue placeholder="Select a market" />
            </SelectTrigger>
            <SelectContent>
              {markets.map(market => (
                <SelectItem key={market.id} value={market.id}>
                  {market.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="station-address">Full Address</Label>
          <Input
            id="station-address"
            placeholder="Street address"
            value={formData.full_address}
            onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="station-city">City</Label>
            <Input
              id="station-city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="station-state">State</Label>
            <Input
              id="station-state"
              placeholder="e.g., VA"
              maxLength={2}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="station-zip">ZIP</Label>
            <Input
              id="station-zip"
              placeholder="12345"
              value={formData.zip}
              onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{station ? 'Update' : 'Create'} Station</Button>
        </DialogFooter>
      </form>
    );
  };

  // DSP Form Component
  const DSPForm = ({ dsp, onClose, onDspCreated }: { dsp?: DSP; onClose: () => void; onDspCreated?: (dspId: string) => void }) => {
    const [formData, setFormData] = useState({
      dsp_code: dsp?.dsp_code || '',
      dsp_name: dsp?.dsp_name || '',
      station_id: dsp?.station_id || '',
      is_active: dsp?.is_active ?? true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // Validate required fields - either DSP code or name must be provided
        if (!formData.dsp_name) {
          toast({ 
            title: 'Error', 
            description: 'DSP Name is required',
            variant: 'destructive' 
          });
          return;
        }
        
        // Prepare update data - dsp_code can be null if unknown
        // Send null instead of empty string to avoid unique constraint issues
        const updateData = {
          dsp_code: formData.dsp_code?.trim() || null,
          dsp_name: formData.dsp_name.trim(),
          station_id: formData.station_id || null,
        };
        
        if (dsp) {
          await contactTrackingService.updateDSP(dsp.id, updateData);
          toast({ title: 'DSP updated successfully' });
          refetchDSPs();
          onClose();
        } else {
          const createData = {
            ...updateData,
            is_active: true
          };
          const newDsp = await contactTrackingService.createDSP(createData);
          toast({ title: 'DSP created successfully' });
          refetchDSPs();
          onClose();
          // Trigger the owner prompt after closing the DSP dialog
          if (onDspCreated) {
            onDspCreated(newDsp.id);
          }
        }
      } catch (error: any) {
        console.error('DSP save error:', error);
        let errorMessage = 'Failed to save DSP';
        
        if (error?.code === '23505' && error?.details?.includes('dsp_code')) {
          errorMessage = 'A DSP with this code already exists at this station. DSP codes must be unique per station, or leave blank if unknown.';
        } else if (error?.code === '23502') {
          errorMessage = 'DSP Name is required. DSP Code is optional if unknown.';
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        toast({ 
          title: 'Error', 
          description: errorMessage,
          variant: 'destructive' 
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dsp-code">
              DSP Code 
              <span className="text-xs text-muted-foreground ml-1">(optional)</span>
            </Label>
            <Input
              id="dsp-code"
              placeholder="e.g., DSP001 (leave blank if unknown)"
              value={formData.dsp_code}
              onChange={(e) => setFormData({ ...formData, dsp_code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dsp-name">
              DSP Name 
              <span className="text-xs text-destructive ml-1">*</span>
            </Label>
            <Input
              id="dsp-name"
              placeholder="e.g., Lightning Logistics"
              value={formData.dsp_name}
              onChange={(e) => setFormData({ ...formData, dsp_name: e.target.value })}
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dsp-station">Station</Label>
          <Select 
            value={formData.station_id || ''} 
            onValueChange={(value) => setFormData({ ...formData, station_id: value })}
          >
            <SelectTrigger id="dsp-station">
              <SelectValue placeholder="Select a station" />
            </SelectTrigger>
            <SelectContent>
              {stations.map(station => {
                const market = markets.find(m => m.id === station.market_id);
                return (
                  <SelectItem key={station.id} value={station.id}>
                    {station.station_code}
                    {station.city && ` - ${station.city}`}
                    {market && ` (${market.name})`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>


        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{dsp ? 'Update' : 'Create'} DSP</Button>
        </DialogFooter>
      </form>
    );
  };

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Contacts', href: portalRoute('/admin/contacts') },
    { label: 'Organization', href: portalRoute('/admin/contacts/organization') },
  ];
  
  // Add specific tab to breadcrumb if not overview
  if (activeTab !== 'overview') {
    const tabLabels: Record<string, string> = {
      contacts: 'All Contacts',
      markets: 'Markets',
      stations: 'Stations',
      dsps: 'DSPs',
      regions: 'Regions',
    };
    
    if (tabLabels[activeTab]) {
      breadcrumbItems.push({
        label: tabLabels[activeTab],
        current: true
      });
    }
  }

  return (
    <div className="space-y-3">
      {/* Compact Header with Breadcrumb and Search */}
      <div className="flex items-center justify-between">
        <Breadcrumb items={breadcrumbItems} />
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-48"
          />
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as any);
          // Navigate to the corresponding URL using portalRoute
          const baseUrl = portalRoute('/admin/contacts/organization');
          if (value === 'overview') {
            navigate(`${baseUrl}/overview`);
          } else if (value === 'contacts') {
            navigate(`${baseUrl}/contacts`);
          } else if (value === 'markets') {
            navigate(`${baseUrl}/markets`);
          } else if (value === 'stations') {
            navigate(`${baseUrl}/stations`);
          } else if (value === 'dsps') {
            navigate(`${baseUrl}/dsps`);
          } else if (value === 'regions') {
            navigate(`${baseUrl}/regions`);
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="dsps" className="gap-2">
            <Package className="h-4 w-4" />
            DSPs
            <Badge variant="secondary" className="ml-1">{dsps.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="stations" className="gap-2">
            <Building2 className="h-4 w-4" />
            Stations
            <Badge variant="secondary" className="ml-1">{stations.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="markets" className="gap-2">
            <MapPin className="h-4 w-4" />
            Markets
            <Badge variant="secondary" className="ml-1">{markets.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="regions" className="gap-2">
            <Globe className="h-4 w-4" />
            Regions
            <Badge variant="secondary" className="ml-1">4</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <HierarchyOverview />
        </TabsContent>
        
        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <ContactList />
        </TabsContent>

        {/* Regions Tab */}
        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">US Census Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>States</TableHead>
                    <TableHead>Markets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(US_REGIONS).map(([code, region]) => {
                    // Count markets in this region
                    const regionMarkets = markets.filter(m => {
                      const primaryState = (m as any).primary_state;
                      if (primaryState) {
                        return getRegionFromState(primaryState) === code;
                      }
                      return false;
                    });
                    
                    return (
                      <TableRow key={code}>
                        <TableCell className="font-medium">{region.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {region.states.map(state => (
                              <Badge key={state} variant="outline" className="text-xs">
                                {state}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{regionMarkets.length}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markets Tab */}
        <TabsContent value="markets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base">Markets</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search markets..."
                      value={marketSearchTerm}
                      onChange={(e) => setMarketSearchTerm(e.target.value)}
                      className="pl-7 h-7 text-sm w-48"
                    />
                  </div>
                  {marketSearchTerm && (
                    <span className="text-xs text-muted-foreground">
                      {filteredMarkets.length} of {markets.length}
                    </span>
                  )}
                </div>
                <Button size="sm" onClick={() => setMarketDialog({ open: true })}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Market
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">

              {marketsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : markets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No markets created yet</p>
                  <p className="text-sm mt-1">Start by adding your first market</p>
                </div>
              ) : filteredMarkets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No markets match your search</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>States</TableHead>
                      <TableHead>Stations</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMarkets.map(market => {
                      const stationCount = stations.filter(s => s.market_id === market.id).length;
                      const marketStates = (market as any).states || [];
                      const primaryState = (market as any).primary_state;
                      const regionCode = primaryState ? getRegionFromState(primaryState) : null;
                      const regionName = regionCode ? US_REGIONS[regionCode as keyof typeof US_REGIONS].name : '-';
                      
                      return (
                        <TableRow key={market.id}>
                          <TableCell className="font-medium">{market.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{regionName}</Badge>
                          </TableCell>
                          <TableCell>
                            {marketStates.length > 0 ? (
                              <div className="flex gap-1">
                                {marketStates.map((state: string) => (
                                  <Badge 
                                    key={state} 
                                    variant={state === primaryState ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {state}
                                  </Badge>
                                ))}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{stationCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setMarketDialog({ open: true, market })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setActiveTab('stations');
                                    setSelectedMarket(market.id);
                                  }}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  View Stations
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stations Tab */}
        <TabsContent value="stations" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base">Stations</CardTitle>
                  {markets.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search stations..."
                        value={stationSearchTerm}
                        onChange={(e) => setStationSearchTerm(e.target.value)}
                        className="pl-7 h-7 text-sm w-48"
                      />
                    </div>
                  )}
                  {selectedMarket && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {markets.find(m => m.id === selectedMarket)?.name}
                      <button
                        onClick={() => setSelectedMarket(null)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {stationSearchTerm && (
                    <span className="text-xs text-muted-foreground">
                      {filteredStations.length} of {stations.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StationImporter onImportComplete={() => refetchStations()} />
                  <Button 
                    size="sm"
                    onClick={() => setStationDialog({ open: true })}
                    disabled={markets.length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Station
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">

              {markets.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to create at least one market before adding stations.
                  </AlertDescription>
                </Alert>
              ) : stationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredStations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {stationSearchTerm ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No stations match your search</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No stations found</p>
                      <p className="text-sm mt-1">
                        {selectedMarket ? 'No stations in this market' : 'Start by adding your first station'}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader 
                        field="code" 
                        sortField={stationSortField} 
                        sortDirection={stationSortDirection}
                        onSort={handleStationSort}
                      >
                        Code
                      </SortableHeader>
                      <SortableHeader 
                        field="market" 
                        sortField={stationSortField} 
                        sortDirection={stationSortDirection}
                        onSort={handleStationSort}
                      >
                        Market
                      </SortableHeader>
                      <SortableHeader 
                        field="location" 
                        sortField={stationSortField} 
                        sortDirection={stationSortDirection}
                        onSort={handleStationSort}
                      >
                        Location
                      </SortableHeader>
                      <SortableHeader 
                        field="dsps" 
                        sortField={stationSortField} 
                        sortDirection={stationSortDirection}
                        onSort={handleStationSort}
                      >
                        DSPs
                      </SortableHeader>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStations.map(station => {
                      const market = markets.find(m => m.id === station.market_id);
                      const dspCount = dsps.filter(d => d.station_id === station.id).length;
                      const location = [station.city, station.state].filter(Boolean).join(', ');
                      
                      return (
                        <TableRow key={station.id}>
                          <TableCell className="font-medium">{station.station_code}</TableCell>
                          <TableCell>{market?.name || '-'}</TableCell>
                          <TableCell>{location || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{dspCount}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setStationDialog({ open: true, station })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setActiveTab('dsps');
                                    setSelectedStation(station.id);
                                  }}
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  View DSPs
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DSPs Tab */}
        <TabsContent value="dsps" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-base">DSPs</CardTitle>
                  {stations.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search DSPs..."
                        value={dspSearchTerm}
                        onChange={(e) => setDspSearchTerm(e.target.value)}
                        className="pl-7 h-7 text-sm w-48"
                      />
                    </div>
                  )}
                  {selectedStation && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Building2 className="h-3 w-3" />
                      {stations.find(s => s.id === selectedStation)?.station_code}
                      <button
                        onClick={() => setSelectedStation(null)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {dspSearchTerm && (
                    <span className="text-xs text-muted-foreground">
                      {filteredDSPs.length} of {dsps.length}
                    </span>
                  )}
                </div>
                <Button 
                  size="sm"
                  onClick={() => setDspDialog({ open: true })}
                  disabled={stations.length === 0}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add DSP
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">

              {stations.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need to create at least one station before adding DSPs.
                  </AlertDescription>
                </Alert>
              ) : dspsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredDSPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {dspSearchTerm ? (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No DSPs match your search</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No DSPs found</p>
                      <p className="text-sm mt-1">
                        {selectedStation ? 'No DSPs at this station' : 'Start by adding your first DSP'}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader 
                        field="code" 
                        sortField={dspSortField} 
                        sortDirection={dspSortDirection}
                        onSort={handleDspSort}
                      >
                        Code
                      </SortableHeader>
                      <SortableHeader 
                        field="name" 
                        sortField={dspSortField} 
                        sortDirection={dspSortDirection}
                        onSort={handleDspSort}
                      >
                        Name
                      </SortableHeader>
                      <SortableHeader 
                        field="station" 
                        sortField={dspSortField} 
                        sortDirection={dspSortDirection}
                        onSort={handleDspSort}
                      >
                        Station
                      </SortableHeader>
                      <TableHead>Locations</TableHead>
                      <TableHead>Fleet Size</TableHead>
                      <SortableHeader 
                        field="contacts" 
                        sortField={dspSortField} 
                        sortDirection={dspSortDirection}
                        onSort={handleDspSort}
                      >
                        Contacts
                      </SortableHeader>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDSPs.map(dsp => {
                      const station = stations.find(s => s.id === dsp.station_id);
                      
                      return (
                        <TableRow key={dsp.id}>
                          <TableCell className="font-medium">{dsp.dsp_code || '-'}</TableCell>
                          <TableCell>{dsp.dsp_name}</TableCell>
                          <TableCell>{station?.station_code || '-'}</TableCell>
                          <TableCell>
                            {dsp.location_count && dsp.location_count > 0 ? (
                              <Badge variant="outline">{dsp.location_count} location{dsp.location_count > 1 ? 's' : ''}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{dsp.fleet_size || 0}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{dsp.contact_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(portalRoute(`/admin/contacts/organization/dsps/${dsp.id}`))}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDspDialog({ open: true, dsp })}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Contacts
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Market Dialog */}
      <Dialog open={marketDialog.open} onOpenChange={(open) => {
        if (!open) setMarketDialog({ open: false });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{marketDialog.market ? 'Edit Market' : 'Add New Market'}</DialogTitle>
            <DialogDescription>
              Markets represent geographic regions or areas of operation
            </DialogDescription>
          </DialogHeader>
          <MarketForm 
            market={marketDialog.market} 
            onClose={() => setMarketDialog({ open: false })} 
          />
        </DialogContent>
      </Dialog>

      {/* Station Dialog */}
      <Dialog open={stationDialog.open} onOpenChange={(open) => {
        if (!open) setStationDialog({ open: false });
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{stationDialog.station ? 'Edit Station' : 'Add New Station'}</DialogTitle>
            <DialogDescription>
              Stations are delivery hubs within a market
            </DialogDescription>
          </DialogHeader>
          <StationForm 
            station={stationDialog.station} 
            onClose={() => setStationDialog({ open: false })} 
          />
        </DialogContent>
      </Dialog>

      {/* DSP Dialog */}
      {/* DSP Form Dialog */}
      <DSPFormEnhanced
        dsp={dspDialog.dsp}
        open={dspDialog.open}
        onClose={() => setDspDialog({ open: false })}
        onSuccess={() => {
          setDspDialog({ open: false });
          refetchDSPs();
          if (!dspDialog.dsp) {
            // If creating new DSP, show owner prompt
            setTimeout(() => setShowOwnerPrompt(true), 100);
          }
        }}
      />

      {/* Owner Prompt Dialog */}
      <Dialog open={showOwnerPrompt} onOpenChange={setShowOwnerPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Owner Contact?</DialogTitle>
            <DialogDescription>
              Would you like to add an owner contact for this DSP now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:flex-row sm:justify-between gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOwnerPrompt(false);
                setCreatedDspId(null);
              }}
            >
              No, I'll add it later
            </Button>
            <Button 
              onClick={() => {
                setShowOwnerPrompt(false);
                setPreselectedDspId(createdDspId);
                setShowContactForm(true);
              }}
            >
              Yes, add owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Form Dialog for adding owner */}
      {showContactForm && (
        <ContactFormDialog
          contact={selectedContact}
          open={showContactForm}
          onClose={() => {
            setShowContactForm(false);
            setSelectedContact(null);
            setPreselectedDspId(null);
            setCreatedDspId(null);
          }}
          onSuccess={() => {
            setShowContactForm(false);
            setSelectedContact(null);
            setPreselectedDspId(null);
            setCreatedDspId(null);
          }}
          preselectedDspId={preselectedDspId}
        />
      )}
    </div>
  );
}