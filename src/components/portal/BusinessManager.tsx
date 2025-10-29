import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Star, Trash2, Briefcase } from 'lucide-react';
import { BusinessForm } from './BusinessForm';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface Business {
  id?: string;
  user_id?: string;
  company_name: string;
  website: string;
  description: string;
  is_amazon_dsp: boolean;
  year_dsp_began?: number | string;
  avg_fleet_vehicles?: number | string;
  avg_drivers?: number | string;
  email: string;
  phone: string;
  mobile: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  is_primary: boolean;
  display_order: number;
}

interface BusinessManagerProps {
  userId: string;
  onSave?: (businesses: Business[]) => void;
  onChange?: (businesses: Business[]) => void;
}

export function BusinessManager({ userId, onSave, onChange }: BusinessManagerProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileDefaults, setProfileDefaults] = useState<Partial<Business> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProfileAndBusinesses();
  }, [userId]);

  const loadProfileAndBusinesses = async () => {
    try {
      setLoading(true);
      
      // First, load user's profile to get default email/phone
      let userEmail = '';
      let userPhone = '';
      let userMobile = '';
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, phone, mobile')
        .eq('id', userId)
        .single();
      
      if (!profileError && profileData) {
        // Get email from auth.users if not in profiles
        userEmail = profileData.email || '';
        if (!userEmail) {
          const { data: authData } = await supabase.auth.getUser();
          userEmail = authData?.user?.email || '';
        }
        userPhone = profileData.phone || '';
        userMobile = profileData.mobile || '';
      } else {
        // If no profile yet, at least get email from auth
        const { data: authData } = await supabase.auth.getUser();
        userEmail = authData?.user?.email || '';
      }
      
      // Save profile defaults for later use
      const defaults = {
        email: userEmail,
        phone: userPhone,
        mobile: userMobile
      };
      setProfileDefaults(defaults);
      
      // Then load businesses - primary first, then by display_order
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setBusinesses(data);
      } else {
        // No businesses yet, create a default one with profile defaults
        const defaultBusiness: Business = {
          company_name: '',
          website: '',
          description: '',
          is_amazon_dsp: false,
          email: userEmail,  // Use the values we just loaded
          phone: userPhone,
          mobile: userMobile,
          street1: '',
          street2: '',
          city: '',
          state: '',
          zip: '',
          is_primary: true,
          display_order: 0
        };
        setBusinesses([defaultBusiness]);
      }
    } catch (err: any) {
      // Error loading businesses
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessChange = (index: number, updatedBusiness: Business) => {
    const newBusinesses = [...businesses];
    newBusinesses[index] = updatedBusiness;
    setBusinesses(newBusinesses);
    setHasUnsavedChanges(true);
    onChange?.(newBusinesses);
  };

  const addBusiness = () => {
    const newBusiness: Business = {
      company_name: '',
      website: '',
      description: '',
      is_amazon_dsp: false,
      // Use profile defaults for contact info (smart defaults)
      email: profileDefaults?.email || '',
      phone: profileDefaults?.phone || '',
      mobile: profileDefaults?.mobile || '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      is_primary: businesses.length === 0,
      display_order: businesses.length
    };
    
    const newBusinesses = [...businesses, newBusiness];
    setBusinesses(newBusinesses);
    setActiveTab(String(businesses.length));
    setHasUnsavedChanges(true);
    onChange?.(newBusinesses);
  };

  const deleteBusiness = (index: number) => {
    if (businesses.length === 1) {
      setError('You must have at least one business');
      return;
    }

    const businessToDelete = businesses[index];
    const newBusinesses = businesses.filter((_, i) => i !== index);
    
    // If deleting primary, make first one primary
    if (businessToDelete.is_primary && newBusinesses.length > 0) {
      newBusinesses[0].is_primary = true;
    }
    
    // Update display order
    newBusinesses.forEach((b, i) => {
      b.display_order = i;
    });
    
    setBusinesses(newBusinesses);
    setHasUnsavedChanges(true);

    // Adjust active tab if necessary
    if (parseInt(activeTab) >= newBusinesses.length) {
      setActiveTab(String(newBusinesses.length - 1));
    }

    onChange?.(newBusinesses);
  };

  const setPrimaryBusiness = (index: number) => {
    const newBusinesses = businesses.map((b, i) => ({
      ...b,
      is_primary: i === index
    }));
    setBusinesses(newBusinesses);
    setHasUnsavedChanges(true);
    onChange?.(newBusinesses);
  };

  const saveBusinesses = async () => {
    try {
      setError('');
      setIsSaving(true);

      // Get user role to check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const isAdmin = profile?.role === 'superadmin' ||
                     profile?.role === 'super_admin' ||
                     profile?.role === 'admin';

      // Find which business should be primary (first one marked as primary, or first business if none)
      const primaryIndex = businesses.findIndex(b => b.is_primary);
      const actualPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

      // STRATEGY: Use RPC function or manual approach to handle constraint properly

      // Step 1: First, set ALL existing businesses to non-primary for this user
      // Step 1: Unsetting all primary flags for user
      const { error: unsetError } = await supabase
        .from('businesses')
        .update({ is_primary: false })
        .eq('user_id', userId);

      if (unsetError && unsetError.code !== 'PGRST116') {
        // Error unsetting primary flags
      }

      // Step 2: Delete ALL existing businesses for this user
      // Step 2: Deleting all existing businesses
      const { error: deleteAllError } = await supabase
        .from('businesses')
        .delete()
        .eq('user_id', userId);

      if (deleteAllError && deleteAllError.code !== 'PGRST116') { // PGRST116 = no rows found
        // Error deleting existing businesses
        throw deleteAllError;
      }

      // Step 3: Insert all businesses with is_primary set to false first
      // Step 3: Inserting businesses
      const insertedBusinessIds = [];

      for (let i = 0; i < businesses.length; i++) {
        const business = businesses[i];

        // For admins, provide defaults for optional fields
        const businessData = {
          // Don't include the id field for fresh inserts
          user_id: userId,
          company_name: business.company_name,
          website: business.website || null,
          description: business.description || null,
          is_amazon_dsp: business.is_amazon_dsp || false,
          email: business.email || null,
          phone: business.phone || null,
          mobile: business.mobile || null,
          street1: business.street1 || null,
          street2: business.street2 || null,
          city: business.city || null,
          state: business.state || null,
          zip: business.zip || null,
          year_dsp_began: business.year_dsp_began ? parseInt(String(business.year_dsp_began)) : null,
          avg_fleet_vehicles: business.avg_fleet_vehicles ? parseInt(String(business.avg_fleet_vehicles)) : null,
          avg_drivers: business.avg_drivers ? parseInt(String(business.avg_drivers)) : null,
          is_primary: false, // ALWAYS false initially
          display_order: i
        };

        // Inserting business

        // Insert with is_primary always false
        const { data, error } = await supabase
          .from('businesses')
          .insert(businessData)
          .select('id')
          .single();

        if (error) {
          // Error inserting business
          throw error;
        }

        if (data) {
          insertedBusinessIds.push({ id: data.id, index: i });
        }
      }

      // Step 4: Now update ONE business to be primary
      if (insertedBusinessIds.length > 0 && actualPrimaryIndex < insertedBusinessIds.length) {
        const primaryBusiness = insertedBusinessIds[actualPrimaryIndex];
        // Step 4: Setting primary business

        const { error: updateError } = await supabase
          .from('businesses')
          .update({ is_primary: true })
          .eq('id', primaryBusiness.id);

        if (updateError) {
          // Error setting primary business
          throw updateError;
        }
      }

      // Reload to get fresh data with IDs
      await loadProfileAndBusinesses();
      setHasUnsavedChanges(false);
      onSave?.(businesses);
    } catch (err: any) {
      // Error saving businesses
      setError(err.message || 'Failed to save businesses');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading businesses...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(businesses.length, 3)}, 1fr)` }}>
            {businesses.map((business, index) => (
              <TabsTrigger key={index} value={String(index)} className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="truncate">{business.company_name || `Business ${index + 1}`}</span>
                {business.is_primary && (
                  <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex justify-end mb-4">
          <Button
            type="button"
            onClick={addBusiness}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Business
          </Button>
        </div>
        
        {businesses.map((business, index) => (
          <TabsContent key={index} value={String(index)} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                {!business.is_primary && (
                  <Button
                    type="button"
                    onClick={() => setPrimaryBusiness(index)}
                    variant="outline"
                    size="sm"
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set as Primary
                  </Button>
                )}
                {businesses.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => deleteBusiness(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Business
                  </Button>
                )}
              </div>
            </div>
            
            <BusinessForm
              business={business}
              isFirst={index === 0}
              onChange={(updatedBusiness) => handleBusinessChange(index, updatedBusiness)}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end gap-2 pt-4">
        {hasUnsavedChanges && (
          <div className="text-sm text-amber-600 flex items-center gap-2 mr-auto">
            <span className="inline-block w-2 h-2 bg-amber-600 rounded-full animate-pulse"></span>
            Unsaved changes
          </div>
        )}
        <Button
          onClick={saveBusinesses}
          disabled={isSaving || !hasUnsavedChanges}
          className="min-w-[100px]"
        >
          {isSaving ? 'Saving...' : 'Save Businesses'}
        </Button>
      </div>
    </div>
  );
}