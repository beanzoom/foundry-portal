import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Truck,
  Users,
  Edit,
  Plus,
  Briefcase,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Business {
  id: string;
  user_id: string;
  company_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  is_amazon_dsp: boolean;
  year_dsp_began?: number;
  avg_fleet_vehicles?: number;
  avg_drivers?: number;
  is_primary: boolean;
  created_at: string;
}

export function BusinessDetailsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadBusinessesAndProfile();
    }
  }, [user]);

  const loadBusinessesAndProfile = async () => {
    if (!user) return;

    try {
      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfileEmail(profileData.email || user.email || '');
        setProfilePhone(profileData.phone || '');
      }

      // Load businesses
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setBusinesses(data);
        // Select primary business by default, or first business if no primary
        const primaryBusiness = data.find(b => b.is_primary) || data[0];
        setSelectedBusinessId(primaryBusiness.id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (phone: string) => {
    // Format phone number if it's just digits
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">No businesses found</p>
            <Button onClick={() => navigate('/portal/profile/edit')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  if (!selectedBusiness) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Details
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/portal/profile/edit')}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Business Selector if multiple businesses */}
        {businesses.length > 1 && (
          <div className="mb-6">
            <Tabs value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(businesses.length, 3)}, 1fr)` }}>
                {businesses.map((business) => (
                  <TabsTrigger key={business.id} value={business.id} className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span className="truncate">{business.company_name}</span>
                    {business.is_primary && (
                      <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Business Information */}
        <div className="space-y-6">
          {/* Company Header */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedBusiness.company_name}</h3>
                {selectedBusiness.is_amazon_dsp && (
                  <Badge className="mt-2 bg-orange-100 text-orange-800">
                    Amazon DSP
                  </Badge>
                )}
              </div>
              {selectedBusiness.is_primary && businesses.length > 1 && (
                <Badge variant="default">Primary Business</Badge>
              )}
            </div>
            {selectedBusiness.description && (
              <p className="mt-3 text-gray-600">{selectedBusiness.description}</p>
            )}
          </div>

          {/* Contact Information - Only show if any contact field exists */}
          {(selectedBusiness.email || selectedBusiness.phone || selectedBusiness.mobile || selectedBusiness.website) && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {selectedBusiness.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Business Email
                          {selectedBusiness.email === profileEmail && (
                            <span className="ml-2 inline-flex items-center text-xs text-green-600">
                              <Check className="w-3 h-3 mr-0.5" />
                              Using profile email
                            </span>
                          )}
                        </p>
                        <a href={`mailto:${selectedBusiness.email}`} className="text-blue-600 hover:underline">
                          {selectedBusiness.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {selectedBusiness.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Business Phone
                          {selectedBusiness.phone === profilePhone && profilePhone && (
                            <span className="ml-2 inline-flex items-center text-xs text-green-600">
                              <Check className="w-3 h-3 mr-0.5" />
                              Using profile phone
                            </span>
                          )}
                        </p>
                        <p>{formatPhone(selectedBusiness.phone)}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedBusiness.mobile && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Mobile Phone</p>
                        <p>{formatPhone(selectedBusiness.mobile)}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedBusiness.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Website</p>
                        <a 
                          href={selectedBusiness.website.startsWith('http') ? selectedBusiness.website : `https://${selectedBusiness.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedBusiness.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          {(selectedBusiness.street1 || selectedBusiness.city) && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Business Address
              </h4>
              <div className="text-gray-600">
                {selectedBusiness.street1 && <p>{selectedBusiness.street1}</p>}
                {selectedBusiness.street2 && <p>{selectedBusiness.street2}</p>}
                {(selectedBusiness.city || selectedBusiness.state || selectedBusiness.zip) && (
                  <p>
                    {selectedBusiness.city && `${selectedBusiness.city}, `}
                    {selectedBusiness.state} {selectedBusiness.zip}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* DSP-Specific Information */}
          {selectedBusiness.is_amazon_dsp && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                DSP Operations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg">
                {selectedBusiness.year_dsp_began && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Year DSP Began</p>
                      <p className="text-lg font-semibold">{selectedBusiness.year_dsp_began}</p>
                    </div>
                  </div>
                )}
                
                {selectedBusiness.avg_fleet_vehicles && (
                  <div className="flex items-start gap-3">
                    <Truck className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Fleet Size</p>
                      <p className="text-lg font-semibold">{selectedBusiness.avg_fleet_vehicles} vehicles</p>
                    </div>
                  </div>
                )}
                
                {selectedBusiness.avg_drivers && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Drivers</p>
                      <p className="text-lg font-semibold">{selectedBusiness.avg_drivers} drivers</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add More Businesses */}
          {businesses.length < 5 && (
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/portal/profile/edit')}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Business
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}