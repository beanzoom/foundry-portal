import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, Bug, ArrowLeft } from 'lucide-react';
import { emailService } from '@/services/email.service';
import { supabase } from '@/lib/supabase';

export function TestEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [testData, setTestData] = useState({
    to: '',
    subject: 'Test Email from FleetDRMS',
    message: 'This is a test email to verify the email system is working correctly.'
  });

  const handleSendTest = async () => {
    if (!testData.to) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await emailService.send({
        to: testData.to,
        subject: testData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Test Email</h2>
            <p>${testData.message}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              This email was sent from the FleetDRMS Email System test page.
            </p>
          </div>
        `
      });

      if (response.success) {
        setResult({
          success: true,
          message: `Email sent successfully! ID: ${response.id}`
        });
      } else {
        setResult({
          success: false,
          message: `Failed to send: ${response.error}`
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugCheck = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { debug: true }
      });
      
      if (error) {
        console.error('Debug check error:', error);
        setResult({
          success: false,
          message: `Debug check failed: ${error.message}`
        });
      } else {
        console.log('Debug check response:', data);
        setResult({
          success: data?.hasResendKey || false,
          message: `Debug Info:\n${JSON.stringify(data, null, 2)}`
        });
      }
    } catch (error: any) {
      console.error('Debug check exception:', error);
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestContactTemplate = async () => {
    if (!testData.to) {
      setResult({ success: false, message: 'Please enter an email address' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await emailService.sendTemplate(
        'contact-user-confirmation',
        {
          name: 'Test User',
          ticketNumber: 'TEST-123'
        },
        {
          to: testData.to,
          subject: 'Test: Contact Confirmation Template'
        }
      );

      if (response.success) {
        setResult({
          success: true,
          message: `Template email sent successfully! ID: ${response.id}`
        });
      } else {
        setResult({
          success: false,
          message: `Failed to send template: ${response.error}`
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/portal/admin/settings/developer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Developer Settings
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Email System Test</h1>
        <p className="text-gray-600">Test the email functionality and templates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Send a test email to verify the system is working
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Send To Email</Label>
            <Input
              id="to"
              type="email"
              placeholder="test@example.com"
              value={testData.to}
              onChange={(e) => setTestData({ ...testData, to: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={testData.subject}
              onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={4}
              value={testData.message}
              onChange={(e) => setTestData({ ...testData, message: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSendTest}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>

            <Button
              onClick={handleTestContactTemplate}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Test Contact Template
                </>
              )}
            </Button>

            <Button
              onClick={handleDebugCheck}
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Check
                </>
              )}
            </Button>
          </div>

          {result && (
            <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email System Status</CardTitle>
          <CardDescription>
            Current configuration and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <strong>Edge Function:</strong> send-email (deployed)
          </div>
          <div className="text-sm">
            <strong>Default From:</strong> onboarding@resend.dev
          </div>
          <div className="text-sm">
            <strong>Available Templates:</strong>
            <ul className="ml-4 mt-1 list-disc">
              <li>contact-admin-notification</li>
              <li>contact-user-confirmation</li>
            </ul>
          </div>
          <div className="text-sm text-gray-600 mt-4">
            <strong>Note:</strong> Make sure you've set the RESEND_API_KEY in Supabase secrets.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}