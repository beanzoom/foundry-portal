import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminRoute } from '@/lib/portal/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  FileText, 
  TestTube, 
  Settings2, 
  Shield, 
  Database,
  Bell,
  Users,
  ExternalLink,
  ChevronRight,
  Save,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { settingsService } from '@/services/settings.service';
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor';

export function PortalAdminSettings() {
  const [adminEmail, setAdminEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const email = await settingsService.getAdminEmail();
    setAdminEmail(email);
    setOriginalEmail(email);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email address is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminEmail(e.target.value);
    setSaveStatus('idle');
    if (e.target.value) {
      validateEmail(e.target.value);
    }
  };

  const handleSaveEmail = async () => {
    if (!validateEmail(adminEmail)) {
      return;
    }

    setSaving(true);
    setSaveStatus('idle');

    try {
      const success = await settingsService.updateAdminEmail(adminEmail);
      if (success) {
        setSaveStatus('success');
        setOriginalEmail(adminEmail);
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = adminEmail !== originalEmail;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      {/* Email Template Editor - Full Width */}
      <EmailTemplateEditor />

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        {/* Email Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Manage email system settings and test functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Admin Email Setting */}
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <Label htmlFor="admin-email">Admin Notification Email</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={handleEmailChange}
                  placeholder="admin@fleetdrms.com"
                  className={emailError ? 'border-red-500' : ''}
                />
                <Button 
                  onClick={handleSaveEmail}
                  disabled={!hasChanges || saving || !!emailError}
                  size="sm"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
              {saveStatus === 'success' && (
                <Alert className="mt-2 border-green-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700">
                    Admin email updated successfully
                  </AlertDescription>
                </Alert>
              )}
              {saveStatus === 'error' && (
                <Alert className="mt-2 border-red-500">
                  <AlertDescription className="text-red-700">
                    Failed to update admin email
                  </AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Contact form submissions will be sent to this address
              </p>
            </div>

            <div className="space-y-3">
              <Link to="/portal/admin/test-edge-function">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Test Email System
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <Link to="/portal/admin/contact-submissions">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contact Form Submissions
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>

              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Resend Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Email provider: <span className="font-medium">Resend</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-green-600">Active</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Link to={adminRoute('users')}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Manage Users
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Authentication: <span className="font-medium">Supabase Auth</span>
              </p>
              <p className="text-sm text-muted-foreground">
                2FA: <span className="font-medium text-yellow-600">Optional</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>
              Database configuration and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <a 
                href={`https://supabase.com/dashboard/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'kssbljbxapejckgassgf'}/editor`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Supabase Dashboard
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Provider: <span className="font-medium">Supabase (PostgreSQL)</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Region: <span className="font-medium">US East</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Security settings and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between" disabled>
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Security Logs
                </span>
                <span className="text-xs text-muted-foreground">Coming Soon</span>
              </Button>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                RLS: <span className="font-medium text-green-600">Enabled</span>
              </p>
              <p className="text-sm text-muted-foreground">
                API Keys: <span className="font-medium">Secured</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Email
            </CardTitle>
            <CardDescription>
              Configure email templates and notification rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Link to={adminRoute('settings/notifications')}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Email Templates & Rules
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Email Templates: <span className="font-medium text-green-600">Configurable</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Notification Rules: <span className="font-medium text-green-600">Active</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* General Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>
              Application preferences and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-between" disabled>
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Site Configuration
                </span>
                <span className="text-xs text-muted-foreground">Coming Soon</span>
              </Button>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Environment: <span className="font-medium">Production</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Version: <span className="font-medium">1.0.0</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}