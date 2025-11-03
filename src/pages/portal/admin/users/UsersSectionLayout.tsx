import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminRoute } from '@/lib/portal/navigation';
import {
  Users,
  Activity,
  UserPlus,
  UserCheck,
  MessageSquare
} from 'lucide-react';

interface UsersSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
  status?: 'new' | 'planned';
}

export function UsersSectionLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const sections: UsersSection[] = [
    {
      id: 'directory',
      label: 'User Directory',
      icon: <Users className="h-4 w-4" />,
      path: adminRoute('users/directory'),
      description: 'All portal users',
      status: 'new'
    },
    {
      id: 'activity',
      label: 'User Activity',
      icon: <Activity className="h-4 w-4" />,
      path: adminRoute('users/activity'),
      description: 'Activity dashboard',
      status: 'new'
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: <UserPlus className="h-4 w-4" />,
      path: adminRoute('users/referrals'),
      description: 'User referrals'
    },
    {
      id: 'contacts',
      label: 'DSP Contacts',
      icon: <UserCheck className="h-4 w-4" />,
      path: adminRoute('users/contacts'),
      description: 'Contact tracking'
    },
    {
      id: 'contact-submissions',
      label: 'Contact Submissions',
      icon: <MessageSquare className="h-4 w-4" />,
      path: adminRoute('users/contact-submissions'),
      description: 'Contact form submissions'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Users & Community</h2>
            <p className="text-sm text-muted-foreground">User management and engagement</p>
          </div>

          <nav className="p-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={isActive(section.path) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isActive(section.path) && "bg-secondary"
                )}
                onClick={() => navigate(section.path)}
              >
                {section.icon}
                <div className="ml-2 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{section.label}</span>
                    {section.status && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-1.5 py-0",
                          section.status === 'new' && "bg-green-50 text-green-700 border-green-200",
                          section.status === 'planned' && "bg-blue-50 text-blue-700 border-blue-200"
                        )}
                      >
                        {section.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{section.description}</div>
                </div>
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
