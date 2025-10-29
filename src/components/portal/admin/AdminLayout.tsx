import React from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalPaths } from '@/hooks/usePortalPaths';
import { usePortalRole } from '@/hooks/usePortalRole';
import {
  LayoutDashboard,
  Megaphone,
  ClipboardList,
  Calendar,
  Settings,
  BarChart3,
  ArrowLeft,
  Shield,
  FileText,
  UserCheck,
  MessageSquare,
  Calculator,
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  description?: string;
  disabled?: boolean;
}

export function AdminLayout() {
  const { portalUser, isLoading } = usePortal();
  const { paths } = usePortalPaths();
  const location = useLocation();

  // Check if user is admin using centralized role checking
  const { isAdmin } = usePortalRole();

  // Admin navigation items
  const adminNavItems: AdminNavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      route: paths.admin.dashboard,
      description: 'Overview and statistics'
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: <Megaphone className="w-5 h-5" />,
      route: paths.admin.updates,
      description: 'Manage announcements and news'
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: <ClipboardList className="w-5 h-5" />,
      route: paths.admin.surveys,
      description: 'Create and manage surveys'
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="w-5 h-5" />,
      route: paths.admin.events,
      description: 'Manage events and registrations'
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: <UserPlus className="w-5 h-5" />,
      route: `${paths.admin.dashboard.replace('/dashboard', '/referrals')}`,
      description: 'Manage user referrals'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: <UserCheck className="w-5 h-5" />,
      route: paths.admin.contacts,
      description: 'DSP contact tracking'
    },
    {
      id: 'contact-submissions',
      label: 'Contact Forms',
      icon: <MessageSquare className="w-5 h-5" />,
      route: paths.admin.contactSubmissions || `${paths.admin.dashboard.replace('/dashboard', '/contact-submissions')}`,
      description: 'Contact form submissions'
    },
    {
      id: 'calculator-submissions',
      label: 'Calculator Reports',
      icon: <Calculator className="w-5 h-5" />,
      route: `${paths.admin.dashboard.replace('/dashboard', '/reports/calculator-submissions')}`,
      description: 'View savings calculations'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      route: paths.admin.settings,
      description: 'Portal configuration'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      route: paths.admin.analytics,
      description: 'View portal analytics',
      disabled: true
    },
    {
      id: 'content',
      label: 'Content',
      icon: <FileText className="w-5 h-5" />,
      route: paths.admin.content,
      description: 'Manage static content',
      disabled: true
    }
  ];

  const isActiveRoute = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Access control - redirect if not admin
  if (!isAdmin) {
    return <Navigate to={paths.unauthorized} replace />;
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-50 to-gray-50 border-b border-purple-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FleetDRMS DSP Foundry Portal
                </h1>
                <p className="text-xs text-gray-600">Administration Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {portalUser?.name} ({portalUser?.role})
              </span>
              <Link to={paths.dashboard}>
                <Button variant="ghost" size="sm" className="text-gray-700 hover:bg-purple-100 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto">
            {adminNavItems.map(item => (
              item.disabled ? (
                <div
                  key={item.id}
                  className="flex items-center gap-2 py-4 px-1 border-b-2 border-transparent text-sm font-medium whitespace-nowrap text-gray-300 cursor-not-allowed"
                  title={`${item.label} - Coming soon`}
                >
                  {item.icon}
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.id}
                  to={item.route}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                    isActiveRoute(item.route)
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-purple-300"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {console.log('[AdminLayout] Rendering Outlet for path:', location.pathname)}
        <Outlet />
      </div>
    </div>
  );
}