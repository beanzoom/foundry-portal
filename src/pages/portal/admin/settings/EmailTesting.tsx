import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Eye,
  TestTube,
  Inbox,
  XCircle,
  Loader2,
  Info,
  Bug,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EmailBatch {
  id: string;
  notification_type: string;
  total_recipients: number;
  emails_sent?: number;
  emails_failed?: number;
  processed_count?: number;
  failed_count?: number;
  status: string;
  metadata: any;
  created_at: string;
  started_at?: string;
  completed_at?: string | null;
  error_message?: string | null;
  update_id?: string;
  survey_id?: string;
  event_id?: string;
}

interface EmailNotification {
  id: string;
  batch_id?: string;
  to_email: string;
  subject: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  retry_count?: number;
}

export function EmailTesting() {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<EmailBatch[]>([]);
  const [pendingBatches, setPendingBatches] = useState<EmailBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<EmailBatch | null>(null);
  const [batchNotifications, setBatchNotifications] = useState<EmailNotification[]>([]);

  // Debug state
  const [debugResult, setDebugResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [batchProcessResult, setBatchProcessResult] = useState<any>(null);
  
  // Test email form state
  const [contentType, setContentType] = useState<'update' | 'survey' | 'event'>('update');
  const [testMode, setTestMode] = useState<'real' | 'mock'>('mock');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [testEmails, setTestEmails] = useState(['']);
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  
  // Email preview state
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<any>(null);

  useEffect(() => {
    fetchBatches();
    fetchPendingBatches();
    fetchAvailableContent();
  }, [contentType]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email batches',
        variant: 'destructive'
      });
    }
  };

  const fetchPendingBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notification_batches')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending batches:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch pending batches',
          variant: 'destructive'
        });
      } else {
        // Filter for batches with recipients or where total_recipients might be null but should have recipients
        const validPendingBatches = (data || []).filter(batch =>
          batch.total_recipients > 0 ||
          (batch.total_recipients === null && (batch.update_id || batch.survey_id || batch.event_id))
        );
        setPendingBatches(validPendingBatches);
        console.log('Pending batches loaded:', validPendingBatches.length);
      }
    } catch (error) {
      console.error('Error fetching pending batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending batches',
        variant: 'destructive'
      });
    }
  };

  const fetchAvailableContent = async () => {
    try {
      let tableName = '';
      switch (contentType) {
        case 'update':
          tableName = 'portal_updates';
          break;
        case 'survey':
          tableName = 'portal_surveys';
          break;
        case 'event':
          tableName = 'portal_events';
          break;
      }

      const { data, error } = await supabase
        .from(tableName)
        .select('id, title, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAvailableContent(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const fetchBatchNotifications = async (batchId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('batch_id', batchId)
        .order('to_email');

      if (error) throw error;
      setBatchNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      // Validate emails
      const validEmails = testEmails.filter(email => email && email.includes('@'));
      if (validEmails.length === 0) {
        throw new Error('Please enter at least one valid email address');
      }

      // Prepare test data based on content type and mode
      let templateData: any = {};
      let subject = '';
      let template = '';

      if (testMode === 'mock') {
        // Use mock data
        switch (contentType) {
          case 'update':
            template = 'update-published';
            subject = '[TEST] New Portal Update: Test Update';
            templateData = {
              title: 'Test Update - Email System Verification',
              content: 'This is a test update to verify the email notification system is working correctly. This is mock content for testing purposes.',
              preview: 'This is a test update to verify the email notification system...',
              updateType: 'advisory',
              userName: 'Test User'
            };
            break;
          case 'survey':
            template = 'survey-published';
            subject = '[TEST] New Survey Available: Test Survey';
            templateData = {
              title: 'Test Survey - System Check',
              description: 'This is a test survey for email verification.',
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              userName: 'Test User'
            };
            break;
          case 'event':
            template = 'event-published';
            subject = '[TEST] Event Announcement: Test Event';
            templateData = {
              title: 'Test Event - Email Verification',
              description: 'This is a test event for the email system.',
              event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              location: 'Virtual / Test Location',
              userName: 'Test User'
            };
            break;
        }
      } else {
        // Use real content
        if (!selectedContentId) {
          throw new Error('Please select content to use for the test');
        }

        // Fetch the actual content
        let tableName = contentType === 'update' ? 'portal_updates' : 
                       contentType === 'survey' ? 'portal_surveys' : 'portal_events';
        
        const { data: content, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', selectedContentId)
          .single();

        if (error || !content) throw new Error('Failed to fetch content');

        switch (contentType) {
          case 'update':
            template = 'update-published';
            subject = `[TEST] ${content.update_type === 'compulsory' ? '[Required] ' : ''}New Portal Update: ${content.title}`;
            templateData = {
              title: content.title,
              content: content.content,
              preview: content.content?.substring(0, 200),
              updateType: content.update_type || 'advisory',
              userName: 'Test User'
            };
            break;
          case 'survey':
            template = 'survey-published';
            subject = `[TEST] New Survey Available: ${content.title}`;
            templateData = {
              title: content.title,
              description: content.description,
              deadline: content.deadline,
              userName: 'Test User'
            };
            break;
          case 'event':
            template = 'event-published';
            subject = `[TEST] Event Announcement: ${content.title}`;
            templateData = {
              title: content.title,
              description: content.description,
              event_date: content.event_date,
              location: content.location,
              userName: 'Test User'
            };
            break;
        }
      }

      // Send test emails
      const results = await Promise.all(
        validEmails.map(async (email) => {
          try {
            const { data, error } = await supabase.functions.invoke('send-email', {
              body: {
                to: email,
                subject,
                template,
                templateData
              }
            });

            if (error) throw error;
            return { email, success: true, data };
          } catch (error: any) {
            return { email, success: false, error: error.message };
          }
        })
      );

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast({
          title: 'Test Emails Sent',
          description: `Successfully sent ${successCount} test email(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
      } else {
        throw new Error('All test emails failed to send');
      }

      // Log failed emails
      results.filter(r => !r.success).forEach(r => {
        console.error(`Failed to send to ${r.email}:`, r.error);
      });

    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processPendingBatches = async () => {
    setLoading(true);
    setBatchProcessResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-update-notifications', {
        body: {
          trigger_source: 'manual',
          test_mode: false
        }
      });

      if (error) throw error;

      setBatchProcessResult(data);

      if (data?.success && data?.batch_id) {
        toast({
          title: 'Batch Processed',
          description: `Successfully sent ${data.emails_sent || 0} emails, ${data.emails_failed || 0} failed`,
        });
      } else {
        toast({
          title: 'No Pending Batches',
          description: data?.message || 'No pending email batches to process',
        });
      }

      // Refresh the batch lists
      await Promise.all([fetchBatches(), fetchPendingBatches()]);
    } catch (error: any) {
      console.error('Error processing batches:', error);
      setBatchProcessResult({ error: error.message });
      toast({
        title: 'Error',
        description: 'Failed to process email batches',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runDebugCheck = async () => {
    setLoading(true);
    setDebugResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { debug: true }
      });

      if (error) {
        setDebugResult({ error: error.message });
      } else {
        setDebugResult(data);
      }
    } catch (err: any) {
      setDebugResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testResendAPI = async (email: string) => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          test: true,
          testEmail: email
        }
      });

      if (error) {
        setTestResult({ error: error.message });
      } else {
        setTestResult(data);
        toast({
          title: data.success ? 'Test Successful' : 'Test Failed',
          description: data.message || 'Test email sent',
          variant: data.success ? 'default' : 'destructive'
        });
      }
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetBatchStatus = async (batchId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('email_notification_batches')
        .update({ status: newStatus })
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Batch Updated',
        description: `Batch status changed to ${newStatus}`,
      });

      await fetchBatches();
    } catch (error) {
      console.error('Error updating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to update batch status',
        variant: 'destructive'
      });
    }
  };

  const deleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_notification_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      toast({
        title: 'Batch Deleted',
        description: 'Email batch has been deleted',
      });

      await fetchBatches();
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete batch',
        variant: 'destructive'
      });
    }
  };

  const clearStuckBatches = async () => {
    try {
      const { error } = await supabase
        .from('email_notification_batches')
        .update({ status: 'failed' })
        .eq('status', 'processing')
        .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Older than 30 minutes

      if (error) throw error;

      toast({
        title: 'Stuck Batches Cleared',
        description: 'All stuck batches have been marked as failed',
      });

      await fetchBatches();
    } catch (error) {
      console.error('Error clearing stuck batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear stuck batches',
        variant: 'destructive'
      });
    }
  };

  const clearEmptyPendingBatches = async () => {
    try {
      // Delete pending batches with 0 or null recipients
      const { data, error } = await supabase
        .from('email_notification_batches')
        .delete()
        .eq('status', 'pending')
        .or('total_recipients.eq.0,total_recipients.is.null')
        .select();

      if (error) throw error;

      const count = data?.length || 0;
      toast({
        title: 'Empty Batches Cleared',
        description: `Removed ${count} empty pending batch${count !== 1 ? 'es' : ''}`,
      });

      await Promise.all([fetchBatches(), fetchPendingBatches()]);
    } catch (error) {
      console.error('Error clearing empty batches:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear empty batches',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unknown';
    const variants: Record<string, { variant: any; icon: any; className?: string }> = {
      pending: { variant: 'outline', icon: Clock, className: 'border-amber-300 bg-amber-50 text-amber-700' },
      processing: { variant: 'default', icon: RefreshCw, className: 'bg-blue-500 text-white' },
      completed: { variant: 'default', icon: CheckCircle, className: 'bg-green-500 text-white' },
      failed: { variant: 'destructive', icon: XCircle, className: 'bg-red-500 text-white' },
      cancelled: { variant: 'secondary', icon: XCircle, className: 'bg-gray-500 text-white' }
    };

    const config = variants[statusLower] || { variant: 'outline', icon: AlertCircle, className: '' };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className={`flex items-center gap-1 ${config.className || ''}`}>
        <Icon className="h-3 w-3" />
        {status || 'unknown'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Testing & Management</h1>
        <p className="text-gray-600 mt-2">Test email notifications and manage email batches</p>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue">
            <Inbox className="h-4 w-4 mr-2" />
            Email Queue
          </TabsTrigger>
          <TabsTrigger value="test">
            <TestTube className="h-4 w-4 mr-2" />
            Test Emails
          </TabsTrigger>
          <TabsTrigger value="diagnostics">
            <Bug className="h-4 w-4 mr-2" />
            Diagnostics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Email</CardTitle>
              <CardDescription>
                Send test email notifications without affecting all users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Portal Update</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Mode */}
              <div className="space-y-2">
                <Label>Test Scenario</Label>
                <RadioGroup value={testMode} onValueChange={(value: any) => setTestMode(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mock" id="mock" />
                    <Label htmlFor="mock">Use Mock Content (auto-generated)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="real" id="real" />
                    <Label htmlFor="real">Use Real Content (select from existing)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Content Selection (if real mode) */}
              {testMode === 'real' && (
                <div className="space-y-2">
                  <Label>Select {contentType === 'update' ? 'Update' : contentType === 'survey' ? 'Survey' : 'Event'}</Label>
                  <Select value={selectedContentId} onValueChange={setSelectedContentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose content..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContent.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Test Recipients */}
              <div className="space-y-2">
                <Label>Test Recipients</Label>
                {testEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...testEmails];
                        newEmails[index] = e.target.value;
                        setTestEmails(newEmails);
                      }}
                    />
                    {testEmails.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newEmails = testEmails.filter((_, i) => i !== index);
                          setTestEmails(newEmails);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTestEmails([...testEmails, ''])}
                >
                  Add Another Email
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={sendTestEmail}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          {/* Pending Batches Alert */}
          {batches.filter(b => b.status === 'pending').length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900">Pending Email Batches</AlertTitle>
              <AlertDescription className="text-amber-700">
                <p>{batches.filter(b => b.status === 'pending').length} pending batch{batches.filter(b => b.status === 'pending').length !== 1 ? 'es' : ''} found.</p>
                {batches.filter(b => b.status === 'pending' && (b.total_recipients === 0 || b.total_recipients === null)).length > 0 && (
                  <p className="mt-2 text-sm">
                    <strong>Note:</strong> {batches.filter(b => b.status === 'pending' && (b.total_recipients === 0 || b.total_recipients === null)).length} batch{batches.filter(b => b.status === 'pending' && (b.total_recipients === 0 || b.total_recipients === null)).length !== 1 ? 'es have' : ' has'} 0 recipients.
                    These are likely test batches or batches where recipient calculation failed.
                    Click "Clear Empty Pending Batches" below to remove them.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Queue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending (All)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {batches.filter(b => b.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Click "Process Next Batch" to send
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {batches.filter(b => b.status === 'processing').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {batches.filter(b =>
                    b.status === 'completed' &&
                    new Date(b.completed_at || '').toDateString() === new Date().toDateString()
                  ).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {batches.filter(b => b.status === 'failed' && (b.total_recipients || 0) > 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Management</CardTitle>
              <CardDescription>
                Process pending email batches and manage the queue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={processPendingBatches}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Process Next Batch
                  </Button>
                  <Button
                    onClick={async () => {
                      setLoading(true);
                      await fetchBatches();
                      await fetchPendingBatches();
                      setLoading(false);
                    }}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Refresh
                  </Button>
                </div>

                {/* Cleanup Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={clearEmptyPendingBatches}
                    variant="outline"
                    disabled={loading}
                    className="text-amber-600 hover:text-amber-700"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Clear Empty Pending Batches
                  </Button>
                  <Button
                    onClick={clearStuckBatches}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Clear Stuck Processing
                  </Button>
                </div>
              </div>

              {/* Batch Process Result */}
              {batchProcessResult && (
                <Alert className={batchProcessResult.error ? 'border-red-500' : batchProcessResult.batch_id ? 'border-green-500' : ''}>
                  <AlertDescription>
                    {batchProcessResult.error ? (
                      <span className="text-red-700">Error: {batchProcessResult.error}</span>
                    ) : batchProcessResult.batch_id ? (
                      <div className="space-y-1">
                        <p className="font-medium text-green-700">Batch processed successfully!</p>
                        <p className="text-sm">
                          • Type: {batchProcessResult.notification_type}<br />
                          • Recipients: {batchProcessResult.recipients_total}<br />
                          • Sent: {batchProcessResult.emails_sent}<br />
                          • Failed: {batchProcessResult.emails_failed}
                        </p>
                      </div>
                    ) : (
                      <span>{batchProcessResult.message || 'No pending batches to process'}</span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Pending Batches List */}
          {batches.filter(b => b.status === 'pending').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Pending Batches
                </CardTitle>
                <CardDescription>
                  Email batches waiting to be processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {batches.filter(b => b.status === 'pending').map((batch) => (
                    <div
                      key={batch.id}
                      className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                batch.notification_type?.includes('update') ? 'default' :
                                batch.notification_type?.includes('survey') ? 'secondary' :
                                batch.notification_type?.includes('event') ? 'outline' :
                                'secondary'
                              }
                              className="bg-white text-xs"
                            >
                              {batch.notification_type?.includes('update') ? '📄 Update' :
                               batch.notification_type?.includes('survey') ? '📋 Survey' :
                               batch.notification_type?.includes('event') ? '📅 Event' :
                               batch.notification_type?.replace(/_/g, ' ') || 'Unknown'}
                            </Badge>
                            <span className="text-sm font-medium">
                              {batch.total_recipients || batch.total_recipients === 0 ?
                                `${batch.total_recipients} recipient${batch.total_recipients !== 1 ? 's' : ''}` :
                                '? recipients'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(batch.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {batch.id.substring(0, 8)}...
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              setBatchProcessResult(null);
                              await processPendingBatches();
                              await fetchBatches();
                              await fetchPendingBatches();
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Send Now
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetBatchStatus(batch.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                      {batch.metadata?.title && (
                        <p className="text-sm text-gray-700">{batch.metadata.title}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Batch History</CardTitle>
              <CardDescription>
                Recently completed and failed email batches (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {batches
                  .filter(b => {
                    // Only show completed, failed, or cancelled batches from the last 7 days
                    const isRecent = new Date(b.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    const isProcessed = b.status === 'completed' ||
                                       b.status === 'failed' ||
                                       b.status === 'cancelled';
                    return isProcessed && isRecent;
                  })
                  .slice(0, 10)
                  .length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent completed batches (last 7 days)</p>
                ) : (
                  batches
                    .filter(b => {
                      const isRecent = new Date(b.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      const isProcessed = b.status === 'completed' ||
                                         b.status === 'failed' ||
                                         b.status === 'cancelled';
                      return isProcessed && isRecent;
                    })
                    .slice(0, 10)
                    .map((batch) => (
                    <div
                      key={batch.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(batch.status)}
                            {batch.notification_type && (
                              <Badge
                                variant={
                                  batch.notification_type.includes('update') ? 'default' :
                                  batch.notification_type.includes('survey') ? 'secondary' :
                                  batch.notification_type.includes('event') ? 'outline' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {batch.notification_type.includes('update') ? '📄 Update' :
                                 batch.notification_type.includes('survey') ? '📋 Survey' :
                                 batch.notification_type.includes('event') ? '📅 Event' :
                                 batch.notification_type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          {batch.metadata?.title && (
                            <p className="text-sm text-gray-600">{batch.metadata.title}</p>
                          )}
                          <div className="text-sm text-gray-500">
                            {batch.created_at && new Date(batch.created_at).toLocaleString()}
                          </div>
                          {batch.status === 'pending' && batch.total_recipients > 0 && (
                            <div className="text-xs text-amber-600 font-medium mt-1">
                              ⚠️ This batch has {batch.total_recipients} recipients waiting to be sent
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          {batch.total_recipients > 0 && (
                            <>
                              <div className="text-sm">
                                Recipients: <span className="font-medium">{batch.total_recipients}</span>
                              </div>
                              <div className="text-sm">
                                Sent: <span className="text-green-600 font-medium">
                                  {batch.emails_sent ?? batch.processed_count ?? 0}
                                </span>
                              </div>
                              <div className="text-sm">
                                Failed: <span className="text-red-600 font-medium">
                                  {batch.emails_failed ?? batch.failed_count ?? 0}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Error message removed - field doesn't exist in table */}

                      <div className="flex gap-2">
                        {batch.status === 'pending' && batch.total_recipients > 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                await processPendingBatches();
                                await fetchBatches();
                                await fetchPendingBatches();
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Send Now
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetBatchStatus(batch.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {batch.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetBatchStatus(batch.id, 'pending')}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Reset to Pending
                          </Button>
                        )}
                        {batch.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetBatchStatus(batch.id, 'pending')}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBatch(batch);
                            fetchBatchNotifications(batch.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {(batch.status === 'completed' || batch.status === 'failed' || batch.status === 'cancelled' || batch.total_recipients === 0) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteBatch(batch.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                System Diagnostics
              </CardTitle>
              <CardDescription>
                Debug email system configuration and test the email pipeline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Environment Check */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">1. Environment Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify that all required environment variables are configured correctly
                  </p>
                  <Button
                    onClick={runDebugCheck}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bug className="h-4 w-4 mr-2" />
                    )}
                    Run Debug Check
                  </Button>
                </div>

                {debugResult && (
                  <Alert className={debugResult.error ? 'border-red-500' : 'border-green-500'}>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(debugResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* Direct API Test */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">2. Resend API Test</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Test direct connection to Resend email service
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      className="max-w-xs"
                      id="test-api-email"
                    />
                    <Button
                      onClick={() => {
                        const email = (document.getElementById('test-api-email') as HTMLInputElement)?.value;
                        testResendAPI(email);
                      }}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 mr-2" />
                      )}
                      Test API
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <Alert className={testResult.error || !testResult.success ? 'border-red-500' : 'border-green-500'}>
                    <AlertDescription>
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Separator />

              {/* System Information */}
              <div>
                <h3 className="font-medium mb-2">3. System Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Email Provider:</span>
                    <span>Resend</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">From Address:</span>
                    <span>noreply@fleetdrms.com</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Rate Limit:</span>
                    <span>2 emails/second</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Batch Processing:</span>
                    <span>Manual trigger required</span>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Debugging Guide</AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p>1. Run the debug check to verify environment variables</p>
                  <p>2. Test the Resend API with a valid email address</p>
                  <p>3. Check the Queue tab for any pending batches</p>
                  <p>4. Use the Test Emails tab to send test notifications</p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Details Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              View individual email notifications for this batch
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Batch ID:</span>
                  <p className="font-mono">{selectedBatch.id}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <div>{getStatusBadge(selectedBatch.status)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p>{selectedBatch.notification_type}</p>
                </div>
                <div>
                  <span className="text-gray-500">Title:</span>
                  <p>{selectedBatch.metadata?.title || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium mb-2">Email Notifications</h3>
                <div className="border rounded-lg">
                  <ScrollArea className="h-[300px]">
                    <div className="p-4 space-y-2">
                      {batchNotifications.length === 0 ? (
                        <p className="text-gray-500 text-center">No notifications found</p>
                      ) : (
                        batchNotifications.map((notif) => (
                          <div key={notif.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              {notif.status === 'sent' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : notif.status === 'failed' ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                              <span className="text-sm">{notif.to_email}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {notif.sent_at ? new Date(notif.sent_at).toLocaleString() :
                               notif.error_message || 'Pending'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}