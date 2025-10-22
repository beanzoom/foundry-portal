import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function ContactAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Contact Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Detailed analytics and charts will be implemented here
        </p>
      </CardContent>
    </Card>
  );
}