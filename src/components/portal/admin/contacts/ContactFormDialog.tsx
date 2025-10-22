import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMarkets, useStations, useDSPs } from '@/hooks/useContactTracking';
import { contactTrackingService } from '@/services/contact-tracking.service';
import type { Contact, ContactFormData, ContactTitle, ContactStatus } from '@/types/contact-tracking';

interface ContactFormDialogProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedDspId?: string | null;
}

export function ContactFormDialog({ contact, open, onClose, onSuccess, preselectedDspId }: ContactFormDialogProps) {
  const { toast } = useToast();
  const { markets } = useMarkets();
  const { stations } = useStations();
  const { dsps } = useDSPs();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    title: undefined,
    dsp_id: undefined,
    station_id: undefined,
    market_id: undefined,
    referred_by_text: '',
    tags: [],
    notes: '',
    contact_status: 'new',
  });
  
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load contact data when editing or apply preselected DSP
  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title,
        dsp_id: contact.dsp_id,
        station_id: contact.station_id,
        market_id: contact.market_id,
        referred_by_text: contact.referred_by_text || '',
        tags: contact.tags || [],
        notes: contact.notes || '',
        contact_status: contact.contact_status || 'new',
      });
    } else {
      // Reset form for new contact
      let initialDspId = preselectedDspId || undefined;
      let initialStationId = undefined;
      let initialMarketId = undefined;
      
      // If we have a preselected DSP, also set its station and market
      if (preselectedDspId) {
        const dsp = dsps.find(d => d.id === preselectedDspId);
        if (dsp) {
          initialStationId = dsp.station_id;
          const station = stations.find(s => s.id === dsp.station_id);
          if (station) {
            initialMarketId = station.market_id;
          }
        }
      }
      
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        title: 'Owner',  // Default to Owner when adding from DSP
        dsp_id: initialDspId,
        station_id: initialStationId,
        market_id: initialMarketId,
        referred_by_text: '',
        tags: [],
        notes: '',
        contact_status: 'new',
      });
    }
    setTagInput('');
    setErrors({});
  }, [contact, preselectedDspId, dsps, stations]);

  // Format phone number
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      const number = cleaned.slice(1);
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    
    return phone;
  };

  // Handle DSP change - auto-set station and market
  const handleDSPChange = (dspId: string) => {
    setFormData(prev => ({ ...prev, dsp_id: dspId || undefined }));
    
    if (dspId) {
      const selectedDsp = dsps.find(d => d.id === dspId);
      if (selectedDsp?.station_id) {
        setFormData(prev => ({ ...prev, station_id: selectedDsp.station_id }));
        
        const station = stations.find(s => s.id === selectedDsp.station_id);
        if (station?.market_id) {
          setFormData(prev => ({ ...prev, market_id: station.market_id }));
        }
      }
    }
  };

  // Handle station change - auto-set market
  const handleStationChange = (stationId: string) => {
    setFormData(prev => ({ ...prev, station_id: stationId || undefined }));
    
    if (stationId) {
      const selectedStation = stations.find(s => s.id === stationId);
      if (selectedStation?.market_id) {
        setFormData(prev => ({ ...prev, market_id: selectedStation.market_id }));
      }
    }
  };

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || [],
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Must have at least one identifier
    if (!formData.email && !formData.phone && !formData.first_name && !formData.last_name) {
      newErrors.general = 'Contact must have at least an email, phone, or name';
    }
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Format phone number before saving
      const dataToSave = {
        ...formData,
        phone: formData.phone ? formatPhoneNumber(formData.phone) : undefined,
      };
      
      if (contact) {
        // Update existing contact
        await contactTrackingService.updateContact(contact.id, dataToSave);
        toast({
          title: 'Success',
          description: 'Contact updated successfully',
        });
      } else {
        // Create new contact
        await contactTrackingService.createContact(dataToSave);
        toast({
          title: 'Success',
          description: 'Contact created successfully',
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save contact',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
          
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          
          {/* Title and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Select
                value={formData.title || 'none'}
                onValueChange={(value) => setFormData({ ...formData, title: value === 'none' ? undefined : value as ContactTitle })}
              >
                <SelectTrigger id="title">
                  <SelectValue placeholder="Select title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Ops">Operations</SelectItem>
                  <SelectItem value="Dispatch">Dispatch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.contact_status || 'new'}
                onValueChange={(value) => setFormData({ ...formData, contact_status: value as ContactStatus })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Organization Hierarchy */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dsp">DSP (Delivery Service Partner)</Label>
              <Select
                value={formData.dsp_id || 'none'}
                onValueChange={(value) => handleDSPChange(value === 'none' ? '' : value)}
              >
                <SelectTrigger id="dsp">
                  <SelectValue placeholder="Select DSP (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {dsps.map(dsp => (
                    <SelectItem key={dsp.id} value={dsp.id}>
                      {dsp.dsp_name}
                      {dsp.dsp_code && ` (${dsp.dsp_code})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <Select
                value={formData.station_id || 'none'}
                onValueChange={(value) => handleStationChange(value === 'none' ? '' : value)}
              >
                <SelectTrigger id="station">
                  <SelectValue placeholder="Select station (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {stations.map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.station_code}
                      {station.city && ` - ${station.city}, ${station.state}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="market">Market</Label>
              <Select
                value={formData.market_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, market_id: value === 'none' ? undefined : value })}
              >
                <SelectTrigger id="market">
                  <SelectValue placeholder="Auto-set from station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {markets.map(market => (
                    <SelectItem key={market.id} value={market.id}>
                      {market.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Referred By */}
          <div className="space-y-2">
            <Label htmlFor="referred_by">Referred By</Label>
            <Input
              id="referred_by"
              value={formData.referred_by_text}
              onChange={(e) => setFormData({ ...formData, referred_by_text: e.target.value })}
              placeholder="Name of referrer"
            />
          </div>
          
          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this contact..."
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {contact ? 'Update' : 'Create'} Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}