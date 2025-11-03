import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { adminRoute } from '@/lib/portal/navigation';
import {
  LayoutDashboard,
  FileText,
  Send,
  Bell,
  Users,
  Activity
} from 'lucide-react';

interface CommunicationsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

export function CommunicationsSectionLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const sections: CommunicationsSection[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      path: adminRoute('communications'),
      description: 'Email overview'
    },
    {
      id: 'templates',
      label: 'Email Templates',
      icon: <FileText className="h-4 w-4" />,
      path: adminRoute('communications/templates'),
      description: 'Template management'
    },
    {
      id: 'queue',
      label: 'Email Queue',
      icon: <Send className="h-4 w-4" />,
      path: adminRoute('communications/queue'),
      description: 'Outbound emails'
    },
    {
      id: 'rules',
      label: 'Notification Rules',
      icon: <Bell className="h-4 w-4" />,
      path: adminRoute('communications/rules'),
      description: 'Automated notifications'
    },
    {
      id: 'recipients',
      label: 'Recipient Lists',
      icon: <Users className="h-4 w-4" />,
      path: adminRoute('communications/recipient-lists'),
      description: 'Mailing lists'
    },
    {
      id: 'activity',
      label: 'Activity & Logs',
      icon: <Activity className="h-4 w-4" />,
      path: adminRoute('communications/activity'),
      description: 'Email history'
    }
  ];

  const isActive = (path: string) => {
    // Exact match for communications root
    if (path === adminRoute('communications')) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Communications</h2>
            <p className="text-sm text-muted-foreground">Email and notifications</p>
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
                  <div className="font-medium">{section.label}</div>
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
