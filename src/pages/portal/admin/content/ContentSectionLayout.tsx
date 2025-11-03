import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { adminRoute } from '@/lib/portal/navigation';
import {
  Megaphone,
  ClipboardList,
  Calendar,
  Layers
} from 'lucide-react';

interface ContentSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  description: string;
}

export function ContentSectionLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const sections: ContentSection[] = [
    {
      id: 'updates',
      label: 'Updates',
      icon: <Megaphone className="h-4 w-4" />,
      path: adminRoute('content/updates'),
      description: 'Announcements and news'
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: <ClipboardList className="h-4 w-4" />,
      path: adminRoute('content/surveys'),
      description: 'Survey management'
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="h-4 w-4" />,
      path: adminRoute('content/events'),
      description: 'Event management'
    },
    {
      id: 'solutions',
      label: 'Solutions Editor',
      icon: <Layers className="h-4 w-4" />,
      path: adminRoute('content/solutions'),
      description: 'Solution cards'
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
            <h2 className="font-semibold text-lg">Content Management</h2>
            <p className="text-sm text-muted-foreground">Create and manage portal content</p>
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
