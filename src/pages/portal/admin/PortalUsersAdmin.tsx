import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  Search,
  Filter,
  Eye,
  MessageSquare,
  Calendar,
  UserPlus,
  TrendingUp,
  ChevronRight,
  Mail,
  Phone,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PortalUserActivity {
  user_id: string;
  updates_read: number;
  updates_total: number;
  surveys_completed: number;
  surveys_started: number;
  surveys_total: number;
  events_registered: number;
  events_attended: number;
  referrals_made: number;
  referrals_converted: number;
  last_activity: string | null;
  engagement_score: number;
}

interface PortalUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  profile_complete: boolean;
  role: string;
  activity?: PortalUserActivity;
}

interface OverallMetrics {
  total_users: number;
  active_users_7d: number;
  active_users_30d: number;
  avg_engagement_score: number;
  total_updates_read: number;
  total_surveys_completed: number;
  total_events_registered: number;
  total_referrals: number;
}

export function PortalUsersAdmin() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PortalUser[]>([]);
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchUsers();
    fetchMetrics();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType]);

  const fetchUsers = async () => {
    try {
      // Get portal users using the new context tables
      const { data: portalMembers, error: portalError } = await supabase
        .from('portal_memberships')
        .select(`
          user_id,
          portal_role,
          joined_at,
          subscription_tier,
          is_active,
          profiles!inner (
            id,
            email,
            first_name,
            last_name,
            company_name,
            phone,
            created_at,
            last_sign_in_at,
            profile_complete,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (portalError) throw portalError;

      // Transform data to expected format
      const profilesData = (portalMembers || []).map(member => ({
        ...member.profiles,
        role: member.portal_role,
        portal_joined_at: member.joined_at,
        subscription_tier: member.subscription_tier
      }));

      // Fetch activity data for each user
      const usersWithActivity = await Promise.all(
        profilesData.map(async (user) => {
          const activity = await fetchUserActivity(user.id);
          return { ...user, activity };
        })
      );

      setUsers(usersWithActivity);
    } catch (error) {
      console.error('Error fetching portal users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async (userId: string): Promise<PortalUserActivity> => {
    // Fetch all activity metrics for a user
    const [updates, surveys, events, referrals] = await Promise.all([
      // Updates read
      supabase
        .from('portal_update_reads')
        .select('update_id')
        .eq('user_id', userId),
      
      // Survey responses
      supabase
        .from('portal_survey_responses')
        .select('id, is_complete')
        .eq('user_id', userId),
      
      // Event registrations
      supabase
        .from('portal_event_registrations')
        .select('id, attendance_status')
        .eq('user_id', userId),
      
      // Referrals
      supabase
        .from('portal_referrals')
        .select('id, status')
        .eq('referrer_id', userId)
    ]);

    // Calculate engagement score (0-100)
    const engagementScore = calculateEngagementScore({
      updates: updates.data?.length || 0,
      surveys: surveys.data?.filter(s => s.is_complete).length || 0,
      events: events.data?.length || 0,
      referrals: referrals.data?.length || 0
    });

    return {
      user_id: userId,
      updates_read: updates.data?.length || 0,
      updates_total: 10, // Would fetch total available updates
      surveys_completed: surveys.data?.filter(s => s.is_complete).length || 0,
      surveys_started: surveys.data?.filter(s => !s.is_complete).length || 0,
      surveys_total: 5, // Would fetch total available surveys
      events_registered: events.data?.length || 0,
      events_attended: events.data?.filter(e => e.attendance_status === 'attended').length || 0,
      referrals_made: referrals.data?.length || 0,
      referrals_converted: referrals.data?.filter(r => r.status === 'converted').length || 0,
      last_activity: null, // Would calculate from most recent activity
      engagement_score: engagementScore
    };
  };

  const calculateEngagementScore = (activities: any): number => {
    // Simple scoring algorithm - can be refined
    const weights = {
      updates: 10,
      surveys: 25,
      events: 30,
      referrals: 35
    };

    const score = 
      (activities.updates * weights.updates) +
      (activities.surveys * weights.surveys) +
      (activities.events * weights.events) +
      (activities.referrals * weights.referrals);

    return Math.min(100, Math.round(score / 10));
  };

  const fetchMetrics = async () => {
    // Aggregate metrics across portal users only
    const { data: portalUsers } = await supabase
      .from('portal_memberships')
      .select(`
        user_id,
        portal_role,
        joined_at,
        profiles!inner (
          created_at,
          last_sign_in_at
        )
      `)
      .eq('is_active', true);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers7d = portalUsers?.filter(u => 
      u.profiles.last_sign_in_at && new Date(u.profiles.last_sign_in_at) > sevenDaysAgo
    ).length || 0;

    const activeUsers30d = portalUsers?.filter(u => 
      u.profiles.last_sign_in_at && new Date(u.profiles.last_sign_in_at) > thirtyDaysAgo
    ).length || 0;

    // Count portal admins vs regular members
    const portalAdmins = portalUsers?.filter(u => u.portal_role === 'portal_admin').length || 0;
    const portalMembers = portalUsers?.filter(u => u.portal_role === 'portal_member').length || 0;
    const portalInvestors = portalUsers?.filter(u => u.portal_role === 'portal_investor').length || 0;

    setMetrics({
      total_users: portalUsers?.length || 0,
      active_users_7d: activeUsers7d,
      active_users_30d: activeUsers30d,
      avg_engagement_score: 0, // Calculate from user activities
      total_updates_read: 0,
      total_surveys_completed: 0,
      total_events_registered: 0,
      total_referrals: 0,
      // Additional portal-specific metrics
      portal_admins: portalAdmins,
      portal_members: portalMembers,
      portal_investors: portalInvestors
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Activity filter
    if (filterType === 'active') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => 
        user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
      );
    } else if (filterType === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(user => 
        !user.last_sign_in_at || new Date(user.last_sign_in_at) <= thirtyDaysAgo
      );
    }

    setFilteredUsers(filtered);
  };

  const getEngagementColor = (score: number): string => {
    if (score >= 75) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    if (score >= 25) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getUserInitials = (user: PortalUser): string => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.email ? user.email[0].toUpperCase() : '?';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Portal Users</h2>
        <p className="text-gray-600 mt-1">
          Monitor user engagement and activity across the portal
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {metrics?.active_users_7d || 0} active this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avg_engagement_score || 0}%</div>
            <Progress value={metrics?.avg_engagement_score || 0} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Updates Read</span>
                <span className="font-medium">{metrics?.total_updates_read || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Surveys Done</span>
                <span className="font-medium">{metrics?.total_surveys_completed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Events Joined</span>
                <span className="font-medium">{metrics?.total_events_registered || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_referrals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total referrals made
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <Card 
              key={user.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Badge className={getEngagementColor(user.activity?.engagement_score || 0)}>
                    {user.activity?.engagement_score || 0}%
                  </Badge>
                </div>

                {user.company_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Building className="h-3 w-3" />
                    {user.company_name}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-gray-400" />
                    <span>{user.activity?.updates_read || 0}/{user.activity?.updates_total || 0} Updates</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3 text-gray-400" />
                    <span>{user.activity?.surveys_completed || 0}/{user.activity?.surveys_total || 0} Surveys</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>{user.activity?.events_registered || 0} Events</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserPlus className="h-3 w-3 text-gray-400" />
                    <span>{user.activity?.referrals_made || 0} Referrals</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                  Last active: {user.last_sign_in_at 
                    ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                    : 'Never'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Engagement</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Updates</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Surveys</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Events</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Referrals</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="text-xs">{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">
                            {user.first_name || user.last_name 
                              ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                              : 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{user.company_name || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getEngagementColor(user.activity?.engagement_score || 0)}>
                        {user.activity?.engagement_score || 0}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.activity?.updates_read || 0}/{user.activity?.updates_total || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.activity?.surveys_completed || 0}/{user.activity?.surveys_total || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.activity?.events_registered || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm">
                      {user.activity?.referrals_made || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.last_sign_in_at 
                        ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}