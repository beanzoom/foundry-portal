import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Key, AlertTriangle, CheckCircle } from 'lucide-react';

export function SecuritySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Manage security configurations and access controls</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">Row Level Security (RLS)</p>
                  <p className="text-sm text-muted-foreground">Database access control</p>
                </div>
              </div>
              <Badge className="bg-green-500">Enabled</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-muted-foreground">Secure key management</p>
                </div>
              </div>
              <Badge className="bg-green-500">Secured</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="font-medium">SSL/TLS</p>
                  <p className="text-sm text-muted-foreground">Encrypted connections</p>
                </div>
              </div>
              <Badge className="bg-green-500">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Manage API keys and access tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Supabase Anon Key</p>
                <Badge variant="outline">Public</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Used for client-side authentication
              </p>
            </div>
            
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Service Role Key</p>
                <Badge variant="outline">Private</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Server-side operations only - keep secure
              </p>
            </div>
            
            <div className="p-3 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Resend API Key</p>
                <Badge variant="outline">Private</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Email service authentication
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Admin Panel Access</p>
                <p className="text-sm text-muted-foreground">Restricted to admin roles</p>
              </div>
              <Badge>Enforced</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Contact Form</p>
                <p className="text-sm text-muted-foreground">Available to all authenticated users</p>
              </div>
              <Badge>Open</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Settings Management</p>
                <p className="text-sm text-muted-foreground">Super admin only</p>
              </div>
              <Badge>Restricted</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Logs
          </CardTitle>
          <CardDescription>
            Monitor security events and access attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Security logging feature coming soon
            </p>
            <Button variant="outline" disabled>
              View Security Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}