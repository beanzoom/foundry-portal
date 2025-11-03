import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, X, TrendingUp, Calendar, Users as UsersIcon, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import {
  fetchUserActivity,
  fetchUserActivityStats,
  ActivityEvent,
  getActivityTypeInfo
} from '@/services/user-activity.service';
import { UserActivityTimeline } from '@/components/portal/admin/UserActivityTimeline';
import { UserAvatar } from '@/components/portal/admin/UserAvatar';
import { formatDistanceToNow } from 'date-fns';

interface UserOption {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface ActivityStats {
  total: number;
  by_type: {
    survey: number;
    event: number;
    update: number;
    calculator: number;
    referral: number;
    auth: number;
    profile: number;
  };
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}

export function UserActivity() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Check URL params when they change
  useEffect(() => {
    const userIdParam = searchParams.get('user_id');
    if (userIdParam) {
      console.log('Setting user from URL param:', userIdParam);
      setSelectedUserId(userIdParam);
    }
  }, [searchParams]);

  // Fetch activity when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchActivity();
    } else {
      setActivities([]);
      setFilteredActivities([]);
      setStats(null);
    }
  }, [selectedUserId]);

  // Apply filters when activities or filter values change
  useEffect(() => {
    applyFilters();
  }, [activities, searchTerm, typeFilter, dateRangeFilter]);

  const fetchUsers = async () => {
    try {
      // Use user_acquisition_details view to get the same users as User Directory
      const { data, error } = await supabase
        .from('user_acquisition_details')
        .select('user_id, email, first_name, last_name')
        .order('email');

      if (error) throw error;

      // Map to expected interface (user_id -> id)
      const mappedUsers = (data || []).map(user => ({
        id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }));

      // Sort alphabetically by first name
      mappedUsers.sort((a, b) => {
        const nameA = a.first_name || a.email;
        const nameB = b.first_name || b.email;
        return nameA.localeCompare(nameB);
      });

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Failed to load user list",
        variant: "destructive"
      });
    }
  };

  const fetchActivity = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      // Fetch activity and stats in parallel
      const [activityData, statsData] = await Promise.all([
        fetchUserActivity(selectedUserId),
        fetchUserActivityStats(selectedUserId)
      ]);

      setActivities(activityData.activities);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast({
        title: "Error loading activity",
        description: "Failed to load user activity data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(term) ||
        activity.description.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
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

      filtered = filtered.filter(activity =>
        new Date(activity.timestamp) > cutoffDate
      );
    }

    setFilteredActivities(filtered);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDateRangeFilter('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || dateRangeFilter !== 'all';

  const selectedUser = users.find(u => u.id === selectedUserId);
  const userName = selectedUser
    ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.email
    : '';

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setUserSearchOpen(false);
    // Update URL params
    setSearchParams({ user_id: userId });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Activity</h2>
        <p className="text-gray-600 mt-1">
          View detailed activity timeline for individual users
        </p>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {selectedUser && (
              <UserAvatar
                firstName={selectedUser.first_name}
                lastName={selectedUser.last_name}
                email={selectedUser.email}
                size="lg"
              />
            )}
            <CardTitle className="text-lg">
              {selectedUser ? userName : 'Select User'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Select Avatars */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Quick Select</label>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`transition-all ${
                    selectedUserId === user.id
                      ? 'scale-110 ring-2 ring-purple-500 ring-offset-2 rounded-full'
                      : ''
                  }`}
                >
                  <UserAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    email={user.email}
                    size="lg"
                    onClick={() => handleUserSelect(user.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or search</span>
            </div>
          </div>

          {/* Search Box */}
          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={userSearchOpen}
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  {selectedUserId
                    ? userName
                    : "Search for a user..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[600px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search by name or email..." />
                <CommandList>
                  <CommandEmpty>No user found.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => {
                      const displayName = user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.last_name || 'Unknown';

                      return (
                        <CommandItem
                          key={user.id}
                          value={`${displayName} ${user.email}`}
                          onSelect={() => handleUserSelect(user.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              selectedUserId === user.id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{displayName}</span>
                            <span className="text-sm text-gray-500">{user.email}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {selectedUserId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedUserId('');
                setSearchParams({});
              }}
              className="mt-2"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {selectedUserId && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">All events</p>
            </CardContent>
          </Card>

          {(['survey', 'event', 'update', 'calculator', 'referral', 'auth', 'profile'] as const).map(type => {
            const typeInfo = getActivityTypeInfo(type);
            return (
              <Card key={type}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <span>{typeInfo.icon}</span>
                    {typeInfo.label}s
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.by_type[type]}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.total > 0
                      ? `${Math.round((stats.by_type[type] / stats.total) * 100)}%`
                      : '0%'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Activity Timeline */}
      {selectedUserId && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search activity by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Row */}
                <div className="flex flex-wrap gap-3">
                  {/* Type Filter */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Activity Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="survey">📋 Surveys ({stats?.by_type.survey || 0})</SelectItem>
                      <SelectItem value="event">📅 Events ({stats?.by_type.event || 0})</SelectItem>
                      <SelectItem value="update">📢 Updates ({stats?.by_type.update || 0})</SelectItem>
                      <SelectItem value="calculator">🧮 Calculators ({stats?.by_type.calculator || 0})</SelectItem>
                      <SelectItem value="referral">👥 Referrals ({stats?.by_type.referral || 0})</SelectItem>
                      <SelectItem value="auth">🔐 Authentication ({stats?.by_type.auth || 0})</SelectItem>
                      <SelectItem value="profile">👤 Profile ({stats?.by_type.profile || 0})</SelectItem>
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
                    Showing {filteredActivities.length} of {activities.length} activities
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading activity...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {stats && stats.date_range.earliest && (
                <div className="text-sm text-gray-600">
                  Activity from {formatDistanceToNow(new Date(stats.date_range.earliest), { addSuffix: true })}
                  {' '}to{' '}
                  {formatDistanceToNow(new Date(stats.date_range.latest!), { addSuffix: true })}
                </div>
              )}
              <UserActivityTimeline
                activities={filteredActivities}
                onActivityClick={(activity) => {
                  // Future enhancement: Open detail modal for the activity
                  console.log('Activity clicked:', activity);
                }}
              />
            </>
          )}
        </>
      )}

      {/* Empty State - No User Selected */}
      {!selectedUserId && (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Select a user above to view their activity timeline</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
