import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRoute } from '@/lib/portal/navigation';

export function UserSettings() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the full user management page
    navigate(adminRoute('users'), { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center py-8">
      <p className="text-muted-foreground">Redirecting to User Management...</p>
    </div>
  );
}