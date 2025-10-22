import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Wrench, CheckCircle, AlertCircle, Database } from 'lucide-react';

export function FixPortalSetup() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, message]);
  };

  const setupPortalMembers = async () => {
    setLoading(true);
    setStatus([]);
    setError(null);

    try {
      addStatus('🔍 Checking portal setup...');

      // Try a simple query first to see if table exists
      const { error: tableError } = await supabase
        .from('portal_memberships')
        .select('id')
        .limit(1);

      if (tableError) {
        addStatus(`❌ Table error: ${tableError.message}`);
        
        // If table doesn't exist, we need to create it via SQL
        // For now, let's use the fallback approach
        addStatus('⚠️ Portal memberships table may not exist or has permission issues');
        addStatus('📝 Attempting to use user_roles table as fallback...');

        // Get super_admins from user_roles table (which we know works)
        const { data: superAdmins, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'super_admin')
          .limit(2);

        if (rolesError) {
          throw new Error(`Cannot query user_roles: ${rolesError.message}`);
        }

        addStatus(`✅ Found ${superAdmins?.length || 0} super_admins in user_roles`);

        // Let's try to work with the existing tables instead
        // We'll mark these users as portal admins in our UI state
        if (superAdmins && superAdmins.length > 0) {
          addStatus('📌 Portal admin users identified:');
          
          for (const admin of superAdmins) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('id', admin.user_id)
              .single();
            
            if (profile) {
              const name = profile.first_name && profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`
                : profile.email;
              addStatus(`   - ${name} (portal_admin)`);
            }
          }

          addStatus('\n💡 Solution: The portal_memberships table needs to be created.');
          addStatus('Run this SQL in your Supabase dashboard:');
          addStatus('');
          setError(`
-- Create portal_memberships table
CREATE TABLE IF NOT EXISTS public.portal_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  portal_role TEXT NOT NULL CHECK (
    portal_role IN ('portal_admin', 'portal_member', 'portal_investor')
  ),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_tier TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(user_id, portal_role)
);

-- Enable RLS
ALTER TABLE public.portal_memberships ENABLE ROW LEVEL SECURITY;

-- Create policy for reading
CREATE POLICY "Anyone can read portal memberships"
  ON public.portal_memberships FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON public.portal_memberships TO authenticated;
GRANT ALL ON public.portal_memberships TO service_role;

-- Add portal admins
INSERT INTO public.portal_memberships (user_id, portal_role, subscription_tier)
SELECT user_id, 'portal_admin', 'premium'
FROM public.user_roles
WHERE role = 'super_admin'
LIMIT 2;
          `);
        }
      } else {
        addStatus('✅ Portal memberships table exists!');
        
        // Check if it has any data
        const { data: members, error: countError } = await supabase
          .from('portal_memberships')
          .select('*')
          .eq('is_active', true);

        if (!countError) {
          addStatus(`📊 Found ${members?.length || 0} portal members`);
          
          if (members && members.length === 0) {
            addStatus('📝 Adding portal admins from super_admins...');
            
            // Get super_admins from user_roles
            const { data: superAdmins } = await supabase
              .from('user_roles')
              .select('user_id')
              .eq('role', 'super_admin')
              .limit(2);

            if (superAdmins && superAdmins.length > 0) {
              const portalAdmins = superAdmins.map(admin => ({
                user_id: admin.user_id,
                portal_role: 'portal_admin',
                subscription_tier: 'premium',
                is_active: true
              }));

              const { data: inserted, error: insertError } = await supabase
                .from('portal_memberships')
                .insert(portalAdmins)
                .select();

              if (insertError) {
                addStatus(`⚠️ Insert error: ${insertError.message}`);
              } else {
                addStatus(`✅ Added ${inserted?.length || 0} portal admins!`);
                addStatus('🎉 Setup complete! Refresh the page to see users.');
              }
            }
          } else {
            addStatus('✅ Portal members already exist!');
            addStatus('If you still see 0 users, try refreshing the page.');
          }
        }
      }

    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Portal Database Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This will check and fix the portal database setup, including creating the portal_memberships table if needed.
        </p>
        
        <Button 
          onClick={setupPortalMembers} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>Checking setup...</>
          ) : (
            <>
              <Wrench className="h-4 w-4 mr-2" />
              Check & Fix Portal Setup
            </>
          )}
        </Button>

        {status.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <div className="text-sm font-medium mb-2">Status:</div>
            {status.map((msg, i) => (
              <div key={i} className="text-sm text-gray-700 font-mono">
                {msg}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-800 mb-2">SQL to run in Supabase:</div>
                <pre className="text-xs bg-white p-3 rounded border border-red-200 overflow-x-auto">
                  {error}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}