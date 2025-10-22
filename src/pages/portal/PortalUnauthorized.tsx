import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { portalRoute } from '@/lib/portal/navigation';

export function PortalUnauthorized() {
  const navigate = useNavigate();
  const { portalUser } = usePortal();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            You don't have permission to access this area of the portal.
          </p>

          {portalUser && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">
                Logged in as: <span className="font-medium">{portalUser.email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Role: <span className="font-medium">{portalUser.role}</span>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500">
            This area is restricted to administrators only.
            If you believe you should have access, please contact your system administrator.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate(portalRoute('/dashboard'))}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
