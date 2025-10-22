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
  Upload,
  Mail,
  Phone
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/lib/supabase';
import { BusinessManager, Business } from '@/components/portal/BusinessManager';
import { portalRoute } from '@/lib/portal/navigation';

interface ProfileFormData {
  // Profile Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
}

export function PortalProfileEdit() {
  const navigate = useNavigate();
  const { portalUser } = usePortal();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [businessesValid, setBusinessesValid] = useState(false);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    bio: ''
  });
  
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    if (portalUser) {
      loadProfile();
    }
  }, [portalUser]);

  useEffect(() => {
    if (portalUser) {
      calculateCompletion();
    }
  }, [formData, businesses, portalUser]);

  const loadProfile = async () => {
    if (!portalUser) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', portalUser.id)
        .single();
      
      if (error) throw error;
      
      // Get email from auth if not in profile
      let userEmail = data?.email || '';
      if (!userEmail) {
        const { data: authData } = await supabase.auth.getUser();
        userEmail = authData?.user?.email || '';
      }
      
      if (data) {
        setFormData({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: userEmail,
          phone: data.phone || '',
          title: data.title || '',
          bio: data.bio || ''
        });
        setAvatarUrl(data.avatar_url);
      }
    } catch (err) {
      // Error loading profile
    }
  };

  const calculateCompletion = () => {
    // Calculate completion - checking role and businesses

    // Safety check - don't calculate if no portal user
    if (!portalUser) {
      setCompletionPercentage(0);
      setBusinessesValid(false);
      return;
    }

    // For superadmin/admin/investor, always 100%
    if (portalUser.role === 'superadmin' || portalUser.role === 'super_admin' ||
        portalUser.role === 'admin' || portalUser.role === 'investor') {
      setCompletionPercentage(100);
      setBusinessesValid(true); // Admin users always have valid businesses
      // Admin user, setting businessesValid to true
      return;
    }
    
    // Check personal info
    const personalComplete = formData.firstName && formData.lastName;
    
    // Check if has at least one complete business
    const hasCompleteBusiness = businesses.some(b => {
      // For admins, only company name is required
      if (portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || 
          portalUser?.role === 'admin') {
        // Even for admins, if it's a DSP, DSP fields are required
        if (b.is_amazon_dsp) {
          return b.company_name && b.year_dsp_began && b.avg_fleet_vehicles && b.avg_drivers;
        }
        return b.company_name;
      }
      
      // For regular users, all contact info is required
      const basicComplete = b.company_name && b.email && b.phone && 
                           b.street1 && b.city && b.state && b.zip;
      
      if (!basicComplete) return false;
      
      // If it's a DSP, check DSP fields
      if (b.is_amazon_dsp) {
        return b.year_dsp_began && b.avg_fleet_vehicles && b.avg_drivers;
      }
      
      return true;
    });
    
    setBusinessesValid(hasCompleteBusiness);
    
    // Calculate percentage
    let percentage = 0;
    if (personalComplete) percentage += 40;
    if (hasCompleteBusiness) percentage += 60;
    
    setCompletionPercentage(percentage);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !portalUser) return;
    
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    setUploadingAvatar(true);
    setError('');
    
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${portalUser.id}/avatar.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setAvatarUrl(publicUrl);
      
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', portalUser.id);
      
      if (updateError) throw updateError;
      
    } catch (err: any) {
      // Avatar upload error
      setError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  const validateForm = (): boolean => {
    // Validate form - checking user role and businesses
    
    // Superadmin/Admin/Investor bypass validation
    if (portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' || 
        portalUser?.role === 'admin' || portalUser?.role === 'investor') {
      // Admin user, bypassing validation
      return true;
    }
    
    // Check required personal fields
    if (!formData.firstName || !formData.lastName) {
      // Missing name fields
      setError('Please provide your first and last name');
      return false;
    }
    
    // For new users who just registered, allow saving personal info without business
    // They'll still be redirected to onboarding if profile_completed is false
    if (businesses.length === 1 && !businesses[0].company_name && !businesses[0].id) {
      // New user with empty business, allowing personal info save
      return true;
    }
    
    // Check business validation for existing businesses
    if (!businessesValid) {
      // Businesses not valid
      setError('Please complete at least one business with all required fields');
      return false;
    }
    
    // All validation passed
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Form submitted
    setError('');
    
    if (!validateForm()) {
      // Validation failed
      return;
    }
    // Validation passed
    
    setSaveStatus('saving');
    setLoading(true);
    
    try {
      if (!portalUser) throw new Error('No user session');
      
      // Save profile information
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        title: formData.title || null,
        bio: formData.bio || null,
        profile_complete: completionPercentage >= 80, // Using profile_complete to match database column
        updated_at: new Date().toISOString()
      };
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', portalUser.id);
      
      if (updateError) throw updateError;
      
      // Save businesses
      // For admins, provide defaults for required database fields
      const isAdmin = portalUser.role === 'superadmin' || 
                     portalUser.role === 'super_admin' || 
                     portalUser.role === 'admin';
      
      // Businesses are saved by the BusinessManager component itself, not here
      // Profile saved, businesses managed by BusinessManager
      
      setSaveStatus('saved');
      
      // Redirect based on completion and role
      setTimeout(() => {
        // If profile is now complete enough (80%+), go to profile page
        if (completionPercentage >= 80) {
          navigate(portalRoute('/profile'));
        } else {
          // For portal members with incomplete profiles, send to onboarding
          if (portalUser.role === 'portal_member') {
            navigate(portalRoute('/onboarding'));
          } else {
            // For admins, they can go to dashboard even with incomplete profile
            navigate(portalRoute('/dashboard'));
          }
        }
      }, 1500);
    } catch (err: any) {
      // Save error
      setError(err.message || 'Failed to save profile');
      setSaveStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleCancel = () => {
    if (completionPercentage >= 80) {
      navigate(portalRoute('/profile'));
    } else {
      // If profile not complete, redirect based on role
      if (portalUser?.role === 'superadmin' || portalUser?.role === 'super_admin' ||
          portalUser?.role === 'admin' || portalUser?.role === 'investor') {
        navigate(portalRoute('/dashboard'));
      } else if (portalUser?.role === 'portal_member') {
        // Portal members should go to onboarding if profile incomplete
        navigate(portalRoute('/onboarding'));
      } else {
        setError('Please complete your profile before continuing');
      }
    }
  };

  if (!portalUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
            <p className="text-gray-600">Loading profile...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your information</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-2 text-gray-600">
            Complete your profile to access all portal features
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Profile Completion</span>
                <span className="font-medium">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {completionPercentage < 80 && (
                <p className="text-xs text-gray-500">
                  Complete at least 80% to unlock all features
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {saveStatus === 'saved' && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>
              Profile saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                      {uploadingAvatar ? (
                        <>
                          <Upload className="h-4 w-4 animate-pulse" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          <span>Change Photo</span>
                        </>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <p className="text-xs text-gray-500">
                    JPG, PNG or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Basic information about you</CardDescription>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
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
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
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
                  placeholder="Tell us about yourself and your journey..."
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
              <CardDescription>
                Manage your businesses and their contact information
                {portalUser?.role !== 'superadmin' && portalUser?.role !== 'super_admin' && 
                 portalUser?.role !== 'admin' && portalUser?.role !== 'investor' && 
                 ' (at least one business required)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessManager 
                userId={portalUser.id}
                onChange={(updatedBusinesses) => setBusinesses(updatedBusinesses)}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || saveStatus === 'saving'}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}