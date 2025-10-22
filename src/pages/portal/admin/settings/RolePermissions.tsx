/**
 * Role Permissions Viewer - Accurate representation of actual permissions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Check,
  X,
  Info,
  Users,
  Key,
  ChevronRight,
  Lock,
  Unlock,
  Building,
  User
} from 'lucide-react';
import {
  PORTAL_ROLES,
  ROLE_CAPABILITIES,
  ROLE_HIERARCHY,
  getRoleDisplayName,
  type PortalRole
} from '@/lib/portal/roles';
import { cn } from '@/lib/utils';

// Define all portal features with descriptions
const PORTAL_FEATURES = {
  'Admin Panel': {
    icon: Shield,
    permissions: ['portal:admin:*'],
    description: 'Access to admin dashboard and management tools'
  },
  'Dashboard': {
    icon: Building,
    permissions: ['portal:dashboard:view'],
    description: 'View main portal dashboard'
  },
  'Profile Management': {
    icon: User,
    permissions: ['portal:profile:*'],
    description: 'View and edit profile information'
  },
  'Surveys': {
    icon: Lock,
    permissions: ['portal:surveys:take', 'portal:surveys:view', 'portal:surveys:manage'],
    description: 'Take surveys, view results'
  },
  'Events': {
    icon: Lock,
    permissions: ['portal:events:view', 'portal:events:register', 'portal:events:manage'],
    description: 'View and register for events'
  },
  'Updates': {
    icon: Lock,
    permissions: ['portal:updates:view', 'portal:updates:acknowledge'],
    description: 'View and acknowledge portal updates'
  },
  'Solutions': {
    icon: Lock,
    permissions: ['portal:solutions:view'],
    description: 'Access solution resources'
  },
  'Referrals': {
    icon: Lock,
    permissions: ['portal:referrals:*'],
    description: 'Submit and manage referrals'
  },
  'Contact': {
    icon: Lock,
    permissions: ['portal:contact:*'],
    description: 'Contact forms and submissions'
  },
  'Calculators': {
    icon: Lock,
    permissions: ['portal:calculators:*'],
    description: 'Use savings calculators'
  },
  'Investor Features': {
    icon: Building,
    permissions: ['portal:investor:*'],
    description: 'Investor-only content (future)'
  }
};

export function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<PortalRole>(PORTAL_ROLES.USER);
  const [viewMode, setViewMode] = useState<'role' | 'matrix'>('role');

  const roleInfo = {
    [PORTAL_ROLES.SUPER_ADMIN]: {
      icon: <Shield className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Full unrestricted access to everything',
      badge: 'Full Access'
    },
    [PORTAL_ROLES.ADMIN]: {
      icon: <Key className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Full access (may restrict publishing in future)',
      badge: 'Full Access'
    },
    [PORTAL_ROLES.INVESTOR]: {
      icon: <Building className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 text-green-700 border-green-200',
      description: 'Portal user with future investor-specific features',
      badge: 'Portal User'
    },
    [PORTAL_ROLES.USER]: {
      icon: <User className="h-5 w-5 text-gray-600" />,
      color: 'bg-gray-50 text-gray-700 border-gray-200',
      description: 'Standard portal member access',
      badge: 'Portal User'
    }
  };

  // Check if a role has access to a feature
  const roleHasFeature = (role: PortalRole, featurePerms: string[]): 'full' | 'partial' | 'none' => {
    const capabilities = ROLE_CAPABILITIES[role] || [];

    // Check for full access
    if (capabilities.includes('portal:*')) return 'full';

    // Check for any of the feature permissions
    const hasAny = featurePerms.some(perm => {
      return capabilities.some(cap => {
        if (cap === perm) return true;
        if (cap.endsWith('*')) {
          const prefix = cap.slice(0, -1);
          return perm.startsWith(prefix);
        }
        return false;
      });
    });

    return hasAny ? 'partial' : 'none';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Role Permissions</h2>
        <p className="text-muted-foreground">
          Portal access control and role capabilities
        </p>
      </div>

      {/* Reality Check */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Current System Reality:</strong><br/>
          • <strong>Admin roles</strong> (Super Admin, Admin): Full portal access<br/>
          • <strong>User roles</strong> (Investor, Member): Same portal features currently, investor-specific content planned
        </AlertDescription>
      </Alert>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'role' | 'matrix')}>
        <TabsList>
          <TabsTrigger value="role">Role Details</TabsTrigger>
          <TabsTrigger value="matrix">Feature Access Matrix</TabsTrigger>
        </TabsList>

        {/* Role View */}
        <TabsContent value="role" className="space-y-6">
          {/* Role Groups */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Administrative Roles</span>
                </CardTitle>
                <CardDescription>
                  Full system access with potential future restrictions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[PORTAL_ROLES.SUPER_ADMIN, PORTAL_ROLES.ADMIN].map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                      selectedRole === role
                        ? roleInfo[role].color
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {roleInfo[role].icon}
                      <div className="text-left">
                        <div className="font-medium">{getRoleDisplayName(role)}</div>
                        <div className="text-xs opacity-75">
                          {role === PORTAL_ROLES.SUPER_ADMIN ? 'Unrestricted' : 'May limit publishing'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{roleInfo[role].badge}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* User Group */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Portal User Roles</span>
                </CardTitle>
                <CardDescription>
                  Portal members with standard access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[PORTAL_ROLES.INVESTOR, PORTAL_ROLES.USER].map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                      selectedRole === role
                        ? roleInfo[role].color
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      {roleInfo[role].icon}
                      <div className="text-left">
                        <div className="font-medium">{getRoleDisplayName(role)}</div>
                        <div className="text-xs opacity-75">
                          {role === PORTAL_ROLES.INVESTOR ? 'Future exclusive content' : 'Standard access'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{roleInfo[role].badge}</Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Selected Role Details */}
          <Card>
            <CardHeader className={cn("border-b", roleInfo[selectedRole].color)}>
              <CardTitle className="flex items-center space-x-2">
                {roleInfo[selectedRole].icon}
                <span>{getRoleDisplayName(selectedRole)}</span>
              </CardTitle>
              <CardDescription className="text-inherit opacity-90">
                {roleInfo[selectedRole].description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                {/* Show actual capabilities */}
                <div>
                  <h4 className="font-medium mb-3">Capabilities</h4>
                  {ROLE_CAPABILITIES[selectedRole]?.includes('portal:*') ? (
                    <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                      <Unlock className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">
                        Full unrestricted access to all portal features and settings
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(PORTAL_FEATURES).map(([feature, config]) => {
                        const access = roleHasFeature(selectedRole, config.permissions);
                        if (access === 'none') return null;

                        return (
                          <div key={feature} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                            <Check className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{feature}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrix View */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Feature Access Matrix</CardTitle>
              <CardDescription>
                Which roles can access which portal features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 min-w-[100px]">
                        <div className="space-y-1">
                          <Shield className="h-4 w-4 mx-auto text-purple-600" />
                          <div className="text-xs">Super Admin</div>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 min-w-[100px]">
                        <div className="space-y-1">
                          <Key className="h-4 w-4 mx-auto text-blue-600" />
                          <div className="text-xs">Admin</div>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 min-w-[100px]">
                        <div className="space-y-1">
                          <Building className="h-4 w-4 mx-auto text-green-600" />
                          <div className="text-xs">Investor</div>
                        </div>
                      </th>
                      <th className="text-center py-3 px-4 min-w-[100px]">
                        <div className="space-y-1">
                          <User className="h-4 w-4 mx-auto text-gray-600" />
                          <div className="text-xs">Member</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PORTAL_FEATURES).map(([feature, config]) => (
                      <tr key={feature} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{feature}</div>
                          <div className="text-xs text-muted-foreground">{config.description}</div>
                        </td>
                        {Object.values(PORTAL_ROLES).map(role => {
                          const access = roleHasFeature(role, config.permissions);
                          return (
                            <td key={role} className="text-center py-3 px-4">
                              {access === 'full' || access === 'partial' ? (
                                <Check className="h-5 w-5 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* How to Change Permissions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">Modifying Permissions</CardTitle>
        </CardHeader>
        <CardContent className="text-amber-800 space-y-2">
          <p>
            To change role permissions, edit <code className="bg-amber-100 px-1 rounded">src/lib/portal/roles.ts</code>
          </p>
          <ul className="list-disc list-inside text-sm space-y-1 ml-2">
            <li>Admin roles currently have <code>portal:*</code> (full access)</li>
            <li>To restrict publishing: Remove wildcard and list specific permissions</li>
            <li>To add investor-only features: Use <code>portal:investor:*</code> permissions</li>
            <li>Changes require a code deployment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}