import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Loader2, ExternalLink, Users, Building2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface UserAcquisitionData {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  user_created_at: string;
  profile_complete: boolean;
  phone: string | null;

  // DSP
  dsp_id: string | null;
  dsp_name: string | null;
  dsp_code: string | null;
  dsp_assigned_at: string | null;

  // Acquisition
  acquisition_source: 'marketing' | 'referral' | 'direct';
  source_display: string;

  // Marketing
  campaign_code: string | null;
  campaign_name: string | null;
  funnel_name: string | null;
  funnel_referral_code: string | null;
  funnel_id: string | null;
  marketing_converted_at: string | null;
  marketing_metadata: any;

  // Referral
  referral_id: string | null;
  individual_referral_code: string | null;
  referral_status: string | null;
  referral_created_at: string | null;
  referral_sent_at: string | null;
  referral_registered_at: string | null;
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referral_dsp_name: string | null;
}

interface UserAcquisitionModalProps {
  userId: string | null;
  open: boolean;
  onClose: () => void;
  onViewCampaignAnalytics?: (funnelId: string) => void;
  onViewReferrerProfile?: (referrerId: string) => void;
}

export function UserAcquisitionModal({
  userId,
  open,
  onClose,
  onViewCampaignAnalytics,
  onViewReferrerProfile
}: UserAcquisitionModalProps) {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserAcquisitionData | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadUserData();
    }
  }, [open, userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const { data, error} = await supabase
        .from('user_acquisition_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !userId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            User Details: {userData ? `${userData.first_name} ${userData.last_name}` : 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : userData ? (
          <div className="space-y-4">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">PROFILE</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{userData.first_name} {userData.last_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{userData.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Role:</span>
                    <p className="font-medium capitalize">{userData.role}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Profile:</span>
                    <Badge variant={userData.profile_complete ? 'default' : 'secondary'}>
                      {userData.profile_complete ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Joined:</span>
                    <p className="font-medium">
                      {format(new Date(userData.user_created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DSP Assignment Section */}
            {userData.dsp_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    DSP ASSIGNMENT
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">DSP:</span>
                      <p className="font-medium">{userData.dsp_name} ({userData.dsp_code})</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Assigned:</span>
                      <p className="font-medium">
                        {userData.dsp_assigned_at
                          ? format(new Date(userData.dsp_assigned_at), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acquisition Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  ACQUISITION
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Source Type:</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        userData.acquisition_source === 'marketing'
                          ? 'default'
                          : userData.acquisition_source === 'referral'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {userData.acquisition_source === 'marketing' && 'Marketing Campaign'}
                      {userData.acquisition_source === 'referral' && 'Individual Referral'}
                      {userData.acquisition_source === 'direct' && 'Direct Signup'}
                    </Badge>
                  </div>
                </div>

                {/* Marketing Acquisition Details */}
                {userData.acquisition_source === 'marketing' && (
                  <div className="space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div>
                      <span className="text-gray-600">Funnel:</span>
                      <p className="font-medium">
                        {userData.funnel_name} ({userData.funnel_referral_code})
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Campaign:</span>
                      <p className="font-medium">
                        {userData.campaign_name || userData.campaign_code}
                        {userData.campaign_code && (
                          <code className="ml-2 px-2 py-1 bg-white border rounded text-xs">
                            {userData.campaign_code}
                          </code>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Signed Up:</span>
                      <p className="font-medium">
                        {userData.marketing_converted_at
                          ? format(new Date(userData.marketing_converted_at), 'MMM d, yyyy h:mm a')
                          : 'N/A'}
                      </p>
                    </div>

                    {userData.marketing_metadata &&
                      Object.keys(userData.marketing_metadata).filter(
                        (k) => !['email', 'first_name', 'last_name', 'campaign', 'source', 'registered_at'].includes(k)
                      ).length > 0 && (
                        <div>
                          <span className="text-gray-600">Campaign Metadata:</span>
                          <div className="mt-1 space-y-1">
                            {Object.entries(userData.marketing_metadata)
                              .filter(([key]) =>
                                !['email', 'first_name', 'last_name', 'campaign', 'source', 'registered_at'].includes(key)
                              )
                              .map(([key, value]) => (
                                <p key={key} className="text-xs">
                                  • {key}: <span className="font-mono">{String(value)}</span>
                                </p>
                              ))}
                          </div>
                        </div>
                      )}

                    <div className="pt-2 flex gap-2">
                      {onViewCampaignAnalytics && userData.funnel_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewCampaignAnalytics(userData.funnel_id!)}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          View Campaign Analytics
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Individual Referral Details */}
                {userData.acquisition_source === 'referral' && (
                  <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <span className="text-gray-600">Referred By:</span>
                      <p className="font-medium">
                        {userData.referrer_name}
                        {userData.referrer_email && (
                          <span className="text-sm text-gray-500 ml-2">({userData.referrer_email})</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Referral Code:</span>
                      <code className="ml-2 px-2 py-1 bg-white border rounded text-xs">
                        {userData.individual_referral_code}
                      </code>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-600">Referred:</span>
                        <p className="text-sm">
                          {userData.referral_created_at
                            ? format(new Date(userData.referral_created_at), 'MMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Invited:</span>
                        <p className="text-sm">
                          {userData.referral_sent_at
                            ? format(new Date(userData.referral_sent_at), 'MMM d, yyyy')
                            : 'Not sent'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Signed Up:</span>
                        <p className="text-sm">
                          {userData.referral_registered_at
                            ? format(new Date(userData.referral_registered_at), 'MMM d, yyyy')
                            : 'Not registered'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <Badge variant="secondary" className="text-xs">
                          {userData.referral_status}
                        </Badge>
                      </div>
                    </div>

                    {userData.referral_dsp_name && (
                      <div>
                        <span className="text-gray-600">Target DSP:</span>
                        <p className="text-sm">{userData.referral_dsp_name}</p>
                      </div>
                    )}

                    <div className="pt-2 flex gap-2">
                      {onViewReferrerProfile && userData.referrer_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewReferrerProfile(userData.referrer_id!)}
                        >
                          <Users className="h-3 w-3 mr-1" />
                          View Referrer Profile
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Direct Signup */}
                {userData.acquisition_source === 'direct' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      This user signed up directly without a referral code or campaign link.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            User not found
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
