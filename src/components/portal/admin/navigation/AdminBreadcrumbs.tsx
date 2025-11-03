/**
 * Admin Breadcrumbs Component
 *
 * Displays breadcrumb navigation trail showing current location in admin hierarchy.
 * Features:
 * - Automatic breadcrumb generation from current path
 * - Clickable links to parent pages
 * - Current page non-clickable
 * - Accessible (ARIA labels)
 * - Responsive (truncates on mobile)
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBreadcrumbs } from './navigation-config';

interface AdminBreadcrumbsProps {
  className?: string;
}

export function AdminBreadcrumbs({ className }: AdminBreadcrumbsProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Don't show breadcrumbs on dashboard (only 1 item)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <li key={crumb.path || crumb.label} className="flex items-center">
              {/* Separator */}
              {!isFirst && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
              )}

              {/* Breadcrumb item */}
              {isLast || !crumb.path ? (
                // Current page or group (non-clickable)
                <span
                  className={cn(
                    "font-medium",
                    isLast
                      ? "text-gray-900"
                      : "text-gray-500"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isFirst && <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />}
                  {crumb.label}
                </span>
              ) : (
                // Parent pages (clickable)
                <Link
                  to={crumb.path}
                  className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded px-1"
                >
                  {isFirst && <Home className="w-4 h-4 inline mr-1" aria-hidden="true" />}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
