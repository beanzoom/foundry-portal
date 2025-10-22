import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalPaths } from '@/hooks/usePortalPaths';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  Globe, 
  Calendar, 
  Truck, 
  Users, 
  MapPin, 
  Phone,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Briefcase,
  User,
  Mail
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePortal } from '@/contexts/PortalContext';
import { toast } from '@/hooks/use-toast';
import { sendWelcomeEmail } from '@/services/unified-notifications.service';

// Phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format based on length
  if (phoneNumber.length === 0) {
    return '';
  } else if (phoneNumber.length <= 3) {
    return `(${phoneNumber}`;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length <= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  } else {
    // Don't allow more than 10 digits
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
};

// Validate phone number (must be exactly 10 digits)
const isValidPhoneNumber = (value: string): boolean => {
  const phoneNumber = value.replace(/\D/g, '');
  return phoneNumber.length === 10;
};

// Generate year options from current year back to 2000
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 2000; year--) {
    years.push(year.toString());
  }
  return years;
};

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

export function PortalOnboarding() {
  const navigate = useNavigate();
  const { paths } = usePortalPaths();
  const { user, isLoading: authLoading } = useAuth();
  const { refreshPortalUser } = usePortal();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    // Step 1: Profile Information
    firstName: '',
    lastName: '',
    profileEmail: '',
    profilePhone: '',
    title: '',
    bio: '',
    
    // Step 2: Business Information
    companyName: '',
    businessType: 'dsp',
    website: '',
    yearDspBegan: '',
    avgFleetVehicles: '',
    avgDrivers: '',
    
    // Step 3: Business Contact & Address
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;
    
    // If user is not logged in, redirect to portal auth page
    if (!user) {
      // No user, redirecting to portal auth
      navigate(paths.root);
    } else {
      // User authenticated
      // Load existing profile data to pre-populate fields
      loadProfileData();
    }
  }, [user, authLoading, navigate]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Load existing profile data
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, title, bio')
        .eq('id', user.id)
        .single();

      if (!error && profileData) {
        setFormData(prev => ({
          ...prev,
          // Pre-populate with existing profile data
          firstName: profileData.first_name || prev.firstName,
          lastName: profileData.last_name || prev.lastName,
          profileEmail: profileData.email || user.email || prev.profileEmail,
          profilePhone: profileData.phone || prev.profilePhone,
          title: profileData.title || prev.title,
          bio: profileData.bio || prev.bio
        }));
      } else {
        // If no profile yet, at least use email from auth
        setFormData(prev => ({
          ...prev,
          profileEmail: user.email || prev.profileEmail
        }));
      }
    } catch (err) {
      // Error loading profile data
      // Fall back to just email from auth
      setFormData(prev => ({
        ...prev,
        profileEmail: user.email || prev.profileEmail
      }));
    }
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        // Profile Information validation
        if (!formData.firstName || !formData.lastName || !formData.profileEmail) {
          setError('Please fill in all required fields');
          return false;
        }
        if (formData.profileEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.profileEmail)) {
          setError('Please enter a valid email address');
          return false;
        }
        if (formData.profilePhone && !isValidPhoneNumber(formData.profilePhone)) {
          setError('Please enter a valid 10-digit phone number');
          return false;
        }
        break;
      
      case 2:
        // Business Information validation
        if (!formData.companyName || !formData.businessType || !formData.yearDspBegan) {
          setError('Please fill in all required fields');
          return false;
        }
        // Only validate fleet/driver fields for DSP businesses
        if (formData.businessType === 'dsp') {
          if (!formData.avgFleetVehicles || !formData.avgDrivers) {
            setError('Please fill in fleet size and driver count for DSP');
            return false;
          }
          if (parseInt(formData.avgFleetVehicles) < 0 || parseInt(formData.avgDrivers) < 0) {
            setError('Please enter valid numbers');
            return false;
          }
        }
        if (formData.website) {
          try {
            new URL(formData.website.startsWith('http') ? formData.website : `https://${formData.website}`);
          } catch {
            setError('Please enter a valid website URL');
            return false;
          }
        }
        break;
      
      case 3:
        // Business Contact & Address validation
        if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
          setError('Please fill in all required address fields');
          return false;
        }
        // Business email/phone are optional (will use profile defaults if empty)
        if (formData.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
          setError('Please enter a valid business email address');
          return false;
        }
        if (formData.businessPhone && !isValidPhoneNumber(formData.businessPhone)) {
          setError('Please enter a valid 10-digit phone number');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Apply smart defaults when moving from step 2 to step 3
      if (currentStep === 2) {
        setFormData(prev => ({
          ...prev,
          // Apply smart defaults if business fields are empty
          businessEmail: prev.businessEmail || prev.profileEmail,
          businessPhone: prev.businessPhone || prev.profilePhone
        }));
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError('');

    try {
      if (!user) throw new Error('User not authenticated');

      // Step 1: Update user profile with profile information
      const profileUpdateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.profileEmail,
        phone: formData.profilePhone || null,
        title: formData.title || null,
        bio: formData.bio || null,
        profile_complete: true
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Step 2: Create/Update business with smart defaults
      const businessData: any = {
        user_id: user.id,
        company_name: formData.companyName,
        // Use business contact if provided, otherwise use profile defaults
        email: formData.businessEmail || formData.profileEmail,
        phone: formData.businessPhone || formData.profilePhone || null,
        street1: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zipCode,
        website: formData.website || null,
        description: null, // Business description, not bio
        is_amazon_dsp: formData.businessType === 'dsp',
        year_dsp_began: parseInt(formData.yearDspBegan),
        is_primary: true,
        display_order: 0,
        mobile: null,
        street2: null
      };

      // Only add DSP-specific fields if business type is DSP
      if (formData.businessType === 'dsp') {
        businessData.avg_fleet_vehicles = parseInt(formData.avgFleetVehicles);
        businessData.avg_drivers = parseInt(formData.avgDrivers);
      }

      // First, unset any existing primary flags for this user
      await supabase
        .from('businesses')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Try to insert the business
      const { error: businessError } = await supabase
        .from('businesses')
        .insert(businessData);

      // If insert fails due to duplicate, try update
      if (businessError && (businessError.code === '23505' || businessError.code === '23P01')) {
        // Duplicate key or exclusion constraint error - try update instead
        const { error: updateError } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('user_id', user.id)
          .eq('is_primary', true); // Update the primary business
        
        if (updateError) {
          // Business update error
          // Continue anyway - profile is more important
        }
      } else if (businessError) {
        // Business insert error
        // Continue anyway - profile is more important
      }

      // Success! Profile is complete. Send welcome email
      try {
        // Send welcome email to the new user
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        await sendWelcomeEmail({
          userId: user.id,
          userEmail: formData.profileEmail || user.email || '',
          userName: fullName || formData.firstName || 'Member',
          userRole: 'portal_member'
        });
      } catch (emailError) {
        // Log error but don't block the onboarding completion
        console.error('Failed to send welcome email:', emailError);
      }

      toast({
        title: "Welcome aboard!",
        description: "Your profile is complete. Loading your dashboard...",
      });

      // Refresh the portal user context to get the updated profile_complete status
      await refreshPortalUser();
      
      // Small delay to ensure context is updated
      setTimeout(() => {
        // Navigate to dashboard
        navigate(paths.dashboard);
      }, 100);
      
    } catch (err: any) {
      // Onboarding error
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false); // Only set loading false on error
    }
    // Don't set loading false on success - let the navigation handle it
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
          <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Welcome to DSP Foundry Portal!</CardTitle>
                <CardDescription>
                  Let's set up your business profile to get you started
                </CardDescription>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Profile Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Profile Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profileEmail">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="profileEmail"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10"
                    value={formData.profileEmail}
                    onChange={(e) => setFormData({ ...formData, profileEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profilePhone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="profilePhone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="pl-10"
                    value={formData.profilePhone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setFormData({ ...formData, profilePhone: formatted });
                    }}
                    maxLength={14}
                  />
                </div>
                {formData.profilePhone && !isValidPhoneNumber(formData.profilePhone) && (
                  <p className="text-sm text-amber-600">Enter a valid 10-digit phone number</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title/Role</Label>
                <Input
                  id="title"
                  placeholder="e.g., Owner, Operations Manager"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">About You (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself and your experience..."
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Business Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Your business name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Select 
                  value={formData.businessType} 
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dsp">Delivery Service Partner (DSP)</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (optional)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    className="pl-10"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearDspBegan">Year Business Started *</Label>
                <Select 
                  value={formData.yearDspBegan} 
                  onValueChange={(value) => setFormData({ ...formData, yearDspBegan: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {generateYearOptions().map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Only show fleet/driver fields for DSP businesses */}
              {formData.businessType === 'dsp' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="avgFleetVehicles">Fleet Size *</Label>
                      <div className="relative">
                        <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="avgFleetVehicles"
                          type="number"
                          placeholder="Number of vehicles"
                          className="pl-10"
                          min="0"
                          value={formData.avgFleetVehicles}
                          onChange={(e) => setFormData({ ...formData, avgFleetVehicles: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avgDrivers">Number of Drivers *</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="avgDrivers"
                          type="number"
                          placeholder="Number of drivers"
                          className="pl-10"
                          min="0"
                          value={formData.avgDrivers}
                          onChange={(e) => setFormData({ ...formData, avgDrivers: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Business Contact & Address */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold">Business Contact & Address</h3>
              </div>

              {/* Smart defaults notice */}
              {(formData.profileEmail || formData.profilePhone) && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">Smart Defaults Applied</p>
                  <p>We've pre-filled your business contact info from your profile. You can change it if your business contact is different.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessEmail"
                      type="email"
                      placeholder={formData.profileEmail || "business@example.com"}
                      className="pl-10"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                    />
                  </div>
                  {!formData.businessEmail && formData.profileEmail && (
                    <p className="text-xs text-gray-500">Will use profile email: {formData.profileEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="businessPhone"
                      type="tel"
                      placeholder={formData.profilePhone || "(555) 123-4567"}
                      className="pl-10"
                      value={formData.businessPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setFormData({ ...formData, businessPhone: formatted });
                      }}
                      maxLength={14}
                    />
                  </div>
                  {!formData.businessPhone && formData.profilePhone && (
                    <p className="text-xs text-gray-500">Will use profile phone: {formData.profilePhone}</p>
                  )}
                  {formData.businessPhone && !isValidPhoneNumber(formData.businessPhone) && (
                    <p className="text-sm text-amber-600">Enter a valid 10-digit phone number</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Seattle"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select 
                    value={formData.state} 
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
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
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="98101"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    required
                  />
                </div>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                {loading ? 'Completing Profile...' : (
                  <>
                    Complete Profile
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}