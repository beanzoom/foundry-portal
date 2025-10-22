import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  FileText, 
  ClipboardList, 
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { adminRoute } from '@/lib/portal/navigation';

interface PortalStats {
  updates: {
    total: number;
    published: number;
    draft: number;
    recent: Array<{
      id: string;
      title: string;
      status: string;
      created_at: string;
    }>;
  };
  surveys: {
    total: number;
    active: number;
    total_responses: number;
    completed_responses: number;
    recent: Array<{
      id: string;
      title: string;
      is_active: boolean;
      created_at: string;
    }>;
  };
  events: {
    total: number;
    upcoming: number;
    total_registrations: number;
    recent: Array<{
      id: string;
      title: string;
      event_type: string;
      start_datetime: string;
      status: string;
    }>;
  };
  users: {
    total_portal_users: number;
    active_today: number;
  };
}

export function PortalAdminDashboard() {
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_portal_admin_stats');
      
      if (error) throw error;
      
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchStats} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Manage and monitor the FleetDRMS DSP Foundry Portal
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total_portal_users || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.users.active_today || 0} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Updates</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.updates.published || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.updates.draft || 0} drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Surveys</CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.surveys.active || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.surveys.total_responses || 0} responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.events.upcoming || 0}</div>
            <p className="text-xs text-gray-500">
              {stats?.events.total_registrations || 0} registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Updates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Updates</CardTitle>
              <Link to={adminRoute('updates')}>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.updates.recent?.length ? (
                stats.updates.recent.map(update => (
                  <div key={update.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {update.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={update.status === 'published' ? 'default' : 'secondary'}>
                      {update.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No updates yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Surveys */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Surveys</CardTitle>
              <Link to={adminRoute('surveys')}>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.surveys.recent?.length ? (
                stats.surveys.recent.map(survey => (
                  <div key={survey.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {survey.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(survey.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={survey.is_active ? 'success' : 'secondary'}>
                      {survey.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No surveys yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Events</CardTitle>
              <Link to={adminRoute('events')}>
                <Button size="sm" variant="ghost">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.events.recent?.length ? (
                stats.events.recent.map(event => (
                  <div key={event.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start_datetime).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={event.event_type === 'virtual' ? 'outline' : 'default'}>
                      {event.event_type}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No events yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to={adminRoute('updates/new')}>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                New Update
              </Button>
            </Link>
            <Link to={adminRoute('surveys/new')}>
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="h-4 w-4 mr-2" />
                New Survey
              </Button>
            </Link>
            <Link to={adminRoute('events/new')}>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </Link>
            <Link to={adminRoute('analytics')}>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Survey Response Rate */}
      {stats?.surveys.total_responses && stats.surveys.total_responses > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Survey Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span className="font-medium">
                  {stats.surveys.completed_responses} / {stats.surveys.total_responses}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-violet-600 h-2 rounded-full"
                  style={{ 
                    width: `${(stats.surveys.completed_responses / stats.surveys.total_responses) * 100}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {Math.round((stats.surveys.completed_responses / stats.surveys.total_responses) * 100)}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
