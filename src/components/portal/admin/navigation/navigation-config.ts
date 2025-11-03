/**
 * Admin Navigation Configuration
 *
 * Defines the structure and hierarchy of the admin panel navigation.
 * Used by AdminNavigation component to render menus, breadcrumbs, and route handling.
 *
 * Structure:
 * - Top-level items can be single pages (Dashboard) or grouped sections
 * - Grouped sections have dropdown menus with sub-items
 * - Each item has: id, label, icon, path, description
 * - Optional: badge, status (new/planned), disabled
 */

import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Mail,
  Settings,
  Megaphone,
  ClipboardList,
  Calendar,
  Layers,
  Activity,
  UserPlus,
  UserCheck,
  PieChart,
  Calculator,
  MessageSquare,
  TrendingUp,
  Send,
  Bell,
  Shield,
  Database,
  Code,
  Lock,
  BookOpen,
  type LucideIcon
} from 'lucide-react';

export type NavItemStatus = 'new' | 'planned' | 'beta';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  status?: NavItemStatus;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  items: NavItem[];
}

export type NavSection = NavItem | NavGroup;

/**
 * Type guard to check if a section is a group (has items)
 */
export function isNavGroup(section: NavSection): section is NavGroup {
  return 'items' in section;
}

/**
 * Admin Navigation Structure
 *
 * Order matters - sections appear in this order in the navigation
 */
export const adminNavigation: NavSection[] = [
  // Dashboard - Single page (no dropdown)
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
    description: 'Overview and statistics'
  },

  // Content Management - Grouped
  {
    id: 'content',
    label: 'Content',
    icon: FileText,
    description: 'Create and manage portal content',
    items: [
      {
        id: 'updates',
        label: 'Updates',
        path: '/admin/content/updates',
        icon: Megaphone,
        description: 'Announcements and news'
      },
      {
        id: 'surveys',
        label: 'Surveys',
        path: '/admin/content/surveys',
        icon: ClipboardList,
        description: 'Survey management'
      },
      {
        id: 'events',
        label: 'Events',
        path: '/admin/content/events',
        icon: Calendar,
        description: 'Event management'
      },
      {
        id: 'solutions',
        label: 'Solutions Editor',
        path: '/admin/content/solutions',
        icon: Layers,
        description: 'Solution cards'
      }
    ]
  },

  // Users & Community - Grouped
  {
    id: 'users',
    label: 'Users & Community',
    icon: Users,
    description: 'User management and engagement',
    items: [
      {
        id: 'directory',
        label: 'User Directory',
        path: '/admin/users/directory',
        icon: Users,
        description: 'All portal users',
        // badge will be populated dynamically with user count
      },
      {
        id: 'activity',
        label: 'User Activity',
        path: '/admin/users/activity',
        icon: Activity,
        description: 'Activity dashboard',
        status: 'new'
      },
      {
        id: 'referrals',
        label: 'Referrals',
        path: '/admin/users/referrals',
        icon: UserPlus,
        description: 'User referrals'
      },
      {
        id: 'contacts',
        label: 'DSP Contacts',
        path: '/admin/users/contacts',
        icon: UserCheck,
        description: 'Contact tracking'
      },
      {
        id: 'contact-submissions',
        label: 'Contact Submissions',
        path: '/admin/users/contact-submissions',
        icon: MessageSquare,
        description: 'Contact form submissions'
      }
    ]
  },

  // Data & Reports - Grouped
  {
    id: 'data',
    label: 'Data & Reports',
    icon: BarChart3,
    description: 'Analytics and reporting',
    items: [
      {
        id: 'analytics',
        label: 'Analytics Dashboard',
        path: '/admin/data/analytics',
        icon: BarChart3,
        description: 'Overview metrics'
      },
      {
        id: 'survey-analytics',
        label: 'Survey Analytics',
        path: '/admin/data/survey-analytics',
        icon: PieChart,
        description: 'Survey results and insights',
        status: 'new'
      },
      {
        id: 'calculator-submissions',
        label: 'Calculator Submissions',
        path: '/admin/data/calculator-submissions',
        icon: Calculator,
        description: 'Savings calculations'
      },
      {
        id: 'event-analytics',
        label: 'Event Analytics',
        path: '/admin/data/event-analytics',
        icon: Calendar,
        description: 'Event metrics and attendance',
        status: 'planned'
      },
      {
        id: 'engagement',
        label: 'Engagement Metrics',
        path: '/admin/data/engagement',
        icon: TrendingUp,
        description: 'User engagement scoring',
        status: 'planned'
      }
    ]
  },

  // Communications - Grouped
  {
    id: 'communications',
    label: 'Communications',
    icon: Mail,
    description: 'Email and notifications',
    items: [
      {
        id: 'templates',
        label: 'Email Templates',
        path: '/admin/communications/templates',
        icon: FileText,
        description: 'Template management'
      },
      {
        id: 'queue',
        label: 'Email Queue',
        path: '/admin/communications/queue',
        icon: Send,
        description: 'Outbound emails'
      },
      {
        id: 'rules',
        label: 'Notification Rules',
        path: '/admin/communications/rules',
        icon: Bell,
        description: 'Automated notifications'
      },
      {
        id: 'recipients',
        label: 'Recipient Lists',
        path: '/admin/communications/recipients',
        icon: Users,
        description: 'Mailing lists'
      },
      {
        id: 'comm-dashboard',
        label: 'Dashboard',
        path: '/admin/communications/dashboard',
        icon: LayoutDashboard,
        description: 'Email overview'
      },
      {
        id: 'logs',
        label: 'Email Logs',
        path: '/admin/communications/logs',
        icon: FileText,
        description: 'Email history'
      }
    ]
  },

  // Settings - Grouped
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'System configuration',
    items: [
      {
        id: 'general',
        label: 'General',
        path: '/admin/settings',
        icon: Settings,
        description: 'General settings'
      },
      {
        id: 'marketing',
        label: 'Marketing',
        path: '/admin/settings/marketing',
        icon: TrendingUp,
        description: 'Marketing settings'
      },
      {
        id: 'email',
        label: 'Email Settings',
        path: '/admin/settings/email',
        icon: Mail,
        description: 'Email configuration'
      },
      {
        id: 'users-settings',
        label: 'User Settings',
        path: '/admin/settings/users',
        icon: Users,
        description: 'User management settings'
      },
      {
        id: 'security',
        label: 'Security',
        path: '/admin/settings/security',
        icon: Shield,
        description: 'Security settings'
      },
      {
        id: 'permissions',
        label: 'Permissions',
        path: '/admin/settings/permissions',
        icon: Lock,
        description: 'Role permissions'
      },
      {
        id: 'database',
        label: 'Database',
        path: '/admin/settings/database',
        icon: Database,
        description: 'Database settings'
      },
      {
        id: 'notifications-settings',
        label: 'Notifications',
        path: '/admin/settings/notifications',
        icon: Bell,
        description: 'Notification settings'
      },
      {
        id: 'developer',
        label: 'Developer',
        path: '/admin/settings/developer',
        icon: Code,
        description: 'Developer tools'
      },
      {
        id: 'docs',
        label: 'Documentation',
        path: '/admin/settings/docs',
        icon: BookOpen,
        description: 'System documentation'
      }
    ]
  }
];

/**
 * Helper function to find a nav item by path
 */
export function findNavItemByPath(path: string): NavItem | null {
  for (const section of adminNavigation) {
    if (isNavGroup(section)) {
      const found = section.items.find(item => path.startsWith(item.path));
      if (found) return found;
    } else {
      if (path.startsWith(section.path)) return section;
    }
  }
  return null;
}

/**
 * Helper function to get breadcrumb trail for a path
 */
export function getBreadcrumbs(path: string): Array<{ label: string; path: string }> {
  const breadcrumbs: Array<{ label: string; path: string }> = [
    { label: 'Dashboard', path: '/admin/dashboard' }
  ];

  // Don't add breadcrumb if we're on dashboard
  if (path === '/admin/dashboard') {
    return breadcrumbs;
  }

  for (const section of adminNavigation) {
    if (isNavGroup(section)) {
      const found = section.items.find(item => path.startsWith(item.path));
      if (found) {
        breadcrumbs.push({ label: section.label, path: '' }); // Group (no link)
        breadcrumbs.push({ label: found.label, path: found.path });

        // If path is longer than the found item path, it's likely a detail page
        if (path !== found.path && path.startsWith(found.path + '/')) {
          // Extract the detail page name from the path
          // e.g., /admin/users/analytics/123 -> User Analytics
          breadcrumbs.push({ label: 'Details', path: path });
        }

        return breadcrumbs;
      }
    } else {
      if (path.startsWith(section.path)) {
        breadcrumbs.push({ label: section.label, path: section.path });
        return breadcrumbs;
      }
    }
  }

  return breadcrumbs;
}

/**
 * Helper function to get parent section for a path
 */
export function getParentSection(path: string): NavGroup | null {
  for (const section of adminNavigation) {
    if (isNavGroup(section)) {
      const found = section.items.find(item => path.startsWith(item.path));
      if (found) return section;
    }
  }
  return null;
}

/**
 * Helper function to check if a path is active
 * Accounts for sub-routes (e.g., /admin/users/directory/123)
 */
export function isPathActive(currentPath: string, itemPath: string): boolean {
  // Exact match
  if (currentPath === itemPath) return true;

  // Current path starts with item path (sub-route)
  // But make sure we're not matching partial segments
  // e.g., /admin/users should not match /admin/users-test
  return currentPath.startsWith(itemPath + '/');
}

/**
 * Route Redirects
 * Maps old routes to new routes for backward compatibility
 */
export const routeRedirects: Record<string, string> = {
  // Content
  '/admin/updates': '/admin/content/updates',
  '/admin/surveys': '/admin/content/surveys',
  '/admin/events': '/admin/content/events',
  '/admin/solutions': '/admin/content/solutions',

  // Users
  '/admin/users': '/admin/users/directory',
  '/admin/referrals': '/admin/users/referrals',
  '/admin/contacts': '/admin/users/contacts',

  // Data
  '/admin/reports/calculator-submissions': '/admin/data/calculator-reports',
  '/admin/contact-submissions': '/admin/data/contact-forms',
};
