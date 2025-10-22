import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { BusinessCard } from './BusinessCard';
import { Plus, Building } from 'lucide-react';

interface UserBusiness {
  id: string;
  contact_id: string;
  title: string;
  is_primary: boolean;
  can_edit_business: boolean;
  contact: {
    id: string;
    company_name: string;
    website?: string;
    email: string;
    phone: string;
    mobile?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    is_amazon_dsp: boolean;
    year_dsp_began?: number;
    avg_fleet_vehicles?: number;
    avg_drivers?: number;
    station_name?: string;
  };
}

interface BusinessManagerProps {
  userId: string;
  onEdit?: (businessId: string) => void;
  onAddBusiness?: () => void;
}

export function BusinessManager({ userId, onEdit, onAddBusiness }: BusinessManagerProps) {
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserBusinesses();
  }, [userId]);

  const loadUserBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('user_business_associations')
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq('user_id', userId)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      setBusinesses(data || []);

      // Select the primary business or first one
      if (data && data.length > 0) {
        const primary = data.find(b => b.is_primary) || data[0];
        setSelectedBusinessId(primary.contact_id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      // First, unset all as primary
      await supabase
        .from('user_business_associations')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Then set the selected one as primary
      const { error } = await supabase
        .from('user_business_associations')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('contact_id', contactId);

      if (error) throw error;

      await loadUserBusinesses();
    } catch (error) {
      console.error('Error setting primary business:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;
  }

  if (businesses.length === 0) {
    return (
      <Alert>
        <Building className="h-4 w-4" />
        <AlertDescription>
          You haven't been associated with any businesses yet.
          {onAddBusiness && (
            <Button
              variant="link"
              className="px-1"
              onClick={onAddBusiness}
            >
              Add your business
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  const selectedBusiness = businesses.find(b => b.contact_id === selectedBusinessId);

  return (
    <div className="space-y-4">
      {/* Business Selector for multiple businesses */}
      {businesses.length > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select
              value={selectedBusinessId}
              onValueChange={setSelectedBusinessId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businesses.map((business) => (
                  <SelectItem key={business.contact_id} value={business.contact_id}>
                    <div className="flex items-center space-x-2">
                      <span>{business.contact.company_name}</span>
                      {business.is_primary && (
                        <span className="text-xs text-blue-600">(Primary)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedBusiness && !selectedBusiness.is_primary && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSetPrimary(selectedBusinessId)}
              >
                Set as Primary
              </Button>
            )}
          </div>

          {onAddBusiness && (
            <Button size="sm" onClick={onAddBusiness}>
              <Plus className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          )}
        </div>
      )}

      {/* Selected Business Card */}
      {selectedBusiness && (
        <BusinessCard
          business={selectedBusiness.contact}
          userRole={selectedBusiness.title}
          isPrimary={selectedBusiness.is_primary}
          canEdit={selectedBusiness.can_edit_business}
          onEdit={() => onEdit?.(selectedBusiness.contact_id)}
        />
      )}
    </div>
  );
}