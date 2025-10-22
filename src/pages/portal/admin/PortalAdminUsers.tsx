import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserDetailModal } from '@/components/portal/admin/UserDetailModal';
import { AddPortalAdmins } from '@/components/portal/admin/AddPortalAdmins';
import { FixPortalSetup } from '@/components/portal/admin/FixPortalSetup';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  Search,
  Eye,
  MessageSquare,
  Calendar,
  UserPlus,
  TrendingUp,
  ChevronRight,
  Building,
  Clock,
  BarChart3,
  Grid3x3,
  List,
  Shield,
  User,
  Briefcase
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  portal_joined_at?: string;
  subscription_tier?: string;
  avatar_url?: string;
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
  portal_admins?: number;
  portal_members?: number;
  portal_investors?: number;
}

export function PortalAdminUsers() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PortalUser[]>([]);
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<Set<string>>(new Set(['portal_admin', 'portal_member', 'portal_investor']));
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchUsers();
    fetchMetrics();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType, roleFilter]);

  const fetchUsers = async () => {
    try {
      // Get ALL portal users: automatic (system admins) + explicit (portal_memberships) + portal_member role in profiles
      
      // 1. Get system admins (they automatically have portal admin access)
      const { data: systemAdmins, error: systemError } = await supabase
        .from('system_user_assignments')
        .select(`
          user_id,
          system_role,
          assigned_at
        `)
        .in('system_role', ['super_admin', 'admin'])
        .eq('is_active', true);

      if (systemError) throw systemError;

      // Get profiles for system admins (with error handling)
      const systemAdminProfiles = [];
      if (systemAdmins) {
        for (const admin of systemAdmins) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', admin.user_id)
              .single();
            if (profile) {
              systemAdminProfiles.push({ ...admin, profiles: profile });
            }
          } catch (err) {
            // Skip this profile if it fails
            console.warn(`Failed to fetch profile for admin ${admin.user_id}:`, err);
          }
        }
      }

      // 2. Get explicit portal memberships
      const { data: portalMembers, error: portalError } = await supabase
        .from('portal_memberships')
        .select(`
          user_id,
          portal_role,
          joined_at,
          subscription_tier,
          is_active
        `)
        .eq('is_active', true);

      if (portalError) throw portalError;

      // Get profiles for portal members (with error handling)
      const portalMemberProfiles = [];
      if (portalMembers) {
        for (const member of portalMembers) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', member.user_id)
              .single();
            if (profile) {
              portalMemberProfiles.push({ ...member, profiles: profile });
            }
          } catch (err) {
            // Skip this profile if it fails
            console.warn(`Failed to fetch profile for member ${member.user_id}:`, err);
          }
        }
      }

      // 3. Get users with portal_member role directly from profiles
      const { data: portalProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'portal_member');

      if (profileError) throw profileError;

      // 4. Combine and deduplicate users
      const userMap = new Map();

      // Add system admins as portal admins
      (systemAdminProfiles || []).forEach(admin => {
        if (admin.profiles) {
          userMap.set(admin.profiles.id, {
            ...admin.profiles,
            role: 'portal_admin',
            portal_joined_at: admin.assigned_at,
            subscription_tier: 'premium',
            access_source: 'System Admin (Automatic)'
          });
        }
      });

      // Add explicit portal members from portal_memberships table
      (portalMemberProfiles || []).forEach(member => {
        if (member.profiles) {
          // Only add if not already added as system admin
          if (!userMap.has(member.profiles.id)) {
            userMap.set(member.profiles.id, {
              ...member.profiles,
              role: member.portal_role || 'portal_member',
              portal_joined_at: member.joined_at,
              subscription_tier: member.subscription_tier,
              access_source: 'Portal Membership'
            });
          }
        }
      });

      // Add portal members from profiles table (users who registered via portal)
      (portalProfiles || []).forEach(profile => {
        // Only add if not already added
        if (!userMap.has(profile.id)) {
          userMap.set(profile.id, {
            ...profile,
            role: 'portal_member',
            portal_joined_at: profile.created_at,
            subscription_tier: 'basic',
            access_source: 'Portal Registration'
          });
        }
      });

      // Convert map to array
      const profilesData = Array.from(userMap.values());

      // Fetch activity data for each user (with error handling)
      const usersWithActivity = [];
      for (const user of profilesData) {
        try {
          const activity = await fetchUserActivity(user.id);
          usersWithActivity.push({ ...user, activity });
        } catch (err) {
          // If activity fetch fails, still include the user without activity
          console.warn(`Failed to fetch activity for user ${user.id}:`, err);
          usersWithActivity.push({
            ...user,
            activity: {
              user_id: user.id,
              updates_read: 0,
              updates_total: 0,
              surveys_completed: 0,
              surveys_started: 0,
              surveys_total: 0,
              events_registered: 0,
              events_attended: 0,
              referrals_made: 0,
              referrals_converted: 0,
              last_activity: null,
              engagement_score: 0
            }
          });
        }
      }

      setUsers(usersWithActivity);
    } catch (error) {
      console.error('Error fetching portal users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load portal users. Please refresh the page.",
        variant: "destructive"
      });
      // Set empty users array so the page still renders
      setUsers([]);
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
    // Get system admins (automatic portal admins)
    const { data: systemAdmins } = await supabase
      .from('system_user_assignments')
      .select(`
        user_id,
        system_role
      `)
      .in('system_role', ['super_admin', 'admin'])
      .eq('is_active', true);

    // Get explicit portal users
    const { data: portalMembers } = await supabase
      .from('portal_memberships')
      .select(`
        user_id,
        portal_role,
        joined_at
      `)
      .eq('is_active', true);

    // Get portal members from profiles table
    const { data: portalProfiles } = await supabase
      .from('profiles')
      .select('id, created_at, last_sign_in_at, role')
      .eq('role', 'portal_member');

    // Combine users (dedupe by user_id)
    const allUsersMap = new Map();
    
    // Add system admins as portal admins
    (systemAdmins || []).forEach(admin => {
      allUsersMap.set(admin.user_id, {
        ...admin,
        portal_role: 'portal_admin'
      });
    });

    // Add explicit portal members
    (portalMembers || []).forEach(member => {
      if (!allUsersMap.has(member.user_id)) {
        allUsersMap.set(member.user_id, {
          ...member,
          portal_role: member.portal_role || 'portal_member'
        });
      }
    });

    // Add portal members from profiles table
    (portalProfiles || []).forEach(profile => {
      if (!allUsersMap.has(profile.id)) {
        allUsersMap.set(profile.id, {
          user_id: profile.id,
          portal_role: 'portal_member',
          created_at: profile.created_at,
          last_sign_in_at: profile.last_sign_in_at
        });
      }
    });

    const allUsers = Array.from(allUsersMap.values());

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers7d = allUsers.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
    ).length;

    const activeUsers30d = allUsers.filter(u =>
      u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
    ).length;

    // Count by role
    const portalAdmins = allUsers.filter(u => u.portal_role === 'portal_admin').length;
    const portalMembersCount = allUsers.filter(u => u.portal_role === 'portal_member').length;
    const portalInvestors = allUsers.filter(u => u.portal_role === 'portal_investor').length;

    setMetrics({
      total_users: allUsers.length,
      active_users_7d: activeUsers7d,
      active_users_30d: activeUsers30d,
      avg_engagement_score: 0, // Calculate from user activities
      total_updates_read: 0,
      total_surveys_completed: 0,
      total_events_registered: 0,
      total_referrals: 0,
      // Additional portal-specific metrics
      portal_admins: portalAdmins,
      portal_members: portalMembersCount,
      portal_investors: portalInvestors
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Role filter
    filtered = filtered.filter(user => roleFilter.has(user.role));

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

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'portal_admin':
        return 'bg-purple-100 text-purple-700';
      case 'portal_investor':
        return 'bg-blue-100 text-blue-700';
      case 'portal_member':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string): string => {
    return role.replace('portal_', '').replace('_', ' ').charAt(0).toUpperCase() + 
           role.replace('portal_', '').replace('_', ' ').slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Portal Users</h2>
        <p className="text-gray-600 mt-1">
          Monitor user engagement and activity across the DSP Foundry Portal
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
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div className="flex justify-between">
                <span>Admins:</span>
                <span className="font-medium">{metrics?.portal_admins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Members:</span>
                <span className="font-medium">{metrics?.portal_members || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Investors:</span>
                <span className="font-medium">{metrics?.portal_investors || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_users_7d || 0}</div>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              Last 7 days ({metrics?.active_users_30d || 0} in 30 days)
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
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Role Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={roleFilter.has('portal_admin') ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newFilter = new Set(roleFilter);
                if (newFilter.has('portal_admin')) {
                  newFilter.delete('portal_admin');
                } else {
                  newFilter.add('portal_admin');
                }
                setRoleFilter(newFilter);
              }}
              className={cn(
                "flex items-center gap-2",
                roleFilter.has('portal_admin') && "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              <Shield className="h-4 w-4" />
              Admins ({users.filter(u => u.role === 'portal_admin').length})
            </Button>
            
            <Button
              variant={roleFilter.has('portal_member') ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newFilter = new Set(roleFilter);
                if (newFilter.has('portal_member')) {
                  newFilter.delete('portal_member');
                } else {
                  newFilter.add('portal_member');
                }
                setRoleFilter(newFilter);
              }}
              className={cn(
                "flex items-center gap-2",
                roleFilter.has('portal_member') && "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              <User className="h-4 w-4" />
              Members ({users.filter(u => u.role === 'portal_member').length})
            </Button>
            
            <Button
              variant={roleFilter.has('portal_investor') ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                const newFilter = new Set(roleFilter);
                if (newFilter.has('portal_investor')) {
                  newFilter.delete('portal_investor');
                } else {
                  newFilter.add('portal_investor');
                }
                setRoleFilter(newFilter);
              }}
              className={cn(
                "flex items-center gap-2",
                roleFilter.has('portal_investor') && "bg-purple-600 hover:bg-purple-700 text-white"
              )}
            >
              <Briefcase className="h-4 w-4" />
              Investors ({users.filter(u => u.role === 'portal_investor').length})
            </Button>
          </div>

          {/* Search and View Controls */}
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
                className={viewMode === 'grid' ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
              >
                <List className="h-4 w-4" />
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                    {user.subscription_tier && (
                      <span className="text-xs text-gray-500 capitalize">
                        {user.subscription_tier} plan
                      </span>
                    )}
                  </div>

                  {user.company_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-3 w-3" />
                      {user.company_name}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
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
                    <td className="px-4 py-3">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
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
        <>
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || filterType !== 'all' 
                  ? 'No users found matching your criteria' 
                  : 'No portal users yet. Use the button below to add some.'}
              </p>
            </CardContent>
          </Card>
          
          {/* Quick Setup Button - only show when no users */}
          {!searchTerm && filterType === 'all' && (
            <div className="space-y-4">
              <FixPortalSetup />
              <AddPortalAdmins />
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserDeleted={async () => {
            setSelectedUser(null);
            // Add a small delay to ensure database has completed the CASCADE deletions
            setTimeout(async () => {
              await fetchUsers(); // Refresh the user list
              await fetchMetrics(); // Refresh metrics
              toast({
                title: "User Deleted",
                description: "The user has been successfully removed from the system",
              });
            }, 500);
          }}
        />
      )}
    </div>
  );
}