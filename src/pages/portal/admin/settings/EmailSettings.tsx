import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Save,
  Loader2,
  CheckCircle,
  TestTube,
  FileText,
  ExternalLink,
  Settings2,
  Activity
} from 'lucide-react';
import { settingsService } from '@/services/settings.service';

export function EmailSettings() {
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
        <h1 className="text-2xl font-bold">Email Configuration</h1>
        <p className="text-muted-foreground">Manage email settings and delivery options</p>
      </div>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Provider Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Resend</p>
              <p className="text-sm text-muted-foreground">Email delivery service</p>
            </div>
            <Badge variant="default" className="bg-green-500">Active</Badge>
          </div>
          <div className="mt-4 flex gap-2">
            <Link to="/portal/admin/settings/email/testing">
              <Button variant="outline" size="sm">
                <TestTube className="mr-2 h-4 w-4" />
                Test Email System
              </Button>
            </Link>
            <a 
              href="https://resend.com/domains" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Resend Dashboard
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Admin Email Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Notifications</CardTitle>
          <CardDescription>
            Configure where admin notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email Address</Label>
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
            <p className="text-sm text-muted-foreground">
              Contact form submissions and system notifications will be sent to this address
            </p>
          </div>

          {saveStatus === 'success' && (
            <Alert className="border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Admin email updated successfully
              </AlertDescription>
            </Alert>
          )}
          
          {saveStatus === 'error' && (
            <Alert className="border-red-500">
              <AlertDescription className="text-red-700">
                Failed to update admin email
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>
            Configure email delivery settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">From Address</p>
                <p className="text-sm text-muted-foreground">noreply@fleetdrms.com</p>
              </div>
              <Badge variant="outline">System Default</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Reply-To Address</p>
                <p className="text-sm text-muted-foreground">portal@fleetdrms.com</p>
              </div>
              <Badge variant="outline">Auto-configured</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link to="/portal/admin/settings/email/templates" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Settings2 className="mr-2 h-4 w-4" />
              Manage Email Templates
            </Button>
          </Link>
          
          <Link to="/portal/admin/contact-submissions" className="block">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              View Contact Submissions
            </Button>
          </Link>
          
          <Link to="/portal/admin/settings/email/logs" className="block">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              View Email Logs
            </Button>
          </Link>
          
          <Link to="/portal/admin/settings/email/testing" className="block">
            <Button variant="outline" className="w-full justify-start">
              <TestTube className="mr-2 h-4 w-4" />
              Email Testing & Diagnostics
            </Button>
          </Link>

          <Link to="/portal/admin/settings/email/processing" className="block">
            <Button variant="outline" className="w-full justify-start">
              <Activity className="mr-2 h-4 w-4" />
              Email Processing Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}