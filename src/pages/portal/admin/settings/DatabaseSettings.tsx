import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, ExternalLink, HardDrive, Activity } from 'lucide-react';

export function DatabaseSettings() {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'kssbljbxapejckgassgf';
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Database Settings</h1>
        <p className="text-muted-foreground">Database configuration and maintenance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Provider</p>
                <p className="text-sm text-muted-foreground">Database service</p>
              </div>
              <Badge>Supabase (PostgreSQL)</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Region</p>
                <p className="text-sm text-muted-foreground">Data center location</p>
              </div>
              <Badge variant="outline">US East 1</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Version</p>
                <p className="text-sm text-muted-foreground">PostgreSQL version</p>
              </div>
              <Badge variant="outline">15.x</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Status</p>
                <p className="text-sm text-muted-foreground">Connection status</p>
              </div>
              <Badge className="bg-green-500">Connected</Badge>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <a 
              href={`https://supabase.com/dashboard/project/${projectId}/editor`}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Supabase Dashboard
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage & Usage
          </CardTitle>
          <CardDescription>
            Database storage and resource utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Database Size</span>
                <span className="font-medium">~50 MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '5%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">5% of 1 GB limit</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>File Storage</span>
                <span className="font-medium">~10 MB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '1%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">1% of 1 GB limit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance
          </CardTitle>
          <CardDescription>
            Database performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Average Query Time</p>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
              <Badge variant="outline">~50ms</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Active Connections</p>
                <p className="text-sm text-muted-foreground">Current connections</p>
              </div>
              <Badge variant="outline">3 / 60</Badge>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Cache Hit Rate</p>
                <p className="text-sm text-muted-foreground">Query cache efficiency</p>
              </div>
              <Badge variant="outline">95%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>
            Database maintenance and backup options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" disabled>
            Create Manual Backup
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            View Backup History
          </Button>
          <Button variant="outline" className="w-full justify-start" disabled>
            Database Migrations
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Maintenance features available in Supabase Dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}