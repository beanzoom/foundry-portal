import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  AlertCircle,
  Save,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/lib/supabase';
import { BusinessManager, Business } from '@/components/portal/BusinessManager';

interface ProfileFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
}

// Removed FLEET_SIZE_OPTIONS and INDUSTRY_OPTIONS as they are no longer needed

// Generate year options
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 2000; year--) {
    years.push(year);
  }
  return years;
};

export function PortalProfileEdit() {
  const navigate = useNavigate();
  const { portalUser } = usePortal();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    title: '',
    bio: ''
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessesChanged, setBusinessesChanged] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (portalUser) {
      loadProfileData();
    }
  }, [portalUser]);

  // Calculate completion percentage
  useEffect(() => {
    calculateCompletion();
  }, [formData]);

  const loadProfileData = async () => {
    if (!portalUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', portalUser.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          title: data.title || '',
          bio: data.bio || '',
          companyName: data.company_name || '',
          website: data.website || '',
          yearDspBegan: data.year_dsp_began?.toString() || '',
          avgFleetVehicles: data.average_fleet_size?.toString() || '',
          avgDrivers: data.average_drivers?.toString() || '',
          email: data.email || '',
          phone: data.phone || '',
          mobile: data.mobile || '',
          street1: data.street1 || '',
          street2: data.street2 || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || ''
        });
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const calculateCompletion = () => {
    // For superadmin/admin/investor, business fields are optional
    const isPrivileged = portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || portalUser?.role === 'admin' || portalUser?.role === 'investor';
    
    const requiredFields = isPrivileged 
      ? ['firstName', 'lastName', 'email']
      : ['firstName', 'lastName', 'companyName', 'website', 'email', 'phone', 'street1', 'city', 'state', 'zip', 'yearDspBegan', 'avgFleetVehicles', 'avgDrivers'];
    
    const optionalFields = [
      'title', 'mobile', 'street2', 'bio'
    ];
    
    const completedRequired = requiredFields.filter(
      field => formData[field as keyof ProfileFormData]?.length > 0
    ).length;
    
    const completedOptional = optionalFields.filter(
      field => formData[field as keyof ProfileFormData]?.length > 0
    ).length;
    
    // Required fields worth 80%, optional worth 20%
    const requiredPercentage = (completedRequired / requiredFields.length) * 80;
    const optionalPercentage = (completedOptional / optionalFields.length) * 20;
    
    setCompletionPercentage(Math.round(requiredPercentage + optionalPercentage));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !portalUser) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    setError('');
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${portalUser.id}/avatar.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', portalUser.id);
      
      if (updateError) throw updateError;
      
      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Normalize phone numbers as they're typed
    if (name === 'phone' || name === 'mobile') {
      const normalizedValue = normalizePhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: normalizedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  const validateForm = (): boolean => {
    // Superadmin/Admin/Investor bypass validation
    console.log('[PortalProfileEdit] Validation check:', {
      userRole: portalUser?.role,
      isPrivileged: portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || portalUser?.role === 'admin' || portalUser?.role === 'investor'
    });
    
    if (portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || portalUser?.role === 'admin' || portalUser?.role === 'investor') {
      console.log('[PortalProfileEdit] Privileged user detected, bypassing validation');
      return true;
    }
    
    // Check required fields for regular users
    if (!formData.firstName || !formData.lastName) {
      setError('Please provide your first and last name');
      return false;
    }
    
    if (!formData.companyName || !formData.website) {
      setError('Company name and website are required');
      return false;
    }
    
    if (!formData.yearDspBegan || !formData.avgFleetVehicles || !formData.avgDrivers) {
      setError('DSP year, fleet size, and driver count are required');
      return false;
    }
    
    // Validate website URL
    try {
      new URL(formData.website.startsWith('http') ? formData.website : `https://${formData.website}`);
    } catch {
      setError('Please enter a valid website URL');
      return false;
    }
    
    if (!formData.email || !formData.phone) {
      setError('Business email and phone are required');
      return false;
    }
    
    if (!formData.street1 || !formData.city || !formData.state || !formData.zip) {
      setError('Complete business address is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setSaveStatus('saving');
    setLoading(true);
    
    try {
      if (!portalUser) throw new Error('No user session');
      
      // Prepare update data
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        title: formData.title || null,
        bio: formData.bio || null,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile || null,
        street1: formData.street1,
        street2: formData.street2 || null,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        profile_complete: completionPercentage >= 80,
        updated_at: new Date().toISOString()
      };
      
      // Only include business fields if they have values (not required for superadmin)
      if (formData.companyName) updateData.company_name = formData.companyName;
      if (formData.website) updateData.website = formData.website;
      if (formData.yearDspBegan) updateData.year_dsp_began = parseInt(formData.yearDspBegan);
      if (formData.avgFleetVehicles) updateData.average_fleet_size = parseInt(formData.avgFleetVehicles);
      if (formData.avgDrivers) updateData.average_drivers = parseInt(formData.avgDrivers);
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', portalUser.id);
      
      if (updateError) throw updateError;
      
      setSaveStatus('saved');
      
      // Always redirect to profile page after successful save
      setTimeout(() => {
        navigate('/portal/profile');
      }, 1500);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save profile');
      setSaveStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    if (completionPercentage >= 80) {
      navigate('/portal/profile');
    } else {
      // If profile is incomplete, they must complete it
      setError('Please complete your profile to continue');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with completion status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-gray-600 mt-1">
            {completionPercentage < 80 
              ? 'Please complete your business profile to access all portal features'
              : 'Keep your business information up to date'
            }
          </p>
        </div>
        <Card className="w-48">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-violet-600">{completionPercentage}%</div>
              <div className="text-sm text-gray-600">Complete</div>
              <Progress value={completionPercentage} className="mt-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saveStatus === 'saved' && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Profile saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload a professional headshot for your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {getInitials(formData.firstName, formData.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <Label 
                  htmlFor="avatar-upload" 
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  {uploadingAvatar ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600 mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or WEBP. Max size 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your personal details as the business owner/operator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title/Position</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Owner, CEO, Fleet Manager, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us a little bit about yourself. When did you start your DSP? Do you own other businesses? Anything else that your peers might be interested in knowing about you?"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Share your story with the community
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>Information about your company (required for pilot owners, optional for administrators and investors)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="pl-10"
                  required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">
                Website {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="https://example.com"
                  required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                />
              </div>
            </div>
            
            {/* DSP Operations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yearDspBegan">
                  Year DSP Began {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                  <Select 
                    value={formData.yearDspBegan} 
                    onValueChange={(value) => handleSelectChange('yearDspBegan', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avgFleetVehicles">
                  Avg Fleet Vehicles {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <Truck className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="avgFleetVehicles"
                    name="avgFleetVehicles"
                    type="number"
                    min="1"
                    value={formData.avgFleetVehicles}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="e.g., 25"
                    required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="avgDrivers">
                  Avg Drivers {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                </Label>
                <div className="relative">
                  <UsersIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="avgDrivers"
                    name="avgDrivers"
                    type="number"
                    min="1"
                    value={formData.avgDrivers}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="e.g., 30"
                    required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How we can reach you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Business Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Business Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    placeholder="XXX-XXX-XXXX"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Phone (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="XXX-XXX-XXXX"
                />
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Business Address</h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="street1">
                    Street Address {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="street1"
                      name="street1"
                      value={formData.street1}
                      onChange={handleInputChange}
                      className="pl-10"
                      required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="street2">Street Address 2 (Optional)</Label>
                  <Input
                    id="street2"
                    name="street2"
                    value={formData.street2}
                    onChange={handleInputChange}
                    placeholder="Suite, Unit, Building, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label htmlFor="city">
                      City {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                    </Label>
                    <Select value={formData.state} onValueChange={(value) => handleSelectChange('state', value)}>
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
                      ZIP Code {(portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor') && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      pattern="[0-9]{5}(-[0-9]{4})?"
                      placeholder="12345"
                      required={portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && portalUser?.role !== 'admin' && portalUser?.role !== 'investor'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700"
            disabled={loading || saveStatus === 'saving'}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}