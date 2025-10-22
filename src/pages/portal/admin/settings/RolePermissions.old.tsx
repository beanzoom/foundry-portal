/**
 * Role Permissions Viewer - Display current role capabilities
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
  Unlock
} from 'lucide-react';
import {
  PORTAL_ROLES,
  ROLE_CAPABILITIES,
  ROLE_HIERARCHY,
  getRoleDisplayName,
  type PortalRole
} from '@/lib/portal/roles';
import { cn } from '@/lib/utils';

// Group permissions by category for better organization
function categorizePermissions(permissions: readonly string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  permissions.forEach(permission => {
    if (permission === 'portal:*') {
      categories['Full Access'] = ['All portal features and settings'];
      return;
    }

    const parts = permission.split(':');
    const category = parts[1] || 'general';
    const action = parts[2] || 'access';

    if (!categories[category]) {
      categories[category] = [];
    }

    if (permission.endsWith('*')) {
      categories[category].push(`All ${category} permissions`);
    } else {
      categories[category].push(action);
    }
  });

  return categories;
}

// Get all unique permissions across all roles
function getAllUniquePermissions(): string[] {
  const allPermissions = new Set<string>();

  Object.values(ROLE_CAPABILITIES).forEach(permissions => {
    permissions.forEach(permission => {
      // Skip wildcards for individual permission listing
      if (!permission.endsWith('*')) {
        allPermissions.add(permission);
      }
    });
  });

  return Array.from(allPermissions).sort();
}

export function RolePermissions() {
  const [selectedRole, setSelectedRole] = useState<PortalRole>(PORTAL_ROLES.USER);
  const [viewMode, setViewMode] = useState<'role' | 'matrix'>('role');

  const roleIcons: Record<PortalRole, JSX.Element> = {
    [PORTAL_ROLES.SUPER_ADMIN]: <Shield className="h-5 w-5 text-purple-600" />,
    [PORTAL_ROLES.ADMIN]: <Key className="h-5 w-5 text-blue-600" />,
    [PORTAL_ROLES.INVESTOR]: <Users className="h-5 w-5 text-green-600" />,
    [PORTAL_ROLES.USER]: <Users className="h-5 w-5 text-gray-600" />
  };

  const roleColors: Record<PortalRole, string> = {
    [PORTAL_ROLES.SUPER_ADMIN]: 'bg-purple-50 text-purple-700 border-purple-200',
    [PORTAL_ROLES.ADMIN]: 'bg-blue-50 text-blue-700 border-blue-200',
    [PORTAL_ROLES.INVESTOR]: 'bg-green-50 text-green-700 border-green-200',
    [PORTAL_ROLES.USER]: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  // Check if a role has a specific permission (considering wildcards)
  const roleHasPermission = (role: PortalRole, permission: string): boolean => {
    const capabilities = ROLE_CAPABILITIES[role] || [];
    return capabilities.some(cap => {
      if (cap === permission) return true;
      if (cap.endsWith('*')) {
        const prefix = cap.slice(0, -1);
        return permission.startsWith(prefix);
      }
      return false;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Role Permissions</h2>
        <p className="text-muted-foreground">
          View permissions and capabilities for each portal role
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Permissions are currently managed through code configuration. This view is read-only
          and shows the current permission structure for reference.
        </AlertDescription>
      </Alert>

      {/* View Mode Toggle */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'role' | 'matrix')}>
        <TabsList>
          <TabsTrigger value="role">Role View</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>

        {/* Role View */}
        <TabsContent value="role" className="space-y-6">
          {/* Role Hierarchy Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role Hierarchy</CardTitle>
              <CardDescription>
                Higher roles inherit all permissions from lower roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {ROLE_HIERARCHY.slice().reverse().map((role, index) => (
                  <div key={role} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg border",
                        roleColors[role]
                      )}
                    >
                      {roleIcons[role]}
                      <span className="font-medium">{getRoleDisplayName(role)}</span>
                    </div>
                    {index < ROLE_HIERARCHY.length - 1 && (
                      <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select a Role to View Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.values(PORTAL_ROLES).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors",
                      selectedRole === role
                        ? roleColors[role]
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {roleIcons[role]}
                    <span className="mt-2 font-medium">
                      {getRoleDisplayName(role)}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {roleIcons[selectedRole]}
                <span>{getRoleDisplayName(selectedRole)} Permissions</span>
              </CardTitle>
              <CardDescription>
                Capabilities and access levels for this role
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const permissions = ROLE_CAPABILITIES[selectedRole] || [];
                const categories = categorizePermissions(permissions);

                if (Object.keys(categories).length === 0) {
                  return (
                    <p className="text-muted-foreground">
                      No specific permissions assigned to this role.
                    </p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {Object.entries(categories).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-medium capitalize flex items-center space-x-2">
                          {category === 'Full Access' ? (
                            <Unlock className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Lock className="h-4 w-4 text-gray-600" />
                          )}
                          <span>{category.replace('_', ' ')}</span>
                        </h4>
                        <div className="ml-6 space-y-1">
                          {perms.map((perm, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <Check className="h-3 w-3 text-green-600" />
                              <span className="text-sm text-gray-700">{perm}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permission Matrix View */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                Overview of all permissions across all roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Permission</th>
                      {Object.values(PORTAL_ROLES).map(role => (
                        <th key={role} className="text-center py-2 px-4 min-w-[120px]">
                          <div className="flex flex-col items-center space-y-1">
                            {roleIcons[role]}
                            <span className="text-xs font-medium">
                              {getRoleDisplayName(role)}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Full Access Row */}
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Full Portal Access</td>
                      {Object.values(PORTAL_ROLES).map(role => (
                        <td key={role} className="text-center py-3 px-4">
                          {ROLE_CAPABILITIES[role]?.includes('portal:*') ? (
                            <Badge className="bg-purple-100 text-purple-700">
                              <Check className="h-3 w-3 mr-1" />
                              All
                            </Badge>
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Individual Permissions */}
                    {getAllUniquePermissions().map(permission => {
                      const [, category, action] = permission.split(':');
                      return (
                        <tr key={permission} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium capitalize">{category}</span>
                              <span className="text-gray-500 ml-2 text-sm">{action}</span>
                            </div>
                          </td>
                          {Object.values(PORTAL_ROLES).map(role => (
                            <td key={role} className="text-center py-3 px-4">
                              {roleHasPermission(role, permission) ? (
                                <Check className="h-4 w-4 text-green-600 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Wildcard Permissions:</strong> Permissions ending with * grant access to all sub-permissions
                in that category.
              </p>
              <p>
                <strong>Role Inheritance:</strong> Higher-level roles automatically inherit permissions from
                lower-level roles.
              </p>
              <p>
                <strong>Code-Based Configuration:</strong> These permissions are defined in the application code
                and require a deployment to change.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}