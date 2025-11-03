import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  FileText,
  Calendar,
  Bell,
  UserPlus,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import {
  fetchDashboardMetrics,
  fetchTopUsers,
  fetchTopContent,
  type DashboardMetrics,
  type TopUser,
  type ContentPerformance
} from '@/services/analytics-dashboard.service';
import { UserAvatar } from '@/components/portal/admin/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { adminRoute } from '@/lib/portal/navigation';
import { toast } from '@/hooks/use-toast';

export function PortalAdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topContent, setTopContent] = useState<ContentPerformance[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [metricsData, usersData, contentData] = await Promise.all([
        fetchDashboardMetrics(),
        fetchTopUsers(10),
        fetchTopContent(5)
      ]);

      setMetrics(metricsData);
      setTopUsers(usersData);
      setTopContent(contentData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  const getTrendIcon = (value: number, threshold: number = 50) => {
    if (value > threshold) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < threshold) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'survey':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'update':
        return <Bell className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getContentTypeBadge = (type: string) => {
    switch (type) {
      case 'survey':
        return 'bg-blue-100 text-blue-700';
      case 'event':
        return 'bg-purple-100 text-purple-700';
      case 'update':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of portal engagement and performance
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeUsers} active (
              {metrics.totalUsers > 0
                ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100)
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        {/* New Users This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {/* Survey Completion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Survey Completion</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.surveyResponseRate}%
              {getTrendIcon(metrics.surveyResponseRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeSurveys} active surveys
            </p>
          </CardContent>
        </Card>

        {/* Event Attendance Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.eventAttendanceRate}%
              {getTrendIcon(metrics.eventAttendanceRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.upcomingEvents} upcoming events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Update Read Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Update Read Rate</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.updateReadRate}%
              {getTrendIcon(metrics.updateReadRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalUpdates} total updates
            </p>
          </CardContent>
        </Card>

        {/* Referral Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Referral Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {metrics.referralConversionRate}%
              {getTrendIcon(metrics.referralConversionRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalReferrals} total referrals
            </p>
          </CardContent>
        </Card>

        {/* Overall Engagement */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portal Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {Math.round(
                (metrics.surveyResponseRate +
                  metrics.eventAttendanceRate +
                  metrics.updateReadRate) /
                  3
              )}
              %
              {getTrendIcon(
                Math.round(
                  (metrics.surveyResponseRate +
                    metrics.eventAttendanceRate +
                    metrics.updateReadRate) /
                    3
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">Average across all content</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Most Engaged Users</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Top users by engagement score (last 30 days)
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(adminRoute('users'))}
          >
            View All Users
          </Button>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No user data available</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(adminRoute(`users/activity?user_id=${user.user_id}`))}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Avatar */}
                  <UserAvatar
                    firstName={user.first_name}
                    lastName={user.last_name}
                    email={user.email}
                    size="md"
                  />

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.first_name || user.last_name || user.email}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>

                  {/* Engagement Score */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {user.engagement_score}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>

                  {/* Activity Count */}
                  <div className="text-center">
                    <div className="text-lg font-semibold">{user.activities_count}</div>
                    <div className="text-xs text-muted-foreground">Activities</div>
                  </div>

                  {/* Last Active */}
                  <div className="text-right text-sm text-muted-foreground w-32">
                    {formatDistanceToNow(new Date(user.last_active), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Content Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Content</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Most engaged content across all types
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {topContent.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No content data available</p>
          ) : (
            <div className="space-y-3">
              {topContent.map((content, index) => (
                <div
                  key={`${content.type}-${content.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (content.type === 'survey') {
                      navigate(adminRoute(`data/survey-analytics?survey_id=${content.id}`));
                    }
                    // Add navigation for events and updates when those pages are built
                  }}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Type Badge */}
                  <Badge className={getContentTypeBadge(content.type)}>
                    <div className="flex items-center gap-1">
                      {getContentTypeIcon(content.type)}
                      <span className="capitalize">{content.type}</span>
                    </div>
                  </Badge>

                  {/* Content Title */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{content.title}</div>
                    <div className="text-sm text-muted-foreground">
                      Created {formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Engagement Count */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {content.engagement_count}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {content.type === 'survey' && 'Responses'}
                      {content.type === 'event' && 'Registrations'}
                      {content.type === 'update' && 'Reads'}
                    </div>
                  </div>

                  {/* View Icon */}
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate(adminRoute('data/survey-analytics'))}
            >
              <FileText className="h-4 w-4 mr-2" />
              Survey Analytics
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate(adminRoute('users'))}
            >
              <Users className="h-4 w-4 mr-2" />
              User Directory
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate(adminRoute('data/event-analytics'))}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Event Analytics
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate(adminRoute('data/engagement'))}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Engagement Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
