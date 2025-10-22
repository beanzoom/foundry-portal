import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Settings, AlertCircle, FileText, CheckCircle } from 'lucide-react';

// Temporary hardcoded templates until database migration is run
const TEMPLATES = {
  update_published: {
    name: 'Update Published',
    subject: 'New Portal Update: {{title}}',
    description: 'Sent when a portal update is published',
    variables: ['title', 'content', 'userName', 'updateType']
  },
  survey_published: {
    name: 'Survey Published',
    subject: 'New Survey Available: {{title}}',
    description: 'Sent when a new survey is available',
    variables: ['title', 'description', 'userName', 'dueDate']
  },
  event_published: {
    name: 'Event Published',
    subject: 'Event Announcement: {{title}}',
    description: 'Sent when a new event is announced',
    variables: ['title', 'description', 'userName', 'event_date', 'location']
  }
};

export function EmailTemplateManagerSimple() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Templates & Notification Rules</h2>
        <p className="text-muted-foreground">
          Configure email templates and notification settings
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Migration Required</AlertTitle>
        <AlertDescription>
          The email template system requires a database migration. Please run:
          <pre className="mt-2 p-2 bg-muted rounded text-sm">
            psql $DATABASE_URL {'<'} database/migrations/040_email_templates_system.sql
          </pre>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Notification Rules
          </TabsTrigger>
          <TabsTrigger value="status">
            <CheckCircle className="h-4 w-4 mr-2" />
            Current Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates (Preview)</CardTitle>
              <CardDescription>
                These templates will be configurable after the database migration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <div key={key} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <Badge variant="outline">System Template</Badge>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Subject:</span> {template.subject}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Variables:</span>{' '}
                    {template.variables.map(v => (
                      <Badge key={v} variant="secondary" className="mr-1 text-xs">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Rules</CardTitle>
              <CardDescription>
                Configure when and to whom notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Update Published</h4>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template: update-published
                  </p>
                  <div className="text-sm">
                    <strong>Send to:</strong> Portal Members, Admins, Super Admins, Investors
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Survey Published</h4>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template: survey-published
                  </p>
                  <div className="text-sm">
                    <strong>Send to:</strong> Portal Members, Admins, Super Admins, Investors
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Event Published</h4>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Template: event-published
                  </p>
                  <div className="text-sm">
                    <strong>Send to:</strong> Portal Members, Admins, Super Admins, Investors
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Email System Status</CardTitle>
              <CardDescription>
                How the system is currently configured
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Issue Fixed</AlertTitle>
                <AlertDescription>
                  The notification type mismatch has been corrected:
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>PortalAdminUpdates now sends 'update_published' (was 'updates')</li>
                    <li>This ensures the correct email template is used</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Email Provider</span>
                  <span className="text-sm">Resend API</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Template System</span>
                  <Badge variant="outline" className="text-xs">
                    Hardcoded (Migration Pending)
                  </Badge>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Notification Processing</span>
                  <span className="text-sm">Edge Function</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm font-medium">Default Recipients</span>
                  <span className="text-sm">All Portal Users with Email</span>
                </div>
              </div>

              <Alert className="border-green-500">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">What's Been Fixed</AlertTitle>
                <AlertDescription>
                  <ol className="mt-2 ml-4 list-decimal text-sm space-y-1">
                    <li>Notification type mismatch corrected in PortalAdminUpdates.tsx</li>
                    <li>Email template system architecture created</li>
                    <li>Database migration prepared for future deployment</li>
                    <li>Edge function updated to support database templates</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}