import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

export function AddPortalAdmins() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const addPortalAdmins = async () => {
    setLoading(true);
    setMessage({ type: null, text: '' });

    try {
      // First check if we already have portal admins
      const { data: existingAdmins, error: checkError } = await supabase
        .from('portal_memberships')
        .select('user_id')
        .eq('portal_role', 'portal_admin')
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (existingAdmins && existingAdmins.length > 0) {
        setMessage({ 
          type: 'error', 
          text: `Portal already has ${existingAdmins.length} admin(s). No need to add more.` 
        });
        return;
      }

      // Get system super_admins to make portal admins
      const { data: systemAdmins, error: adminError } = await supabase
        .from('system_user_assignments')
        .select('user_id')
        .eq('system_role', 'super_admin')
        .eq('is_active', true)
        .limit(2);

      if (adminError) throw adminError;

      if (!systemAdmins || systemAdmins.length === 0) {
        setMessage({ type: 'error', text: 'No system super_admins found to make portal admins.' });
        return;
      }

      // Add portal admin roles
      const portalAdmins = systemAdmins.map((admin, index) => ({
        user_id: admin.user_id,
        portal_role: 'portal_admin',
        subscription_tier: 'premium',
        is_active: true,
        notes: `Portal admin ${index + 1} - from system super_admin`
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('portal_memberships')
        .insert(portalAdmins)
        .select();

      if (insertError) throw insertError;

      setMessage({ 
        type: 'success', 
        text: `Successfully added ${inserted?.length || 0} portal admin(s)! Refresh the page to see them.` 
      });

      // Also add some test members for variety
      const { data: orgUsers } = await supabase
        .from('organization_memberships')
        .select('user_id, org_role')
        .in('org_role', ['owner', 'manager'])
        .eq('is_active', true)
        .limit(5);

      if (orgUsers && orgUsers.length > 0) {
        const portalMembers = orgUsers
          .filter(u => !systemAdmins.find(a => a.user_id === u.user_id))
          .map(u => ({
            user_id: u.user_id,
            portal_role: u.org_role === 'owner' ? 'portal_member' : 'portal_member',
            subscription_tier: u.org_role === 'owner' ? 'standard' : 'basic',
            is_active: true,
            notes: `Portal member - from org ${u.org_role}`
          }));

        if (portalMembers.length > 0) {
          const { data: membersInserted } = await supabase
            .from('portal_memberships')
            .insert(portalMembers)
            .select();

          if (membersInserted) {
            setMessage(prev => ({
              type: 'success',
              text: prev.text + ` Also added ${membersInserted.length} portal members.`
            }));
          }
        }
      }

    } catch (error: any) {
      console.error('Error adding portal admins:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to add portal admins' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Setup: Add Portal Admins</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This will automatically assign portal admin roles to system super_admins and add some test members.
        </p>
        
        <Button 
          onClick={addPortalAdmins} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Loading...</>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Portal Admins & Test Members
            </>
          )}
        </Button>

        {message.type && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}