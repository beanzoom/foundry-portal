import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useMarkets, 
  useContacts, 
  useContactAnalytics 
} from '@/hooks/useContactTracking';
import { 
  Users, 
  Building, 
  MapPin,
  BarChart3, 
  Activity,
  TrendingUp,
  Phone,
  Mail,
  UserPlus,
  Calendar,
  Target,
  Briefcase,
  Database,
  ChevronRight,
  Plus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Import components (to be created)
import { ContactList } from '@/components/portal/admin/contacts/ContactList';
import { HierarchyManager } from '@/components/portal/admin/contacts/HierarchyManager';
import { ContactAnalytics } from '@/components/portal/admin/contacts/ContactAnalytics';
import { ActivityFeed } from '@/components/portal/admin/contacts/ActivityFeed';

export function PortalAdminContacts() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to Dashboard
  const { analytics, loading: analyticsLoading } = useContactAnalytics();
  const { contacts, loading: contactsLoading, totalCount } = useContacts();
  const { markets, loading: marketsLoading } = useMarkets();

  // Sync tab state with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/contacts/organization')) {
      setActiveTab('organization');
    } else if (path.includes('/contacts/analytics')) {
      setActiveTab('analytics');
    } else if (path.includes('/contacts/activity')) {
      setActiveTab('activity');
    } else if (path === '/portal/admin/contacts' || path === '/portal/admin/contacts/') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  // Handle tab changes by updating URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case 'dashboard':
        navigate('/portal/admin/contacts');
        break;
      case 'organization':
        navigate('/portal/admin/contacts/organization');
        break;
      case 'analytics':
        navigate('/portal/admin/contacts/analytics');
        break;
      case 'activity':
        navigate('/portal/admin/contacts/activity');
        break;
    }
  };

  // Calculate key metrics
  const metrics = {
    totalContacts: analytics?.summary?.total_contacts || 0,
    totalMarkets: analytics?.summary?.total_markets || 0,
    totalStations: analytics?.summary?.total_stations || 0,
    totalDSPs: analytics?.summary?.total_dsps || 0,
    totalInteractions: analytics?.summary?.total_interactions || 0,
    conversionRate: analytics?.conversion_funnel?.new_to_contacted || 0,
    activeContacts: analytics?.contacts_by_status?.active || 0,
    newThisWeek: analytics?.recent_activity?.slice(0, 7).reduce((sum, day) => sum + day.new_contacts, 0) || 0,
  };

  // Status distribution for progress bars
  const statusDistribution = analytics?.contacts_by_status || {};
  const totalStatusCount = Object.values(statusDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Simplified Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Contact Tracking</h1>
        </div>
      </div>

      {/* Main Content Tabs - Moved to top for immediate access */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building className="h-4 w-4" />
            Organization
            {metrics.totalContacts > 0 && (
              <Badge variant="secondary" className="ml-1">
                {metrics.totalContacts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Overview View */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Contacts Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.totalContacts.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <UserPlus className="h-3 w-3 mr-1" />
                      <span className="text-green-600">+{metrics.newThisWeek}</span>
                      <span className="ml-1">this week</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active DSPs Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active DSPs</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.totalDSPs.toLocaleString()}</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Building className="h-3 w-3 mr-1" />
                      <span>{metrics.totalStations} stations</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Total Interactions Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.totalInteractions.toLocaleString()}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {analytics?.interactions_by_type?.call || 0}
                      </span>
                      <span className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {analytics?.interactions_by_type?.email || 0}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conversion Rate Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                      <span>{metrics.activeContacts} active</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Contact Pipeline Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['new', 'contacted', 'qualified', 'active'].map((status) => {
                    const count = statusDistribution[status] || 0;
                    const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
                    const statusConfig = {
                      new: { label: 'New', color: 'bg-gray-500' },
                      contacted: { label: 'Contacted', color: 'bg-blue-500' },
                      qualified: { label: 'Qualified', color: 'bg-yellow-500' },
                      active: { label: 'Active', color: 'bg-green-500' },
                    }[status] || { label: status, color: 'bg-gray-400' };

                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{statusConfig.label}</span>
                            <Badge variant="secondary" className="text-xs">
                              {count}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Contacts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Recent Contacts</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('organization')}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contacts.slice(0, 5).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contact.email || contact.phone}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {contact.contact_status || 'new'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Interaction Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interaction Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics?.interactions_by_type || {}).map(([type, count]) => {
                    const total = metrics.totalInteractions || 1;
                    const percentage = (count / total) * 100;
                    const icon = {
                      call: Phone,
                      email: Mail,
                      'in-person': Users,
                      other: Database,
                    }[type] || Database;
                    const Icon = icon;

                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium capitalize">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {count.toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {percentage.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">30-Day Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  {/* Activity chart will be implemented in ContactAnalytics component */}
                  <p>Activity chart visualization</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Tab - Unified Hierarchy View */}
        <TabsContent value="organization" className="space-y-4">
          <HierarchyManager />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <ContactAnalytics />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}