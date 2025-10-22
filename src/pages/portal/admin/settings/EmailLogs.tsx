import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink } from 'lucide-react';

export function EmailLogs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Logs</h1>
        <p className="text-muted-foreground">View email delivery history and statistics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Email Activity
          </CardTitle>
          <CardDescription>
            Monitor email sending activity and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Email logs feature coming soon
            </p>
            <p className="text-sm text-muted-foreground">
              In the meantime, you can view logs in the Resend dashboard
            </p>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Link to="/portal/admin/contact-submissions">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View Contact Submissions
              </Button>
            </Link>
            
            <a 
              href="https://resend.com/emails" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Resend Dashboard
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}