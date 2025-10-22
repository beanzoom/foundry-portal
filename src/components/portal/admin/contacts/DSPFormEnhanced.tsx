import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { contactTrackingService } from '@/services/contact-tracking.service';
import { useStations } from '@/hooks/useContactTracking';
import type { DSP, DSPFormData, Station } from '@/types/contact-tracking';
import {
  Building,
  Globe,
  MapPin,
  Plus,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface DSPFormEnhancedProps {
  dsp?: DSP | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DSPFormEnhanced({
  dsp,
  open,
  onClose,
  onSuccess,
}: DSPFormEnhancedProps) {
  const { toast } = useToast();
  const { stations } = useStations();
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [existingLocations, setExistingLocations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<DSPFormData>({
    dsp_code: '',
    dsp_name: '',
    website: '',
    notes: '',
    primary_station_id: '',
    location_ids: [],
  });

  const [selectedStation, setSelectedStation] = useState<string>('');

  useEffect(() => {
    if (dsp) {
      setFormData({
        dsp_code: dsp.dsp_code || '',
        dsp_name: dsp.dsp_name || '',
        website: dsp.website || '',
        notes: dsp.notes || '',
        primary_station_id: dsp.primary_station_id || dsp.station_id || '',
        location_ids: [],
      });
      
      // Load existing locations if editing
      if (dsp.id) {
        loadExistingLocations(dsp.id);
      }
    } else {
      setFormData({
        dsp_code: '',
        dsp_name: '',
        website: '',
        notes: '',
        primary_station_id: '',
        location_ids: [],
      });
      setExistingLocations([]);
    }
  }, [dsp]);

  const loadExistingLocations = async (dspId: string) => {
    setLoadingLocations(true);
    try {
      const dspWithLocations = await contactTrackingService.getDSPWithLocations(dspId);
      if (dspWithLocations?.locations) {
        setExistingLocations(dspWithLocations.locations);
        setFormData(prev => ({
          ...prev,
          location_ids: dspWithLocations.locations.map(loc => loc.station_id)
        }));
      }
    } catch (error) {
      console.error('Error loading DSP locations:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleAddLocation = () => {
    if (!selectedStation) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a station to add',
      });
      return;
    }

    if (formData.location_ids?.includes(selectedStation)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'This location has already been added',
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      location_ids: [...(prev.location_ids || []), selectedStation],
      primary_station_id: prev.primary_station_id || selectedStation // Set as primary if first
    }));
    
    setSelectedStation('');
  };

  const handleRemoveLocation = (stationId: string) => {
    setFormData(prev => {
      const newLocationIds = (prev.location_ids || []).filter(id => id !== stationId);
      
      // If removing the primary station, set the first remaining as primary
      let newPrimaryId = prev.primary_station_id;
      if (prev.primary_station_id === stationId && newLocationIds.length > 0) {
        newPrimaryId = newLocationIds[0];
      } else if (newLocationIds.length === 0) {
        newPrimaryId = '';
      }
      
      return {
        ...prev,
        location_ids: newLocationIds,
        primary_station_id: newPrimaryId
      };
    });
  };

  const handleSetPrimary = (stationId: string) => {
    setFormData(prev => ({
      ...prev,
      primary_station_id: stationId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dsp_name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'DSP name is required',
      });
      return;
    }

    if (!formData.location_ids || formData.location_ids.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'At least one location is required',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (dsp?.id) {
        await contactTrackingService.updateDSP(dsp.id, formData);
        toast({
          title: 'Success',
          description: 'DSP updated successfully',
        });
      } else {
        await contactTrackingService.createDSP(formData);
        toast({
          title: 'Success',
          description: 'DSP created successfully',
        });
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving DSP:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save DSP',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStationDisplay = (stationId: string) => {
    const station = stations.find(s => s.id === stationId);
    if (!station) return stationId;
    return `${station.station_code} - ${station.market?.name || 'Unknown Market'}`;
  };

  const availableStations = stations.filter(
    station => !formData.location_ids?.includes(station.id)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dsp ? 'Edit DSP' : 'Create New DSP'}
          </DialogTitle>
          <DialogDescription>
            Manage DSP information and operating locations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dsp_code">DSP Code</Label>
                    <Input
                      id="dsp_code"
                      value={formData.dsp_code || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dsp_code: e.target.value }))}
                      placeholder="e.g., DSP123"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dsp_name">
                      DSP Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dsp_name"
                      value={formData.dsp_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, dsp_name: e.target.value }))}
                      placeholder="Enter DSP name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">
                    <Globe className="inline h-3 w-3 mr-1" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this DSP..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Operating Locations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Operating Locations
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formData.location_ids?.length || 0} location(s)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Location */}
                <div className="flex gap-2">
                  <Select value={selectedStation} onValueChange={setSelectedStation}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a station to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStations.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          No available stations
                        </SelectItem>
                      ) : (
                        availableStations.map(station => (
                          <SelectItem key={station.id} value={station.id}>
                            {station.station_code} - {station.market?.name || 'Unknown Market'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLocation}
                    disabled={!selectedStation}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Current Locations */}
                {loadingLocations ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : formData.location_ids && formData.location_ids.length > 0 ? (
                  <div className="space-y-2">
                    {formData.location_ids.map(stationId => (
                      <div
                        key={stationId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {getStationDisplay(stationId)}
                          </span>
                          {formData.primary_station_id === stationId && (
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {formData.primary_station_id !== stationId && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetPrimary(stationId)}
                            >
                              <Check className="h-4 w-4" />
                              Set Primary
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveLocation(stationId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No locations added yet</p>
                    <p className="text-xs mt-1">Add at least one location to continue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dsp ? 'Update DSP' : 'Create DSP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}