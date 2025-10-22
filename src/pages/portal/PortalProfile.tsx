import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Truck,
  Users as UsersIcon,
  Edit,
  Award,
  ClipboardList,
  Clock,
  MessageSquare,
  Star,
  Settings,
  Check
} from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/lib/supabase';
import { EmailPreferences } from '@/components/portal/profile/EmailPreferences';
import { LegalAgreementsSection } from '@/components/portal/profile/LegalAgreementsSection';
import { BusinessDetailsSection } from '@/components/portal/profile/BusinessDetailsSection';
import { portalRoute } from '@/lib/portal/navigation';

interface ProfileData {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  membershipAcceptedAt?: string;
}

interface Business {
  id: string;
  user_id: string;
  company_name: string;
  is_amazon_dsp: boolean;
  year_dsp_began?: number;
  avg_fleet_vehicles?: number;
  avg_drivers?: number;
  is_primary: boolean;
}

interface ActivityStats {
  surveysCompleted: number;
  eventsAttended: number;
  referralsMade: number;
  referralsConverted: number;
  lastActive: string;
}

export function PortalProfile() {
  const navigate = useNavigate();
  const { portalUser } = usePortal();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [membershipAcceptedAt, setMembershipAcceptedAt] = useState<string | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats>({
    surveysCompleted: 0,
    eventsAttended: 0,
    referralsMade: 0,
    referralsConverted: 0,
    lastActive: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (portalUser) {
      loadProfileData();
      loadBusinesses();
      loadMembershipAcceptance();
      loadActivityStats();
    }
  }, [portalUser]);

  const loadProfileData = async () => {
    if (!portalUser) return;
    
    // For superadmin, use mock data if profile doesn't exist
    if (portalUser.role === 'superadmin' || portalUser.role === 'super_admin') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', portalUser.id)
          .single();
        
        if (data) {
          setProfileData({
            id: data.id,
            email: data.email || portalUser.email,
            firstName: data.first_name || portalUser.name?.split(' ')[0] || 'Super',
            lastName: data.last_name || portalUser.name?.split(' ')[1] || 'Admin',
            title: data.title || 'System Administrator',
            bio: data.bio || undefined,
            avatarUrl: data.avatar_url,
            createdAt: data.created_at || new Date().toISOString()
          });
        } else {
          // No profile exists for superadmin, use defaults
          setProfileData({
            id: portalUser.id,
            email: portalUser.email,
            firstName: portalUser.name?.split(' ')[0] || 'Super',
            lastName: portalUser.name?.split(' ')[1] || 'Admin',
            title: 'System Administrator',
            bio: undefined,
            avatarUrl: undefined,
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error loading superadmin profile:', error);
        // Set default superadmin profile on error
        setProfileData({
          id: portalUser.id,
          email: portalUser.email,
          firstName: portalUser.name?.split(' ')[0] || 'Super',
          lastName: portalUser.name?.split(' ')[1] || 'Admin',
          title: 'System Administrator',
          companyName: 'FleetDRMS Administration',
          website: 'https://fleetdrms.com',
          phone: undefined,
          mobile: undefined,
          street1: undefined,
          street2: undefined,
          city: undefined,
          state: undefined,
          zip: undefined,
          bio: 'FleetDRMS System Administrator with full portal access.',
          avatarUrl: undefined,
          yearDspBegan: new Date().getFullYear(),
          avgFleetVehicles: 0,
          avgDrivers: 0,
          industry: undefined,
          fleetSize: undefined,
          yearsInOperation: undefined,
          createdAt: new Date().toISOString()
        });
      }
      setLoading(false); // Set loading to false for superadmin
      return;
    }
    
    // Regular user profile loading
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
        setProfileData({
          id: data.id,
          email: userEmail,
          phone: data.phone,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          title: data.title,
          bio: data.bio,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async () => {
    if (!portalUser) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', portalUser.id)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data) {
        setBusinesses(data);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadMembershipAcceptance = async () => {
    if (!portalUser) return;

    try {
      const { data, error } = await supabase
        .from('membership_agreements')
        .select('agreed_at')
        .eq('user_id', portalUser.id)
        .order('agreed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (data) {
        setMembershipAcceptedAt(data.agreed_at);
      }
    } catch (error) {
      console.error('Error loading membership acceptance:', error);
    }
  };

  const loadActivityStats = async () => {
    if (!portalUser) return;
    
    try {
      let surveysCount = 0;
      let eventsCount = 0;
      let referralsMade = 0;
      let referralsConverted = 0;

      // Load survey completions - handle table not existing
      try {
        const { count } = await supabase
          .from('portal_survey_responses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', portalUser.id)
          .eq('completed', true);
        surveysCount = count || 0;
      } catch (err: any) {
        if (err?.code !== '42P01') { // 42P01 is "table does not exist"
          console.error('Error loading survey stats:', err);
        }
      }
      
      // Load event attendance - handle table not existing
      try {
        const { count } = await supabase
          .from('portal_event_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', portalUser.id)
          .eq('attended', true);
        eventsCount = count || 0;
      } catch (err: any) {
        if (err?.code !== '42P01') {
          console.error('Error loading event stats:', err);
        }
      }
      
      // Load referrals - handle table not existing
      try {
        const { data: referrals } = await supabase
          .from('portal_referrals')
          .select('*')
          .eq('referrer_id', portalUser.id);
        
        referralsMade = referrals?.length || 0;
        referralsConverted = referrals?.filter(r => r.converted).length || 0;
      } catch (err: any) {
        if (err?.code !== '42P01') {
          console.error('Error loading referral stats:', err);
        }
      }
      
      setActivityStats({
        surveysCompleted: surveysCount,
        eventsAttended: eventsCount,
        referralsMade,
        referralsConverted,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading activity stats:', error);
      // Set default stats if there's an error
      setActivityStats({
        surveysCompleted: 0,
        eventsAttended: 0,
        referralsMade: 0,
        referralsConverted: 0,
        lastActive: new Date().toISOString()
      });
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??';
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Not provided';
    // Format phone number if it's just digits
    if (phone.match(/^\d{10}$/)) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const getMemberDuration = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const years = now.getFullYear() - created.getFullYear();
    const months = now.getMonth() - created.getMonth();
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Profile data not found</p>
        <Button
          className="mt-4"
          onClick={() => navigate(portalRoute('/profile/edit'))}
        >
          Complete Your Profile
        </Button>
      </div>
    );
  }

  const isOwnProfile = portalUser?.id === profileData.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profileData.avatarUrl} alt={`${profileData.firstName} ${profileData.lastName}`} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  {getInitials(profileData.firstName, profileData.lastName)}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => navigate(portalRoute('/profile/edit'))}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">
                    {profileData.firstName} {profileData.lastName}
                  </h1>
                  <div className="flex items-center gap-3 mt-2">
                    {profileData.title && (
                      <p className="text-lg text-gray-600">{profileData.title}</p>
                    )}
                    {businesses.find(b => b.is_primary) && (
                      <>
                        <span className="text-gray-400">•</span>
                        <p className="text-lg text-violet-600">
                          {businesses.find(b => b.is_primary)?.company_name}
                        </p>
                      </>
                    )}
                  </div>
                  {profileData.email && (
                    <p className="text-sm text-gray-600 mt-1">
                      {profileData.email} {profileData.phone && `• ${profileData.phone}`}
                    </p>
                  )}
                  
                  {/* Quick Stats */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {/* Only show DSP info if user has a DSP business */}
                    {businesses.some(b => b.is_amazon_dsp) && (() => {
                      const dspBusiness = businesses.find(b => b.is_amazon_dsp && b.is_primary) || businesses.find(b => b.is_amazon_dsp);
                      return (
                        <>
                          {dspBusiness?.year_dsp_began && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>DSP Since {dspBusiness.year_dsp_began}</span>
                            </div>
                          )}
                          {dspBusiness?.avg_fleet_vehicles && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Truck className="w-4 h-4" />
                              <span>{dspBusiness.avg_fleet_vehicles} Vehicles</span>
                            </div>
                          )}
                          {dspBusiness?.avg_drivers && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UsersIcon className="w-4 h-4" />
                              <span>{dspBusiness.avg_drivers} Drivers</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>Member for {getMemberDuration(membershipAcceptedAt || profileData.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Activity Badges */}
                <div className="flex flex-col gap-2">
                  {activityStats.surveysCompleted >= 5 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <Star className="w-3 h-3 mr-1" />
                      Active Contributor
                    </Badge>
                  )}
                  {activityStats.referralsConverted >= 3 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <Users className="w-3 h-3 mr-1" />
                      Community Builder
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profileData.bio && (
                <div className="mt-6">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wider mb-2">About</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{profileData.bio}</p>
                </div>
              )}

              {!profileData.bio && isOwnProfile && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 italic">
                    Tell us a little bit about yourself. When did you start your DSP? Do you own other businesses? 
                    Anything else that your peers might be interested in knowing about you?
                  </p>
                  <Button
                    size="sm"
                    variant="link"
                    className="mt-2 p-0"
                    onClick={() => navigate(portalRoute('/profile/edit'))}
                  >
                    Add your bio →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="contact" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
          <TabsTrigger value="activity">Portal Activity</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
        </TabsList>

        {/* Profile Contact Information */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Profile Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <a href={`mailto:${profileData.email}`} className="text-blue-600 hover:underline">
                        {profileData.email}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">Login & notifications</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p>{formatPhone(profileData.phone)}</p>
                      {!profileData.phone && (
                        <p className="text-sm text-gray-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {profileData.title && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Title/Position</p>
                        <p>{profileData.title}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Show business contact info if different */}
              {businesses.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Business Contact Information</h3>
                  {businesses.filter(b => b.is_primary).map(business => (
                    <div key={business.id} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium mb-2">{business.company_name}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Email: </span>
                          <span>{business.email}</span>
                          {business.email === profileData.email && (
                            <span className="text-xs text-gray-500 ml-1">(same as profile)</span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600">Phone: </span>
                          <span>{business.phone}</span>
                          {business.phone === profileData.phone && (
                            <span className="text-xs text-gray-500 ml-1">(same as profile)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Details */}
        <TabsContent value="business">
          <BusinessDetailsSection />
        </TabsContent>

        {/* Portal Activity */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Portal Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ClipboardList className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{activityStats.surveysCompleted}</p>
                  <p className="text-sm text-gray-600">Surveys Completed</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{activityStats.eventsAttended}</p>
                  <p className="text-sm text-gray-600">Events Attended</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UsersIcon className="w-8 h-8 text-violet-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{activityStats.referralsMade}</p>
                  <p className="text-sm text-gray-600">Referrals Made</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{activityStats.referralsConverted}</p>
                  <p className="text-sm text-gray-600">Referrals Joined</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last active: Today</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences">
          <EmailPreferences />
        </TabsContent>

        {/* Legal Agreements */}
        <TabsContent value="legal">
          <LegalAgreementsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}