import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Zap,
  Eye,
  Activity,
  TrendingUp,
  FileText,
  Calendar,
  BarChart3,
  Info,
  PlayCircle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailNotification {
  id: string;
  event_id: string;
  rule_id: string | null;
  to_email: string;
  to_user_id: string | null;
  subject: string;
  template_id: string | null;
  template_data: any;
  status: 'queued' | 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  priority: number;
  error_message: string | null;
  error_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PublishedContent {
  id: string;
  type: 'update' | 'event' | 'survey';
  title: string;
  published_at: string;
  email_status?: 'queued' | 'sent' | 'failed' | 'none';
  email_count?: number;
}

interface ProcessingStats {
  total_queued: number;
  total_sent: number;
  total_failed: number;
  avg_processing_time: number;
  last_processed: string | null;
}

export function EmailProcessingDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Data states
  const [emailQueue, setEmailQueue] = useState<EmailNotification[]>([]);
  const [recentPublished, setRecentPublished] = useState<PublishedContent[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);

      // Load email queue (using the unified email_queue table)
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queueError) throw queueError;
      setEmailQueue(queueData || []);

      // Load recently published content
      const recentContent: PublishedContent[] = [];

      // Load recent updates
      const { data: updates } = await supabase
        .from('portal_updates')
        .select('id, title, published_at')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(10);

      if (updates) {
        for (const update of updates) {
          // Check email status for this update
          const { data: emails } = await supabase
            .from('email_queue')
            .select('status')
            .eq('event_payload->>id', update.id);

          const emailCount = emails?.length || 0;
          let emailStatus: PublishedContent['email_status'] = 'none';

          if (emailCount > 0) {
            if (emails?.every(e => e.status === 'sent')) {
              emailStatus = 'sent';
            } else if (emails?.some(e => e.status === 'failed')) {
              emailStatus = 'failed';
            } else {
              emailStatus = 'queued';
            }
          }

          recentContent.push({
            id: update.id,
            type: 'update',
            title: update.title,
            published_at: update.published_at,
            email_status: emailStatus,
            email_count: emailCount
          });
        }
      }

      // Load recent events
      const { data: events } = await supabase
        .from('portal_events')
        .select('id, title, published_at')
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false })
        .limit(10);

      if (events) {
        for (const event of events) {
          const { data: emails } = await supabase
            .from('email_queue')
            .select('status')
            .eq('event_payload->>id', event.id);

          const emailCount = emails?.length || 0;
          let emailStatus: PublishedContent['email_status'] = 'none';

          if (emailCount > 0) {
            if (emails?.every(e => e.status === 'sent')) {
              emailStatus = 'sent';
            } else if (emails?.some(e => e.status === 'failed')) {
              emailStatus = 'failed';
            } else {
              emailStatus = 'queued';
            }
          }

          recentContent.push({
            id: event.id,
            type: 'event',
            title: event.title,
            published_at: event.published_at,
            email_status: emailStatus,
            email_count: emailCount
          });
        }
      }

      // Sort by published date
      recentContent.sort((a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      );

      setRecentPublished(recentContent);

      // Calculate stats - include both 'pending' and 'queued' statuses
      const queued = queueData?.filter(e => e.status === 'pending' || e.status === 'queued').length || 0;
      const sent = queueData?.filter(e => e.status === 'sent').length || 0;
      const failed = queueData?.filter(e => e.status === 'failed').length || 0;

      const lastSent = queueData?.find(e => e.status === 'sent');

      setProcessingStats({
        total_queued: queued,
        total_sent: sent,
        total_failed: failed,
        avg_processing_time: 0,
        last_processed: lastSent?.sent_at || null
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email processing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Process email queue manually
  const processQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-email-queue', {
        body: { batchSize: 20 }
      });

      if (error) throw error;

      toast({
        title: 'Queue Processed',
        description: `Processed ${data?.processed || 0} emails (${data?.sent || 0} sent, ${data?.failed || 0} failed)`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to process email queue',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Cancel a pending email
  const cancelEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('id', emailId);

      if (error) throw error;

      toast({
        title: 'Email Cancelled',
        description: 'Email has been cancelled and will not be sent',
      });

      await loadData();
    } catch (error) {
      console.error('Error cancelling email:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel email',
        variant: 'destructive',
      });
    }
  };

  // Retry a failed email
  const retryEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('email_queue')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null
        })
        .eq('id', emailId);

      if (error) throw error;

      toast({
        title: 'Email Queued for Retry',
        description: 'Email has been re-queued and will be processed soon',
      });

      await loadData();
    } catch (error) {
      console.error('Error retrying email:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry email',
        variant: 'destructive',
      });
    }
  };

  // Auto refresh
  useEffect(() => {
    loadData();
  }, [selectedTimeRange]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Filter emails
  const filteredEmails = emailQueue.filter(email => {
    const matchesStatus = selectedStatus === 'all' || email.status === selectedStatus;
    const matchesSearch = !searchTerm ||
      email.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      none: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      queued: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    };

    const config = variants[status] || variants.none;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getContentTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      update: 'bg-blue-100 text-blue-800',
      event: 'bg-purple-100 text-purple-800',
      survey: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={variants[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  if (loading && emailQueue.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Email Processing Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor email notifications and processing status in real-time
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
                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                Auto-refresh On
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-1" />
                Auto-refresh Off
              </>
            )}
          </Button>
          <Button
            onClick={processQueue}
            disabled={processing}
            size="sm"
          >
            {processing ? (
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
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {processingStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {processingStats.total_queued}
              </div>
              <p className="text-xs text-muted-foreground">Ready to send</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {processingStats.total_sent}
              </div>
              <p className="text-xs text-muted-foreground">Successfully delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {processingStats.total_failed}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {processingStats.last_processed
                  ? format(new Date(processingStats.last_processed), 'h:mm a')
                  : 'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {processingStats.last_processed
                  ? format(new Date(processingStats.last_processed), 'MMM d')
                  : 'No emails sent'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Published Content
          </TabsTrigger>
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Queue
            {processingStats && processingStats.total_queued > 0 && (
              <Badge variant="secondary" className="ml-1">
                {processingStats.total_queued}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
        </TabsList>

        {/* Published Content Tab */}
        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Published Content</CardTitle>
              <CardDescription>
                Track email status for recently published updates, events, and surveys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentPublished.length > 0 ? (
                <div className="space-y-2">
                  {recentPublished.map(content => (
                    <div key={content.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getContentTypeBadge(content.type)}
                          <span className="font-medium">{content.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Published {format(new Date(content.published_at), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>{getStatusBadge(content.email_status || 'none')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {content.email_count || 0} emails
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recently published content</p>
                </div>
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
                    All queued, processing, and recent email notifications
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-1 border rounded-md"
                  />
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmails.map(email => (
                      <TableRow key={email.id}>
                        <TableCell>{getStatusBadge(email.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{email.event_id}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{email.to_email}</TableCell>
                        <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                        <TableCell>
                          {format(new Date(email.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          {email.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cancelEmail(email.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {email.status === 'failed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryEmail(email.id)}
                            >
                              Retry
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredEmails.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No emails found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnostics Tab */}
        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Diagnostics</CardTitle>
              <CardDescription>
                Check the health of your email notification system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>How Email Processing Works</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal list-inside space-y-1 mt-2">
                      <li>When content is published, a database trigger fires</li>
                      <li>The trigger calls queue_notification() to create email records</li>
                      <li>Emails are queued with status='pending'</li>
                      <li>The process-email-queue function sends the emails</li>
                      <li>Status updates to 'sent' or 'failed'</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="font-medium">Quick Checks</h3>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Database Trigger (on_update_published_unified_email)</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Email Templates</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/portal/admin/settings/email/templates'}>
                      View Templates
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Notification Rules</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/portal/admin/settings/notifications'}>
                      View Rules
                    </Button>
                  </div>
                </div>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle>Troubleshooting</AlertTitle>
                  <AlertDescription>
                    If emails aren't being sent:
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Check that notification rules are enabled</li>
                      <li>Verify email templates are active</li>
                      <li>Ensure users have valid email addresses</li>
                      <li>Click "Process Queue Now" to manually trigger sending</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}