import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface PromoteUserDialogProps {
  user: {
    user_id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PORTAL_ROLES = [
  { value: 'portal_member', label: 'Portal Member', description: 'Standard portal access' },
  { value: 'investor', label: 'Investor', description: 'Investor portal access' },
  { value: 'admin', label: 'Admin', description: 'Administrative access' },
  { value: 'super_admin', label: 'Super Admin', description: 'Full administrative control' }
];

export function PromoteUserDialog({ user, isOpen, onClose, onSuccess }: PromoteUserDialogProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [promoting, setPromoting] = useState(false);

  if (!user) return null;

  const userName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.email;

  const handlePromote = async () => {
    if (!selectedRole) {
      toast({
        title: 'No role selected',
        description: 'Please select a role to promote the user to',
        variant: 'destructive'
      });
      return;
    }

    if (selectedRole === user.role) {
      toast({
        title: 'Same role',
        description: 'User already has this role',
        variant: 'destructive'
      });
      return;
    }

    try {
      setPromoting(true);

      const { data, error } = await supabase.rpc('promote_portal_user', {
        p_user_id: user.user_id,
        p_new_role: selectedRole
      });

      if (error) throw error;

      const result = data?.[0];

      if (!result?.success) {
        throw new Error(result?.message || 'Failed to promote user');
      }

      toast({
        title: 'User promoted',
        description: result.message
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error promoting user:', err);
      toast({
        title: 'Promotion failed',
        description: err.message || 'Failed to promote user',
        variant: 'destructive'
      });
    } finally {
      setPromoting(false);
    }
  };

  const selectedRoleInfo = PORTAL_ROLES.find(r => r.value === selectedRole);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Promote User
          </DialogTitle>
          <DialogDescription>
            Change the portal role for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Role */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Current Role</p>
            <Badge className="capitalize">{user.role.replace('_', ' ')}</Badge>
          </div>

          {/* New Role Selection */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">New Role</p>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role..." />
              </SelectTrigger>
              <SelectContent>
                {PORTAL_ROLES.map((role) => (
                  <SelectItem
                    key={role.value}
                    value={role.value}
                    disabled={role.value === user.role}
                  >
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-gray-500">{role.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Warning for Super Admin */}
          {selectedRole === 'super_admin' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Warning: Super Admin Access</p>
                <p className="text-xs mt-1">
                  This role has full administrative control and can promote other users.
                </p>
              </div>
            </div>
          )}

          {/* Role Change Preview */}
          {selectedRole && selectedRole !== user.role && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <span className="font-medium">{userName}</span> will be promoted from{' '}
                <span className="font-medium capitalize">{user.role.replace('_', ' ')}</span> to{' '}
                <span className="font-medium">{selectedRoleInfo?.label}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={promoting}>
            Cancel
          </Button>
          <Button
            onClick={handlePromote}
            disabled={!selectedRole || selectedRole === user.role || promoting}
          >
            {promoting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Promote User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
