import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { adminRoute } from '@/lib/portal/navigation';
import { supabase } from '@/lib/supabase';
import {
  Mail, Send, FileText, Settings, Activity, AlertCircle,
  CheckCircle, XCircle, Clock, Users, Bell, Zap,
  TrendingUp, Calendar, BarChart, ArrowRight, ChevronRight
} from 'lucide-react';

interface Stats {
  totalTemplates: number;
  activeTemplates: number;
  totalRules: number;
  activeRules: number;
  emailsSentToday: number;
  emailsSentWeek: number;
  pendingBatches: number;
  failedEmails: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
  recipientCount?: number;
}

export function CommunicationsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalTemplates: 0,
    activeTemplates: 0,
    totalRules: 0,
    activeRules: 0,
    emailsSentToday: 0,
    emailsSentWeek: 0,
    pendingBatches: 0,
    failedEmails: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const [templates, rules, batches] = await Promise.all([
        supabase.from('email_templates').select('id, is_active'),
        supabase.from('notification_rules').select('id, enabled'),
        supabase.from('email_notification_batches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Calculate stats
      const templateStats = templates.data || [];
      const ruleStats = rules.data || [];
      const batchStats = batches.data || [];

      setStats({
        totalTemplates: templateStats.length,
        activeTemplates: templateStats.filter((t: any) => t.is_active).length,
        totalRules: ruleStats.length,
        activeRules: ruleStats.filter((r: any) => r.enabled).length,
        emailsSentToday: batchStats.filter((b: any) => {
          const today = new Date().toDateString();
          return new Date(b.created_at).toDateString() === today && b.status === 'sent';
        }).reduce((sum: number, b: any) => sum + (b.processed_count || 0), 0),
        emailsSentWeek: batchStats.filter((b: any) => {
          const week = new Date();
          week.setDate(week.getDate() - 7);
          return new Date(b.created_at) >= week && b.status === 'sent';
        }).reduce((sum: number, b: any) => sum + (b.processed_count || 0), 0),
        pendingBatches: batchStats.filter((b: any) => b.status === 'pending').length,
        failedEmails: batchStats.reduce((sum: number, b: any) => sum + (b.failed_count || 0), 0)
      });

      // Format recent activity
      const activities: RecentActivity[] = batchStats.map((batch: any) => ({
        id: batch.id,
        type: batch.notification_type || 'Unknown',
        title: batch.content_data?.title || 'Notification',
        timestamp: batch.created_at,
        status: batch.status,
        recipientCount: batch.processed_count || 0
      }));
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to={adminRoute('settings')} className="hover:text-foreground">Settings</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">Communications</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Email & Communications</h1>
        <p className="text-muted-foreground">
          Manage email templates, notification rules, and monitor delivery
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Templates
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeTemplates}/{stats.totalTemplates}
            </div>
            <Progress
              value={(stats.activeTemplates / stats.totalTemplates) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Rules
            </CardTitle>
            <Settings className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeRules}/{stats.totalRules}
            </div>
            <Progress
              value={(stats.activeRules / stats.totalRules) * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails (7 days)
            </CardTitle>
            <Send className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSentWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.emailsSentToday} sent today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Status
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats.failedEmails > 0 ? (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">{stats.failedEmails} Failed</span>
                </>
              ) : stats.pendingBatches > 0 ? (
                <>
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">{stats.pendingBatches} Pending</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">All Systems OK</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity - 2 columns wide */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest email notifications and their delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(activity.status)}
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.type} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activity.recipientCount > 0 && (
                        <Badge variant="outline">
                          {activity.recipientCount} recipients
                        </Badge>
                      )}
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(adminRoute('communications/activity'))}
              >
                View Activity
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(adminRoute('communications/queue'))}
              >
                View Queue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and navigation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(adminRoute('communications/templates'))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Manage Templates
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(adminRoute('communications/rules'))}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notification Rules
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(adminRoute('communications/testing'))}
            >
              <Zap className="mr-2 h-4 w-4" />
              Test Email System
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate(adminRoute('communications/activity'))}
            >
              <Activity className="mr-2 h-4 w-4" />
              View Logs
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">System Health</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email Provider</span>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Queue Status</span>
                  <Badge variant={stats.pendingBatches > 0 ? "outline" : "default"}>
                    {stats.pendingBatches > 0 ? `${stats.pendingBatches} Pending` : 'Clear'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Events Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Events</CardTitle>
          <CardDescription>
            Key events that trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Content Publishing</h4>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Update Published</div>
                <div>• Survey Published</div>
                <div>• Event Published</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">User Actions</h4>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• Contact Form Submitted</div>
                <div>• Event Registration</div>
                <div>• Survey Completed</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">System Events</h4>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>• User Registered</div>
                <div>• Referral Created</div>
                <div>• Password Reset</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}