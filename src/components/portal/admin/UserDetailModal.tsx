import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { DeleteUserModal } from './DeleteUserModal';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Phone,
  Building,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  FileText,
  Download,
  Send,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface UserDetailModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted?: () => void;
}

interface UserActivity {
  type: 'update_read' | 'survey_completed' | 'event_registered' | 'referral_made';
  title: string;
  description?: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'failed';
  metadata?: any;
}

export function UserDetailModal({ user, isOpen, onClose, onUserDeleted }: UserDetailModalProps) {
  const { user: currentUser } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserActivities();
    }
  }, [user, isOpen]);

  const fetchUserActivities = async () => {
    if (!user) return;
    
    setLoadingActivities(true);
    try {
      // Fetch all user activities
      const [updates, surveys, events, referrals] = await Promise.all([
        // Updates read
        supabase
          .from('portal_update_reads')
          .select(`
            read_at,
            portal_updates (
              id,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(10),
        
        // Survey responses
        supabase
          .from('portal_survey_responses')
          .select(`
            started_at,
            completed_at,
            is_complete,
            portal_surveys (
              id,
              title
            )
          `)
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(10),
        
        // Event registrations
        supabase
          .from('portal_event_registrations')
          .select(`
            registration_date,
            attendance_status,
            portal_events (
              id,
              title,
              start_datetime
            )
          `)
          .eq('user_id', user.id)
          .order('registration_date', { ascending: false })
          .limit(10),
        
        // Referrals
        supabase
          .from('portal_referrals')
          .select(`
            created_at,
            status,
            referee_email,
            referee_name
          `)
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Combine and format activities
      const allActivities: UserActivity[] = [];

      // Add update activities
      updates.data?.forEach(update => {
        if (update.portal_updates) {
          allActivities.push({
            type: 'update_read',
            title: `Read: ${update.portal_updates.title}`,
            timestamp: update.read_at,
            status: 'completed'
          });
        }
      });

      // Add survey activities
      surveys.data?.forEach(survey => {
        if (survey.portal_surveys) {
          allActivities.push({
            type: 'survey_completed',
            title: survey.is_complete 
              ? `Completed: ${survey.portal_surveys.title}`
              : `Started: ${survey.portal_surveys.title}`,
            timestamp: survey.completed_at || survey.started_at,
            status: survey.is_complete ? 'completed' : 'pending'
          });
        }
      });

      // Add event activities
      events.data?.forEach(event => {
        if (event.portal_events) {
          allActivities.push({
            type: 'event_registered',
            title: `Registered: ${event.portal_events.title}`,
            description: `Event on ${format(new Date(event.portal_events.start_datetime), 'MMM d, yyyy')}`,
            timestamp: event.registration_date,
            status: event.attendance_status === 'attended' ? 'completed' : 'pending'
          });
        }
      });

      // Add referral activities
      referrals.data?.forEach(referral => {
        allActivities.push({
          type: 'referral_made',
          title: `Referred: ${referral.referee_name || referral.referee_email}`,
          timestamp: referral.created_at,
          status: referral.status === 'converted' ? 'completed' : 'pending'
        });
      });

      // Sort by timestamp
      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'update_read':
        return <Eye className="h-4 w-4" />;
      case 'survey_completed':
        return <MessageSquare className="h-4 w-4" />;
      case 'event_registered':
        return <Calendar className="h-4 w-4" />;
      case 'referral_made':
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: UserActivity['type']) => {
    switch (type) {
      case 'update_read':
        return 'bg-blue-100 text-blue-700';
      case 'survey_completed':
        return 'bg-green-100 text-green-700';
      case 'event_registered':
        return 'bg-purple-100 text-purple-700';
      case 'referral_made':
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.email ? user.email[0].toUpperCase() : '?';
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 75) return { label: 'Highly Engaged', color: 'text-green-600' };
    if (score >= 50) return { label: 'Moderately Engaged', color: 'text-yellow-600' };
    if (score >= 25) return { label: 'Low Engagement', color: 'text-orange-600' };
    return { label: 'Inactive', color: 'text-red-600' };
  };

  if (!user) return null;

  const engagement = getEngagementLevel(user.activity?.engagement_score || 0);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'Portal User'}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Member since {format(new Date(user.created_at), 'MMMM yyyy')}
                </DialogDescription>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${engagement.color}`}>
                {user.activity?.engagement_score || 0}%
              </div>
              <div className="text-sm text-gray-500">{engagement.label}</div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.company_name && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{user.company_name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Updates</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={(user.activity?.updates_read / user.activity?.updates_total) * 100 || 0} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-medium">
                          {user.activity?.updates_read || 0}/{user.activity?.updates_total || 0}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Surveys</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={(user.activity?.surveys_completed / user.activity?.surveys_total) * 100 || 0} 
                          className="flex-1 h-2"
                        />
                        <span className="text-sm font-medium">
                          {user.activity?.surveys_completed || 0}/{user.activity?.surveys_total || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Events Registered</span>
                      <Badge variant="secondary">{user.activity?.events_registered || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Events Attended</span>
                      <Badge variant="secondary">{user.activity?.events_attended || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Referrals Made</span>
                      <Badge variant="secondary">{user.activity?.referrals_made || 0}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Referrals Converted</span>
                      <Badge variant="secondary">{user.activity?.referrals_converted || 0}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Profile Status</span>
                  <Badge variant={user.profile_complete ? 'success' : 'warning'}>
                    {user.profile_complete ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Last Sign In</span>
                  <span className="text-sm font-medium">
                    {user.last_sign_in_at 
                      ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                      : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Account Created</span>
                  <span className="text-sm font-medium">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{activity.title}</div>
                          {activity.description && (
                            <div className="text-xs text-gray-500 mt-1">{activity.description}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </div>
                        </div>
                        {activity.status && (
                          <Badge variant={
                            activity.status === 'completed' ? 'success' : 
                            activity.status === 'pending' ? 'warning' : 'destructive'
                          }>
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-2xl font-bold">{user.activity?.engagement_score || 0}%</span>
                      </div>
                      <Progress value={user.activity?.engagement_score || 0} className="h-3" />
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Update Engagement</span>
                        <span className="font-medium">
                          {Math.round((user.activity?.updates_read / user.activity?.updates_total) * 100) || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Survey Completion</span>
                        <span className="font-medium">
                          {Math.round((user.activity?.surveys_completed / user.activity?.surveys_total) * 100) || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Event Participation</span>
                        <span className="font-medium">
                          {user.activity?.events_attended > 0 
                            ? Math.round((user.activity?.events_attended / user.activity?.events_registered) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Referral Success</span>
                        <span className="font-medium">
                          {user.activity?.referrals_made > 0 
                            ? Math.round((user.activity?.referrals_converted / user.activity?.referrals_made) * 100) 
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-40 text-gray-400">
                    <Activity className="h-8 w-8" />
                    <span className="ml-2">Trend chart coming soon</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <div className="space-y-4">
              {/* Administrative Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Administrative Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    View Survey Responses
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Event Registrations
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export User Data
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-900">Danger Zone</CardTitle>
                  <p className="text-sm text-red-700">
                    Irreversible actions that permanently affect this user
                  </p>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                    variant="destructive"
                    disabled={currentUser?.id === user?.id}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User Permanently
                  </Button>
                  {currentUser?.id === user?.id && (
                    <p className="text-xs text-red-600 mt-2">
                      You cannot delete your own account
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    
    {/* Delete User Modal */}
    {showDeleteModal && user && (
      <DeleteUserModal
        user={user}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={() => {
          setShowDeleteModal(false);
          onClose();
          onUserDeleted?.();
        }}
      />
    )}
    </>
  );
}