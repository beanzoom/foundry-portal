import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Bug, Database } from 'lucide-react';

export function DebugPortalUsers() {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const runDebug = async () => {
    setLoading(true);
    setDebugInfo({});

    try {
      const results: any = {};

      // 1. Check system_user_assignments
      const { data: systemUsers, error: systemError } = await supabase
        .from('system_user_assignments')
        .select(`
          user_id,
          system_role,
          is_active,
          profiles!system_user_assignments_user_id_fkey (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('is_active', true);

      results.systemUsers = {
        error: systemError,
        count: systemUsers?.length || 0,
        data: systemUsers
      };

      // 2. Check super_admin/admin specifically
      const { data: admins, error: adminError } = await supabase
        .from('system_user_assignments')
        .select(`
          user_id,
          system_role,
          is_active,
          profiles!system_user_assignments_user_id_fkey (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .in('system_role', ['super_admin', 'admin'])
        .eq('is_active', true);

      results.admins = {
        error: adminError,
        count: admins?.length || 0,
        data: admins
      };

      // 3. Check user_roles table (old system)
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          role,
          profiles!inner (
            email,
            first_name,
            last_name
          )
        `)
        .in('role', ['super_admin', 'admin']);

      results.userRoles = {
        error: rolesError,
        count: userRoles?.length || 0,
        data: userRoles
      };

      // 4. Check portal_memberships (should be empty after cleanup)
      const { data: portalMembers, error: portalError } = await supabase
        .from('portal_memberships')
        .select('*')
        .eq('is_active', true);

      results.portalMembers = {
        error: portalError,
        count: portalMembers?.length || 0,
        data: portalMembers
      };

      // 5. Check organization_memberships
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_memberships')
        .select('user_id, org_role, is_active')
        .eq('is_active', true);

      results.orgMembers = {
        error: orgError,
        count: orgMembers?.length || 0,
        data: orgMembers
      };

      setDebugInfo(results);

    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Portal Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDebug} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running debug...' : 'Run Debug Check'}
        </Button>

        {Object.keys(debugInfo).length > 0 && (
          <div className="space-y-4">
            {/* System User Assignments */}
            {debugInfo.systemUsers && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">System User Assignments (ALL)</h3>
                <div className="text-sm">
                  <p>Count: {debugInfo.systemUsers.count}</p>
                  {debugInfo.systemUsers.error && (
                    <p className="text-red-600">Error: {debugInfo.systemUsers.error.message}</p>
                  )}
                  {debugInfo.systemUsers.data && (
                    <div className="mt-2 space-y-1">
                      {debugInfo.systemUsers.data.map((u: any) => (
                        <div key={u.user_id} className="text-xs">
                          • {u.profiles?.email} - {u.system_role} (active: {u.is_active ? 'yes' : 'no'})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admins Only */}
            {debugInfo.admins && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">System Admins (super_admin/admin)</h3>
                <div className="text-sm">
                  <p>Count: {debugInfo.admins.count}</p>
                  {debugInfo.admins.error && (
                    <p className="text-red-600">Error: {debugInfo.admins.error.message}</p>
                  )}
                  {debugInfo.admins.data && (
                    <div className="mt-2 space-y-1">
                      {debugInfo.admins.data.map((u: any) => (
                        <div key={u.user_id} className="text-xs">
                          • {u.profiles?.email} - {u.system_role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Roles (old system) */}
            {debugInfo.userRoles && (
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">User Roles Table (old system)</h3>
                <div className="text-sm">
                  <p>Count: {debugInfo.userRoles.count}</p>
                  {debugInfo.userRoles.error && (
                    <p className="text-red-600">Error: {debugInfo.userRoles.error.message}</p>
                  )}
                  {debugInfo.userRoles.data && (
                    <div className="mt-2 space-y-1">
                      {debugInfo.userRoles.data.map((u: any, i: number) => (
                        <div key={i} className="text-xs">
                          • {u.profiles?.email} - {u.role}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Portal Memberships */}
            {debugInfo.portalMembers && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Portal Memberships</h3>
                <div className="text-sm">
                  <p>Count: {debugInfo.portalMembers.count} (should be 0 after cleanup)</p>
                  {debugInfo.portalMembers.error && (
                    <p className="text-red-600">Error: {debugInfo.portalMembers.error.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Organization Memberships */}
            {debugInfo.orgMembers && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Organization Memberships</h3>
                <div className="text-sm">
                  <p>Count: {debugInfo.orgMembers.count}</p>
                  {debugInfo.orgMembers.error && (
                    <p className="text-red-600">Error: {debugInfo.orgMembers.error.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}