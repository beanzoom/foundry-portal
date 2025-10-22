import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { adminRoute, portalRoute } from '@/lib/portal/navigation';
import {
  Settings,
  Mail,
  Users,
  Shield,
  Database,
  Bell,
  ChevronRight,
  FileText,
  Palette,
  Globe,
  BookOpen,
  Code,
  TrendingUp
} from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: {
    id: string;
    label: string;
    path: string;
  }[];
}

export function SettingsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const sections: SettingsSection[] = [
    {
      id: 'general',
      label: 'General',
      icon: <Settings className="h-4 w-4" />,
      path: adminRoute('settings')
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <TrendingUp className="h-4 w-4" />,
      path: adminRoute('settings/marketing')
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: <Mail className="h-4 w-4" />,
      path: adminRoute('settings/communications'),
      children: [
        { id: 'comm-dashboard', label: 'Dashboard', path: adminRoute('settings/communications') },
        { id: 'comm-templates', label: 'Email Templates', path: adminRoute('settings/communications/templates') },
        { id: 'comm-rules', label: 'Notification Rules', path: adminRoute('settings/communications/rules') },
        { id: 'comm-lists', label: 'Recipient Lists', path: adminRoute('settings/communications/recipient-lists') },
        { id: 'comm-queue', label: 'Email Queue', path: adminRoute('settings/communications/queue') },
        { id: 'comm-activity', label: 'Activity & Logs', path: adminRoute('settings/communications/activity') },
        { id: 'comm-testing', label: 'Testing', path: adminRoute('settings/communications/testing') }
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: <Users className="h-4 w-4" />,
      path: adminRoute('users'),
      external: true  // This will be a direct link
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
      path: adminRoute('settings/security')
    },
    {
      id: 'permissions',
      label: 'Role Permissions',
      icon: <Shield className="h-4 w-4" />,
      path: adminRoute('settings/permissions')
    },
    {
      id: 'database',
      label: 'Database',
      icon: <Database className="h-4 w-4" />,
      path: adminRoute('settings/database')
    },
    {
      id: 'developer',
      label: 'Developer',
      icon: <Code className="h-4 w-4" />,
      path: adminRoute('settings/developer')
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: <BookOpen className="h-4 w-4" />,
      path: adminRoute('docs'),
      external: true  // Direct link to documentation center
    }
  ];

  const isActive = (path: string) => {
    // Check both /settings/communications and /communications paths
    const altPath = path.replace('/settings/communications', '/communications');
    const altPath2 = path.replace('/settings/', '/');
    return location.pathname === path || location.pathname.startsWith(path + '/') ||
           location.pathname === altPath || location.pathname.startsWith(altPath + '/') ||
           location.pathname === altPath2 || location.pathname.startsWith(altPath2 + '/');
  };

  const isSectionExpanded = (section: SettingsSection) => {
    if (!section.children) return false;
    // Check if we're in communications section via either path
    if (section.id === 'communications' &&
        (location.pathname.startsWith(adminRoute('communications')) ||
         location.pathname.startsWith(adminRoute('settings/communications')))) {
      return true;
    }
    return section.children.some(child => isActive(child.path));
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar Navigation */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Settings</h2>
            <p className="text-sm text-muted-foreground">Manage system configuration</p>
          </div>
          
          <nav className="p-2">
            {sections.map((section) => (
              <div key={section.id} className="mb-1">
                <Button
                  variant={isActive(section.path) && !section.children ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive(section.path) && !section.children && "bg-secondary"
                  )}
                  onClick={() => {
                    if ((section as any).external) {
                      navigate(section.path);
                    } else {
                      navigate(section.path);
                    }
                  }}
                >
                  {section.icon}
                  <span className="ml-2 flex-1 text-left">{section.label}</span>
                  {section.children && (
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      isSectionExpanded(section) && "rotate-90"
                    )} />
                  )}
                </Button>
                
                {/* Child items */}
                {section.children && isSectionExpanded(section) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.children.map((child) => (
                      <Button
                        key={child.id}
                        variant={isActive(child.path) ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-sm",
                          isActive(child.path) && "bg-secondary"
                        )}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
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