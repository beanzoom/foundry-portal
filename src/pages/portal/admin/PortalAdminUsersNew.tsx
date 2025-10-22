import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  Users,
  Search,
  Filter,
  X,
  Calendar,
  TrendingUp,
  ChevronDown,
  Shield
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { UserDetailModalEnhanced } from '@/components/portal/admin/UserDetailModalEnhanced';
import { PromoteUserDialog } from '@/components/portal/admin/PromoteUserDialog';
import { usePortal } from '@/contexts/PortalContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UserAcquisitionData {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_created_at: string;
  profile_complete: boolean;
  phone: string | null;
  user_updated_at: string | null;

  // DSP info
  dsp_id: string | null;
  dsp_name: string | null;
  dsp_code: string | null;

  // Acquisition
  acquisition_source: 'marketing' | 'referral' | 'direct';
  source_display: string;

  // Marketing details
  campaign_code: string | null;
  campaign_name: string | null;
  funnel_name: string | null;
  marketing_converted_at: string | null;

  // Referral details
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referral_status: string | null;
}

interface OverallMetrics {
  total_users: number;
  marketing_users: number;
  referral_users: number;
  direct_users: number;
  active_users_7d: number;
  active_users_30d: number;
}

interface CampaignOption {
  campaign_code: string;
  campaign_name: string;
  count: number;
}

interface ReferrerOption {
  referrer_id: string;
  referrer_name: string;
  count: number;
}

export function PortalAdminUsersNew() {
  const { portalUser } = usePortal();
  const [users, setUsers] = useState<UserAcquisitionData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserAcquisitionData[]>([]);
  const [metrics, setMetrics] = useState<OverallMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [promoteUser, setPromoteUser] = useState<UserAcquisitionData | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all'); // 'all' | 'marketing' | 'referral' | 'direct'
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [referrerFilter, setReferrerFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all'); // 'all' | '7d' | '30d' | '90d'

  // Available filter options
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [referrers, setReferrers] = useState<ReferrerOption[]>([]);

  // Check if current user is super_admin
  const isSuperAdmin = portalUser?.role === 'super_admin';

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, sourceFilter, campaignFilter, referrerFilter, dateRangeFilter]);

  const fetchUsers = async () => {
    try {
      // Fetch from user_acquisition_details view
      const { data, error } = await supabase
        .from('user_acquisition_details')
        .select('*')
        .order('user_created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);

      // Calculate metrics
      calculateMetrics(data || []);

      // Extract unique campaigns and referrers for filters
      extractFilterOptions(data || []);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load user data. Please refresh the page.",
        variant: "destructive"
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (userData: UserAcquisitionData[]) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metrics: OverallMetrics = {
      total_users: userData.length,
      marketing_users: userData.filter(u => u.acquisition_source === 'marketing').length,
      referral_users: userData.filter(u => u.acquisition_source === 'referral').length,
      direct_users: userData.filter(u => u.acquisition_source === 'direct').length,
      active_users_7d: userData.filter(u =>
        u.user_updated_at && new Date(u.user_updated_at) > sevenDaysAgo
      ).length,
      active_users_30d: userData.filter(u =>
        u.user_updated_at && new Date(u.user_updated_at) > thirtyDaysAgo
      ).length,
    };

    setMetrics(metrics);
  };

  const extractFilterOptions = (userData: UserAcquisitionData[]) => {
    // Extract unique campaigns
    const campaignMap = new Map<string, { name: string; count: number }>();
    userData.forEach(user => {
      if (user.campaign_code && user.campaign_name) {
        const existing = campaignMap.get(user.campaign_code);
        if (existing) {
          existing.count++;
        } else {
          campaignMap.set(user.campaign_code, { name: user.campaign_name, count: 1 });
        }
      }
    });

    const campaignOptions = Array.from(campaignMap.entries()).map(([code, data]) => ({
      campaign_code: code,
      campaign_name: data.name,
      count: data.count
    }));
    setCampaigns(campaignOptions);

    // Extract unique referrers
    const referrerMap = new Map<string, { name: string; count: number }>();
    userData.forEach(user => {
      if (user.referrer_id && user.referrer_name) {
        const existing = referrerMap.get(user.referrer_id);
        if (existing) {
          existing.count++;
        } else {
          referrerMap.set(user.referrer_id, { name: user.referrer_name, count: 1 });
        }
      }
    });

    const referrerOptions = Array.from(referrerMap.entries()).map(([id, data]) => ({
      referrer_id: id,
      referrer_name: data.name,
      count: data.count
    }));
    setReferrers(referrerOptions);
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(term) ||
        user.first_name?.toLowerCase().includes(term) ||
        user.last_name?.toLowerCase().includes(term) ||
        user.source_display?.toLowerCase().includes(term)
      );
    }

    // Source type filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(user => user.acquisition_source === sourceFilter);
    }

    // Campaign filter
    if (campaignFilter !== 'all') {
      filtered = filtered.filter(user => user.campaign_code === campaignFilter);
    }

    // Referrer filter
    if (referrerFilter !== 'all') {
      filtered = filtered.filter(user => user.referrer_id === referrerFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateRangeFilter) {
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(user =>
        new Date(user.user_created_at) > cutoffDate
      );
    }

    setFilteredUsers(filtered);
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

  const clearAllFilters = () => {
    setSearchTerm('');
    setSourceFilter('all');
    setCampaignFilter('all');
    setReferrerFilter('all');
    setDateRangeFilter('all');
  };

  const hasActiveFilters = searchTerm || sourceFilter !== 'all' || campaignFilter !== 'all' ||
                          referrerFilter !== 'all' || dateRangeFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
        <p className="text-gray-600 mt-1">
          View and manage portal users with acquisition tracking
        </p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_users || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All portal users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Marketing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.marketing_users || 0}</div>
            <p className="text-xs text-gray-500 mt-1">From campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics?.referral_users || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Individual referrals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Direct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics?.direct_users || 0}</div>
            <p className="text-xs text-gray-500 mt-1">No referral source</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.active_users_7d || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Last 7 days ({metrics?.active_users_30d || 0} in 30d)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or source..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Source Type Filter */}
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Source Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="marketing">Marketing ({metrics?.marketing_users || 0})</SelectItem>
                  <SelectItem value="referral">Referral ({metrics?.referral_users || 0})</SelectItem>
                  <SelectItem value="direct">Direct ({metrics?.direct_users || 0})</SelectItem>
                </SelectContent>
              </Select>

              {/* Campaign Filter */}
              <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                <SelectTrigger className="w-[200px]">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.campaign_code} value={campaign.campaign_code}>
                      {campaign.campaign_name} ({campaign.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Referrer Filter */}
              <Select value={referrerFilter} onValueChange={setReferrerFilter}>
                <SelectTrigger className="w-[200px]">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Referrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Referrers</SelectItem>
                  {referrers.map(referrer => (
                    <SelectItem key={referrer.referrer_id} value={referrer.referrer_id}>
                      {referrer.referrer_name} ({referrer.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="ml-auto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DSP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign/Referrer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map(user => (
                  <tr
                    key={user.user_id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedUserId(user.user_id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.first_name || user.last_name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {formatRole(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.dsp_name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getSourceBadgeColor(user.acquisition_source)}>
                        {user.acquisition_source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.acquisition_source === 'marketing' && user.campaign_name ? (
                        <span className="text-green-700">{user.campaign_name}</span>
                      ) : user.acquisition_source === 'referral' && user.referrer_name ? (
                        <span className="text-blue-700">{user.referrer_name}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.profile_complete ? "default" : "outline"}>
                        {user.profile_complete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(user.user_created_at), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.user_id);
                          }}
                        >
                          View
                        </Button>
                        {isSuperAdmin && user.role !== 'user' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPromoteUser(user);
                            }}
                            title="Promote user"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'No users found matching your filters'
                : 'No portal users yet'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Detail Modal */}
      <UserDetailModalEnhanced
        userId={selectedUserId}
        open={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onUserDeleted={() => {
          setSelectedUserId(null);
          fetchUsers(); // Refresh the list after deletion
        }}
      />

      {/* Promote User Dialog */}
      <PromoteUserDialog
        user={promoteUser}
        isOpen={!!promoteUser}
        onClose={() => setPromoteUser(null)}
        onSuccess={() => {
          setPromoteUser(null);
          fetchUsers(); // Refresh the list after promotion
        }}
      />
    </div>
  );
}
