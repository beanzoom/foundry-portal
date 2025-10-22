import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TemplateModal } from '@/components/portal/admin/notifications/TemplateModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Bell,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Zap,
  Eye,
  Play,
  Pause,
  ChevronRight,
  Calendar,
  FileText,
  BarChart,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  category: 'user_action' | 'admin_action' | 'system' | 'security';
}

interface NotificationRule {
  id: string;
  event_id: string;
  name: string;
  description: string;
  recipient_list_id: string;
  template_id: string;
  enabled: boolean;
  priority: number;
}

interface EmailNotification {
  id: string;
  event_id: string;
  to_email: string;
  subject: string;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: number;
  created_at: string;
  sent_at?: string;
  error_message?: string;
  error_count: number;
}

interface NotificationStats {
  summary: {
    pending_count: number;
    processing_count: number;
    sent_count: number;
    failed_count: number;
    retry_count: number;
    avg_send_time_seconds: number;
    oldest_pending: string;
  };
  by_event: Array<{
    event_id: string;
    count: number;
  }>;
}

export function NotificationCenter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('24');

  // UI states
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch events
      const { data: eventsData } = await supabase
        .from('notification_events')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      // Fetch rules
      const { data: rulesData } = await supabase
        .from('notification_rules')
        .select('*')
        .order('event_id', { ascending: true });

      // Fetch recent notifications
      const hoursAgo = new Date();
      hoursAgo.setHours(hoursAgo.getHours() - parseInt(timeRange));

      const { data: notificationsData } = await supabase
        .from('email_notifications')
        .select('*')
        .gte('created_at', hoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch stats
      const { data: statsData } = await supabase
        .rpc('get_notification_stats', { p_hours: parseInt(timeRange) });

      setEvents(eventsData || []);
      setRules(rulesData || []);
      setNotifications(notificationsData || []);
      setStats(statsData);

    } catch (error) {
      console.error('Error fetching notification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Process queue manually
  const processQueue = async () => {
    setProcessingQueue(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { batchSize: 20 },
      });

      if (error) throw error;

      toast({
        title: 'Queue Processed',
        description: `Processed ${data.processed} notifications (${data.sent} sent, ${data.failed} failed)`,
      });

      fetchData();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to process email queue',
        variant: 'destructive',
      });
    } finally {
      setProcessingQueue(false);
    }
  };

  // Toggle rule enabled status
  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Rule Updated',
        description: `Notification rule ${enabled ? 'enabled' : 'disabled'}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule',
        variant: 'destructive',
      });
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || n.event_id === eventFilter;
    const matchesSearch = !searchTerm ||
      n.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesEvent && matchesSearch;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', icon: Clock },
      processing: { variant: 'default', icon: RefreshCw },
      sent: { variant: 'default', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive', icon: XCircle },
      cancelled: { variant: 'outline', icon: XCircle },
    };

    const config = variants[status] || { variant: 'default', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const variants: Record<string, string> = {
      user_action: 'bg-blue-100 text-blue-800',
      admin_action: 'bg-purple-100 text-purple-800',
      system: 'bg-gray-100 text-gray-800',
      security: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[category] || 'bg-gray-100 text-gray-800'}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  // Get audience badge based on recipient list
  const getAudienceBadge = (recipientListId: string) => {
    // Note: Full recipient list name resolution would require fetching recipient_lists
    // For now, show a generic badge. Consider enhancing this to fetch and display actual list names.
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Users className="h-3 w-3 mr-1" />
        Recipient List
      </Badge>
    );
  };

  // Handle template modal
  const openTemplateModal = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setSelectedTemplateId(null);
    setTemplateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and monitor all system notifications in one place
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50' : ''}
          >
            {autoRefresh ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Auto-refresh On
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Auto-refresh Off
              </>
            )}
          </Button>
          <Button
            onClick={processQueue}
            disabled={processingQueue}
            size="sm"
          >
            {processingQueue ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1" />
                Process Queue Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.pending_count}</div>
              <p className="text-xs text-gray-500">Ready to send</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.summary.processing_count}</div>
              <p className="text-xs text-gray-500">Being sent now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.summary.sent_count}</div>
              <p className="text-xs text-gray-500">Last {timeRange} hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.summary.failed_count}</div>
              <p className="text-xs text-gray-500">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.summary.avg_send_time_seconds
                  ? `${Math.round(stats.summary.avg_send_time_seconds)}s`
                  : '-'}
              </div>
              <p className="text-xs text-gray-500">To send</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="queue">
            <Mail className="h-4 w-4 mr-2" />
            Email Queue
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Notification Rules
          </TabsTrigger>
          <TabsTrigger value="events">
            <FileText className="h-4 w-4 mr-2" />
            Event Types
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Performance Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{events.length}</div>
              <div className="text-sm text-blue-700">Event Types</div>
              <div className="text-xs text-muted-foreground mt-1">Available triggers</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter(r => r.enabled).length}
              </div>
              <div className="text-sm text-green-700">Active Rules</div>
              <div className="text-xs text-muted-foreground mt-1">Currently monitoring</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.summary.sent_count || 0}
              </div>
              <div className="text-sm text-purple-700">Emails Sent</div>
              <div className="text-xs text-muted-foreground mt-1">Last {timeRange} hours</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {stats?.summary.avg_send_time_seconds
                  ? `${Math.round(stats.summary.avg_send_time_seconds)}s`
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-orange-700">Avg. Send Time</div>
              <div className="text-xs text-muted-foreground mt-1">Processing speed</div>
            </div>
          </div>

          {/* System Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Queue Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium">{stats?.summary.pending_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium text-red-600">{stats?.summary.failed_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {stats?.summary.sent_count && stats?.summary.failed_count
                      ? `${Math.round((stats.summary.sent_count / (stats.summary.sent_count + stats.summary.failed_count)) * 100)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
                {stats?.summary.oldest_pending && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">Oldest Pending</div>
                    <div className="text-sm font-medium">
                      {format(new Date(stats.summary.oldest_pending), 'MMM d, h:mm a')}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Notification Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Rules</span>
                  <span className="font-medium">{rules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">
                    {rules.filter(r => r.enabled).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Disabled</span>
                  <span className="font-medium text-gray-600">
                    {rules.filter(r => !r.enabled).length}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">Event Coverage</div>
                  <div className="text-sm font-medium">
                    {events.length > 0 ? (
                      <>
                        {Math.round((new Set(rules.map(r => r.event_id)).size / events.length) * 100)}% of events have rules
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Set(rules.map(r => r.event_id)).size} of {events.length} events configured
                        </div>
                      </>
                    ) : (
                      'No events'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Event Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Events</span>
                  <span className="font-medium">{events.length}</span>
                </div>
                {['user_action', 'admin_action', 'system', 'security'].map(category => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="font-medium">
                      {events.filter(e => e.category === category).length}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Top events triggering notifications (Last {timeRange} hours)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.by_event && stats.by_event.length > 0 ? (
                  <div className="space-y-3">
                    {stats.by_event.slice(0, 8).map(event => {
                      const eventInfo = events.find(e => e.id === event.event_id);
                      const activeRules = rules.filter(r => r.event_id === event.event_id && r.enabled).length;
                      return (
                        <div key={event.event_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {eventInfo?.name || event.event_id}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activeRules} active rule{activeRules !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{event.count}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              notifications
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No activity in the selected time range</p>
                    <p className="text-sm">Notifications will appear here when events are triggered</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Rule Configuration Status
                </CardTitle>
                <CardDescription>
                  Events and their notification setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 8).map(event => {
                    const eventRules = rules.filter(r => r.event_id === event.id);
                    const activeRules = eventRules.filter(r => r.enabled);
                    const hasRules = eventRules.length > 0;

                    return (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{event.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {getCategoryBadge(event.category)}
                          </div>
                        </div>
                        <div className="text-right">
                          {hasRules ? (
                            <div>
                              <Badge className={activeRules.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {activeRules.length > 0 ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {activeRules.length} active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Disabled
                                  </>
                                )}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              No rules
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {events.length > 8 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('events')}
                      className="w-full"
                    >
                      View all {events.length} events
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>
                Overall notification system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>

              {(stats?.summary.failed_count || 0) > 0 && (
                <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Attention:</strong> {stats?.summary.failed_count} notifications failed in the last {timeRange} hours.{' '}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-yellow-700 underline"
                      onClick={() => {
                        setActiveTab('queue');
                        setStatusFilter('failed');
                      }}
                    >
                      View failed notifications →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {(stats?.summary.pending_count || 0) > 10 && (
                <Alert className="mt-4 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Queue Status:</strong> {stats?.summary.pending_count} notifications pending. Consider processing the queue if needed.{' '}
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-blue-700 underline"
                      onClick={() => setActiveTab('queue')}
                    >
                      View queue →
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Queue Tab */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Email Queue</CardTitle>
                  <CardDescription>
                    Monitor and manage queued notifications
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Last hour</SelectItem>
                      <SelectItem value="6">Last 6 hours</SelectItem>
                      <SelectItem value="24">Last 24 hours</SelectItem>
                      <SelectItem value="168">Last week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by email or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map(notification => {
                      const event = events.find(e => e.id === notification.event_id);
                      return (
                        <TableRow key={notification.id}>
                          <TableCell>{getStatusBadge(notification.status)}</TableCell>
                          <TableCell>
                            <span className="text-sm">{event?.name || notification.event_id}</span>
                          </TableCell>
                          <TableCell>{notification.to_email}</TableCell>
                          <TableCell className="max-w-xs truncate">{notification.subject}</TableCell>
                          <TableCell>
                            {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>
                            {notification.sent_at
                              ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedNotification(notification)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {filteredNotifications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No notifications found matching your filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Rules</CardTitle>
              <CardDescription>
                Configure when and how notifications are sent. Includes portal referrals, surveys, events, user actions, and admin alerts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Enabled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => {
                    const event = events.find(e => e.id === rule.event_id);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event?.name}</div>
                            <div className="text-xs text-gray-500">{rule.event_id}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{rule.name}</div>
                            <div className="text-xs text-gray-500">{rule.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAudienceBadge(rule.recipient_list_id)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTemplateModal(rule.template_id)}
                            className="h-auto p-1 hover:bg-blue-50"
                          >
                            <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors">
                              {rule.template_id}
                            </code>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Types Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Events</CardTitle>
              <CardDescription>
                All system events that can trigger notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['user_action', 'admin_action', 'system', 'security'].map(category => (
                  <div key={category}>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      {getCategoryBadge(category)}
                      {category.replace('_', ' ').charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                    </h3>
                    <div className="grid gap-2 ml-4">
                      {events
                        .filter(e => e.category === category)
                        .map(event => (
                          <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{event.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                                <code className="text-xs text-gray-500 mt-1 block">
                                  Event ID: {event.id}
                                </code>
                              </div>
                              <div className="text-sm text-gray-500">
                                {rules.filter(r => r.event_id === event.id && r.enabled).length} active rules
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedNotification.status)}</div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{selectedNotification.priority}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event</Label>
                  <div className="mt-1">{selectedNotification.event_id}</div>
                </div>
                <div>
                  <Label>Recipient</Label>
                  <div className="mt-1">{selectedNotification.to_email}</div>
                </div>
              </div>

              <div>
                <Label>Subject</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded">{selectedNotification.subject}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <div className="mt-1">
                    {format(new Date(selectedNotification.created_at), 'PPpp')}
                  </div>
                </div>
                <div>
                  <Label>Sent</Label>
                  <div className="mt-1">
                    {selectedNotification.sent_at
                      ? format(new Date(selectedNotification.sent_at), 'PPpp')
                      : 'Not sent yet'}
                  </div>
                </div>
              </div>

              {selectedNotification.error_message && (
                <Alert className="border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {selectedNotification.error_message}
                    <br />
                    <span className="text-sm">Attempts: {selectedNotification.error_count}</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Modal */}
      <TemplateModal
        templateId={selectedTemplateId}
        isOpen={templateModalOpen}
        onClose={closeTemplateModal}
        onSave={() => {
          toast({
            title: 'Template Updated',
            description: 'Email template has been updated successfully',
          });
        }}
      />
    </div>
  );
}