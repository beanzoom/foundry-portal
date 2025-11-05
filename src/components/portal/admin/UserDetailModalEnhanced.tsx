import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  TrendingUp,
  Target,
  Link as LinkIcon,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { DeleteUserModal } from './DeleteUserModal';

interface UserAcquisitionData {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_created_at: string;
  profile_complete: boolean;
  phone: string | null;
  company_name: string | null;
  user_updated_at: string | null;
  last_sign_in_at: string | null;

  // DSP info
  dsp_id: string | null;
  dsp_name: string | null;
  dsp_code: string | null;
  dsp_assigned_at: string | null;
  dsp_is_active: boolean | null;

  // Acquisition
  acquisition_source: 'marketing' | 'referral' | 'direct';
  source_display: string;

  // Marketing details
  campaign_code: string | null;
  campaign_name: string | null;
  funnel_name: string | null;
  marketing_converted_at: string | null;
  marketing_metadata: any;

  // Referral details
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referral_status: string | null;
  referral_dsp_name: string | null;
  referral_dsp_code: string | null;
}

interface UserActivity {
  updates_read: number;
  updates_total: number;
  surveys_completed: number;
  surveys_total: number;
  events_registered: number;
  events_attended: number;
  referrals_made: number;
  referrals_converted: number;
}

interface UserDetailModalEnhancedProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onUserDeleted?: () => void;
  onViewCampaignAnalytics?: (funnelId: string) => void;
  onViewReferrerProfile?: (referrerId: string) => void;
}

export function UserDetailModalEnhanced({
  userId,
  open,
  onClose,
  onUserDeleted,
  onViewCampaignAnalytics,
  onViewReferrerProfile
}: UserDetailModalEnhancedProps) {
  const [user, setUser] = useState<UserAcquisitionData | null>(null);
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchUserData();
      fetchUserActivity();
    }
  }, [userId, open]);

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Fetch user acquisition details
      const { data: acquisitionData, error: acquisitionError } = await supabase
        .from('user_acquisition_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (acquisitionError) throw acquisitionError;

      // Fetch additional profile fields not in view
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          middle_name,
          suffix,
          preferred_name,
          title,
          bio,
          website,
          street1,
          street2,
          city,
          state,
          zip,
          year_dsp_began,
          avg_fleet_vehicles,
          avg_drivers,
          terms_accepted,
          terms_accepted_at,
          terms_version,
          email_updates,
          email_surveys,
          email_events,
          status,
          last_sign_in_at
        `)
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        // Merge acquisition data with extended profile data
        setUser({
          ...acquisitionData,
          ...profileData,
          last_sign_in_at: profileData.last_sign_in_at
        });
      } else {
        setUser(acquisitionData);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast({
        title: "Error loading user",
        description: "Failed to load user details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    if (!userId) return;

    try {
      const [updates, surveys, events, referrals] = await Promise.all([
        supabase.from('portal_update_reads').select('update_id').eq('user_id', userId),
        supabase.from('portal_survey_responses').select('id, is_complete').eq('user_id', userId),
        supabase.from('portal_event_registrations').select('id, attendance_status').eq('user_id', userId),
        supabase.from('portal_referrals').select('id, status').eq('referrer_id', userId).neq('referral_type', 'marketing')
      ]);

      setActivity({
        updates_read: updates.data?.length || 0,
        updates_total: 10, // Would fetch total available
        surveys_completed: surveys.data?.filter(s => s.is_complete).length || 0,
        surveys_total: 5,
        events_registered: events.data?.length || 0,
        events_attended: events.data?.filter(e => e.attendance_status === 'attended').length || 0,
        referrals_made: referrals.data?.length || 0,
        referrals_converted: referrals.data?.filter(r => r.status === 'converted').length || 0
      });
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'portal_admin':
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'portal_investor':
        return 'bg-blue-100 text-blue-700';
      case 'portal_member':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSourceBadgeColor = (source: string): string => {
    switch (source) {
      case 'marketing':
        return 'bg-green-100 text-green-700';
      case 'referral':
        return 'bg-blue-100 text-blue-700';
      case 'direct':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string): string => {
    if (role === 'super_admin') return 'Super Admin';
    return role.replace('portal_', '').replace('_', ' ').charAt(0).toUpperCase() +
           role.replace('portal_', '').replace('_', ' ').slice(1);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] min-h-[600px] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.first_name || user.last_name || 'Unknown User'}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {formatRole(user.role)}
                </Badge>
                <Badge className={getSourceBadgeColor(user.acquisition_source)}>
                  {user.acquisition_source}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 min-h-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">First Name</label>
                        <p className="text-sm">{user.first_name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Middle Name</label>
                        <p className="text-sm">{user.middle_name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Name</label>
                        <p className="text-sm">{user.last_name || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Suffix</label>
                        <p className="text-sm">{user.suffix || '-'}</p>
                      </div>
                      {user.preferred_name && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Preferred Name</label>
                          <p className="text-sm">{user.preferred_name}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">{user.phone || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">{user.company_name || '-'}</p>
                        </div>
                      </div>
                      {user.title && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Title</label>
                          <p className="text-sm">{user.title}</p>
                        </div>
                      )}
                      {user.website && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Website</label>
                          <p className="text-sm text-blue-600">{user.website}</p>
                        </div>
                      )}
                      {user.bio && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-gray-500">Bio</label>
                          <p className="text-sm">{user.bio}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                {(user.street1 || user.city || user.state || user.zip) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {user.street1 && <p className="text-sm">{user.street1}</p>}
                      {user.street2 && <p className="text-sm">{user.street2}</p>}
                      {(user.city || user.state || user.zip) && (
                        <p className="text-sm">
                          {[user.city, user.state, user.zip].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Business Details */}
                {(user.year_dsp_began || user.avg_fleet_vehicles || user.avg_drivers) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Business Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        {user.year_dsp_began && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">DSP Since</label>
                            <p className="text-sm font-semibold">{user.year_dsp_began}</p>
                          </div>
                        )}
                        {user.avg_fleet_vehicles && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Fleet Size</label>
                            <p className="text-sm font-semibold">{user.avg_fleet_vehicles} vehicles</p>
                          </div>
                        )}
                        {user.avg_drivers && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Drivers</label>
                            <p className="text-sm font-semibold">{user.avg_drivers} drivers</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* DSP Assignment */}
                {user.dsp_name && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        DSP Assignment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">DSP Name</label>
                          <p className="text-sm font-medium">{user.dsp_name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">DSP Code</label>
                          <p className="text-sm">{user.dsp_code || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Assigned</label>
                          <p className="text-sm">
                            {user.dsp_assigned_at
                              ? format(new Date(user.dsp_assigned_at), 'MMM d, yyyy')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <Badge variant={user.dsp_is_active ? "default" : "outline"}>
                            {user.dsp_is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profile Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          {user.profile_complete ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          )}
                          <span className="text-sm">
                            {user.profile_complete ? 'Complete' : 'Incomplete'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Account Status</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status || 'active'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Member Since</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">
                            {format(new Date(user.user_created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Sign In</label>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">
                            {user.last_sign_in_at
                              ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Terms Accepted</label>
                        <div className="flex items-center gap-2 mt-1">
                          {user.terms_accepted ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                {user.terms_accepted_at
                                  ? format(new Date(user.terms_accepted_at), 'MMM d, yyyy')
                                  : 'Yes'}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm">Not accepted</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Preferences */}
                {(user.email_updates !== undefined || user.email_surveys !== undefined || user.email_events !== undefined) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Portal Updates</span>
                          <Badge variant={user.email_updates ? 'default' : 'secondary'}>
                            {user.email_updates ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Surveys</span>
                          <Badge variant={user.email_surveys ? 'default' : 'secondary'}>
                            {user.email_surveys ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Events</span>
                          <Badge variant={user.email_events ? 'default' : 'secondary'}>
                            {user.email_events ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Acquisition Tab */}
              <TabsContent value="acquisition" className="space-y-4 min-h-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Acquisition Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Source Type</label>
                      <div className="mt-1">
                        <Badge className={getSourceBadgeColor(user.acquisition_source)}>
                          {user.source_display}
                        </Badge>
                      </div>
                    </div>

                    {/* Marketing Campaign Details */}
                    {user.acquisition_source === 'marketing' && (
                      <div className="space-y-3 p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">Campaign Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-green-700">Campaign Name</label>
                            <p className="text-sm">{user.campaign_name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-green-700">Campaign Code</label>
                            <p className="text-sm font-mono">{user.campaign_code || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-green-700">Funnel</label>
                            <p className="text-sm">{user.funnel_name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-green-700">Converted</label>
                            <p className="text-sm">
                              {user.marketing_converted_at
                                ? format(new Date(user.marketing_converted_at), 'MMM d, yyyy')
                                : '-'}
                            </p>
                          </div>
                        </div>
                        {onViewCampaignAnalytics && user.funnel_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewCampaignAnalytics(user.funnel_id!)}
                            className="mt-2"
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            View Campaign Analytics
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Individual Referral Details */}
                    {user.acquisition_source === 'referral' && (
                      <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Referral Information</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-blue-700">Referred By</label>
                            <p className="text-sm">{user.referrer_name || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-700">Referrer Email</label>
                            <p className="text-sm">{user.referrer_email || '-'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-blue-700">Status</label>
                            <Badge variant="outline">{user.referral_status || 'Unknown'}</Badge>
                          </div>
                          {user.referral_dsp_name && (
                            <div>
                              <label className="text-xs font-medium text-blue-700">Referral DSP</label>
                              <p className="text-sm">{user.referral_dsp_name}</p>
                            </div>
                          )}
                        </div>
                        {onViewReferrerProfile && user.referrer_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onViewReferrerProfile(user.referrer_id!)}
                            className="mt-2"
                          >
                            <User className="h-4 w-4 mr-2" />
                            View Referrer Profile
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Direct Signup */}
                    {user.acquisition_source === 'direct' && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          This user signed up directly without a referral or marketing campaign.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4 min-h-[400px]">
                {activity && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Updates Read</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {activity.updates_read}/{activity.updates_total}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Surveys Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">
                            {activity.surveys_completed}/{activity.surveys_total}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Events</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{activity.events_registered}</p>
                          <p className="text-xs text-gray-500">
                            {activity.events_attended} attended
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Referrals Made</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{activity.referrals_made}</p>
                          <p className="text-xs text-gray-500">
                            {activity.referrals_converted} converted
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Settings/Actions Tab */}
              <TabsContent value="settings" className="space-y-4 min-h-[400px]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between p-4 border border-red-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Delete User</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Permanently delete this user and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete User
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      {showDeleteModal && user && (
        <DeleteUserModal
          user={user as any}
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onUserDeleted={() => {
            setShowDeleteModal(false);
            onClose();
            onUserDeleted?.();
          }}
        />
      )}
    </>
  );
}
