import React from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalPaths } from '@/hooks/usePortalPaths';
import { usePortalRole } from '@/hooks/usePortalRole';
import { ArrowLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { adminNavigation, isNavGroup, isPathActive } from './navigation/navigation-config';
import { AdminDropdownMenu } from './navigation/AdminDropdownMenu';
import { AdminBreadcrumbs } from './navigation/AdminBreadcrumbs';

export function AdminLayout() {
  const { portalUser, isLoading } = usePortal();
  const { paths } = usePortalPaths();
  const location = useLocation();

  // Check if user is admin using centralized role checking
  const { isAdmin } = usePortalRole();

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
    <div className="min-h-screen flex flex-col bg-gray-50">
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
      <div className="bg-white border-b overflow-visible">
        <div className="px-4 sm:px-6 lg:px-8 overflow-visible">
          <nav className="flex space-x-6 overflow-x-auto overflow-y-visible">
            {adminNavigation.map(section => (
              isNavGroup(section) ? (
                <AdminDropdownMenu key={section.id} section={section} />
              ) : (
                <Link
                  key={section.id}
                  to={section.path}
                  className={cn(
                    "flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2",
                    isPathActive(location.pathname, section.path)
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-purple-300"
                  )}
                >
                  <section.icon className="w-5 h-5" />
                  {section.label}
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-3">
          <AdminBreadcrumbs />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  );
}