import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Globe, Mail, Phone, MapPin, Calendar, Truck, Users } from 'lucide-react';
import { US_STATES } from '@/constants/states';
import { Business } from './BusinessManager';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalRole } from '@/hooks/usePortalRole';

interface BusinessFormProps {
  business: Business;
  isFirst: boolean;
  onChange: (business: Business) => void;
}

export function BusinessForm({ business, isFirst, onChange }: BusinessFormProps) {
  const { portalUser } = usePortal();
  const { isAdmin } = usePortalRole();
  
  const normalizePhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else {
      // Limit to 10 digits
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handleInputChange = (field: keyof Business, value: any) => {
    // Normalize phone numbers
    if (field === 'phone' || field === 'mobile') {
      value = normalizePhoneNumber(value);
    }
    
    onChange({
      ...business,
      [field]: value
    });
  };

  const handleDSPToggle = (checked: boolean) => {
    const updated = {
      ...business,
      is_amazon_dsp: checked
    };
    
    // Clear DSP fields if unchecking
    if (!checked) {
      updated.year_dsp_began = undefined;
      updated.avg_fleet_vehicles = undefined;
      updated.avg_drivers = undefined;
    }
    
    onChange(updated);
  };

  // Generate year options for DSP
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 2000; year--) {
      years.push(year);
    }
    return years;
  };

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="company_name"
                  value={business.company_name || ''}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="pl-10"
                  placeholder="Your Company Name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  value={business.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="pl-10"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={business.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell us about your business..."
              rows={3}
              className="resize-none"
            />
          </div>
          
          {/* Amazon DSP Checkbox */}
          <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
            <Checkbox
              id="is_amazon_dsp"
              checked={business.is_amazon_dsp}
              onCheckedChange={handleDSPToggle}
              className="border-amber-400"
            />
            <Label 
              htmlFor="is_amazon_dsp" 
              className="text-sm font-medium cursor-pointer text-amber-900"
            >
              This is an Amazon Delivery Service Partner (DSP) business
            </Label>
          </div>
          
          {/* DSP-specific fields */}
          {business.is_amazon_dsp && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-l-4 border-violet-500 bg-violet-50 rounded">
              <div className="space-y-2">
                <Label htmlFor="year_dsp_began">
                  Year DSP Began <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                  <Select
                    value={String(business.year_dsp_began || '')}
                    onValueChange={(value) => handleInputChange('year_dsp_began', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map(year => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avg_fleet_vehicles">
                  Average Fleet Vehicles <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="avg_fleet_vehicles"
                    type="number"
                    min="1"
                    value={business.avg_fleet_vehicles || ''}
                    onChange={(e) => handleInputChange('avg_fleet_vehicles', e.target.value)}
                    className="pl-10"
                    placeholder="e.g., 25"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avg_drivers">
                  Average Drivers <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="avg_drivers"
                    type="number"
                    min="1"
                    value={business.avg_drivers || ''}
                    onChange={(e) => handleInputChange('avg_drivers', e.target.value)}
                    className="pl-10"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Business Email {!isAdmin && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={business.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  placeholder="business@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                Business Phone {!isAdmin && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={business.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="mobile"
                  type="tel"
                  value={business.mobile || ''}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="pl-10"
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
            </div>
          </div>
          
          {/* Address */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Business Address
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street1">
                  Street Address {!isAdmin && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="street1"
                    value={business.street1 || ''}
                    onChange={(e) => handleInputChange('street1', e.target.value)}
                    className="pl-10"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street2">Street Address 2</Label>
                <Input
                  id="street2"
                  value={business.street2 || ''}
                  onChange={(e) => handleInputChange('street2', e.target.value)}
                  placeholder="Suite, Unit, Building, etc."
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <Label htmlFor="city">
                    City {!isAdmin && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="city"
                    value={business.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">
                    State {!isAdmin && <span className="text-red-500">*</span>}
                  </Label>
                  <Select
                    value={business.state || ''}
                    onValueChange={(value) => handleInputChange('state', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zip">
                    ZIP {!isAdmin && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="zip"
                    value={business.zip || ''}
                    onChange={(e) => handleInputChange('zip', e.target.value)}
                    pattern="[0-9]{5}(-[0-9]{4})?"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}