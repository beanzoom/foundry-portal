import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">General Settings</h1>
        <p className="text-muted-foreground">Basic application configuration and information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Application Name</Label>
              <p className="font-medium">FleetDRMS DSP Portal</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Version</Label>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Environment</Label>
              <p className="font-medium">Production</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Region</Label>
              <p className="font-medium">US East</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Default contact details for the organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Support Email</Label>
              <p className="font-medium">support@fleetdrms.com</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Main Phone</Label>
              <p className="font-medium">1-800-FLEET-DMS</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Address</Label>
              <p className="font-medium">123 Business Ave<br />Suite 100<br />New York, NY 10001</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Website</Label>
              <p className="font-medium">www.fleetdrms.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}