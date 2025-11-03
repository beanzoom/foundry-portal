import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UnderConstructionProps {
  title: string;
  description?: string;
  features?: string[];
  backPath?: string;
}

export function UnderConstruction({
  title,
  description,
  features,
  backPath
}: UnderConstructionProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      {/* Under Construction Card */}
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Construction className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Under Construction</CardTitle>
          <CardDescription className="text-base">
            This feature is currently in development and will be available soon.
          </CardDescription>
        </CardHeader>

        {features && features.length > 0 && (
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Planned Features:</span>
              </h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}

        {backPath && (
          <CardContent className="pt-0">
            <Button
              variant="outline"
              onClick={() => navigate(backPath)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coming Soon</CardTitle>
          <CardDescription>
            We're actively working on bringing you powerful analytics and insights.
            Check back soon for updates!
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
