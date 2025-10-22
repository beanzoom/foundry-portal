import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertTriangle,
  Trash2,
  User,
  Mail,
  Building,
  Shield,
  Loader2,
  XCircle,
  CheckCircle
} from 'lucide-react';
import { createLogger } from '@/lib/logging';

const logger = createLogger('DeleteUserModal');

interface DeleteUserModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted?: () => void;
}

interface DeletionPreview {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
  };
  data_to_delete: {
    businesses: number;
    survey_responses: number;
    event_registrations: number;
    referrals_made: number;
    updates_created: number;
    surveys_created: number;
    events_created: number;
    marketing_conversions: number;
    portal_memberships: number;
  };
}

export function DeleteUserModal({ user, isOpen, onClose, onUserDeleted }: DeleteUserModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle both user.id and user.user_id formats
  const userId = user?.id || user?.user_id;

  useEffect(() => {
    if (isOpen && userId) {
      fetchDeletionPreview();
    }
  }, [isOpen, userId]);

  const fetchDeletionPreview = async () => {
    if (!userId) {
      setError('Invalid user data');
      setLoadingPreview(false);
      return;
    }

    setLoadingPreview(true);
    setError(null);

    try {
      // Query counts directly from tables (simple approach, no RPC needed)
      const [
        businessesResult,
        surveyResponsesResult,
        eventRegistrationsResult,
        referralsMadeResult,
        updatesCreatedResult,
        surveysCreatedResult,
        eventsCreatedResult,
        marketingConversionsResult,
        portalMembershipsResult
      ] = await Promise.all([
        supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portal_survey_responses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portal_event_registrations').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portal_referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId),
        supabase.from('portal_updates').select('id', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('portal_surveys').select('id', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('portal_events').select('id', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('marketing_conversions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portal_memberships').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ]);

      setPreview({
        user: {
          id: userId,
          email: user.email,
          name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email,
          role: user.role,
          created_at: user.created_at || user.user_created_at || new Date().toISOString()
        },
        data_to_delete: {
          businesses: businessesResult.count || 0,
          survey_responses: surveyResponsesResult.count || 0,
          event_registrations: eventRegistrationsResult.count || 0,
          referrals_made: referralsMadeResult.count || 0,
          updates_created: updatesCreatedResult.count || 0,
          surveys_created: surveysCreatedResult.count || 0,
          events_created: eventsCreatedResult.count || 0,
          marketing_conversions: (() => {
            if (marketingConversionsResult.error) {
              const err = marketingConversionsResult.error;
              // Check for missing table error (Postgres: 42P01, or message contains "does not exist")
              if (err.code === '42P01' || err.message?.includes('does not exist')) {
                logger.debug('marketing_conversions table does not exist (expected until migration runs)', err);
              } else {
                logger.error('Unexpected error querying marketing_conversions', err);
              }
              return 0;
            }
            return marketingConversionsResult.count || 0;
          })(),
          portal_memberships: portalMembershipsResult.count || 0
        }
      });
    } catch (err: any) {
      logger.error('Error fetching deletion preview', err);
      setError('Failed to load deletion preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to delete users",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    // Check current user's admin status

    // First check if current user is admin
    // Note: The database function expects 'user_id' not 'p_user_id'
    const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_portal_admin', {
      user_id: currentUser.id
    });

    // Admin check result verified

    if (!isAdmin) {
      setError('You do not have admin permissions to delete users');
      toast({
        title: "Error", 
        description: "You do not have admin permissions to delete users",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      if (!userId) {
        throw new Error('Invalid user data');
      }

      // Direct table deletion - CASCADE relationships will handle related data
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      toast({
        title: "User Deleted",
        description: `${user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email} has been permanently deleted`,
      });

      if (onUserDeleted) {
        onUserDeleted();
      }
    } catch (err: any) {
      
      // Show specific error messages
      if (err.message?.includes('Cannot delete your own account')) {
        setError('You cannot delete your own account');
      } else if (err.message?.includes('Cannot delete the last admin')) {
        setError('Cannot delete the last admin user. At least one admin must remain.');
      } else if (err.message?.includes('Insufficient permissions')) {
        setError('You do not have permission to delete users');
      } else {
        setError(err.message || 'Failed to delete user');
      }
      
      toast({
        title: "Error",
        description: error || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'portal_member':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatRole = (role: string) => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const getTotalDataCount = () => {
    if (!preview) return 0;
    const counts = preview.data_to_delete;
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete User Confirmation
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone
          </DialogDescription>
        </DialogHeader>

        {loadingPreview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            {/* User Information */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{preview.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{preview.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <Badge className={getRoleBadgeColor(preview.user.role)}>
                      {formatRole(preview.user.role)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data to be Deleted */}
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-orange-900">
                    The following data will be permanently deleted:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    {preview.data_to_delete.businesses > 0 && (
                      <li>• {preview.data_to_delete.businesses} business profile{preview.data_to_delete.businesses !== 1 ? 's' : ''}</li>
                    )}
                    {preview.data_to_delete.survey_responses > 0 && (
                      <li>• {preview.data_to_delete.survey_responses} survey response{preview.data_to_delete.survey_responses !== 1 ? 's' : ''}</li>
                    )}
                    {preview.data_to_delete.event_registrations > 0 && (
                      <li>• {preview.data_to_delete.event_registrations} event registration{preview.data_to_delete.event_registrations !== 1 ? 's' : ''}</li>
                    )}
                    {preview.data_to_delete.referrals_made > 0 && (
                      <li>• {preview.data_to_delete.referrals_made} referral{preview.data_to_delete.referrals_made !== 1 ? 's' : ''}</li>
                    )}
                    {preview.data_to_delete.updates_created > 0 && (
                      <li>• {preview.data_to_delete.updates_created} update{preview.data_to_delete.updates_created !== 1 ? 's' : ''} (author will be removed)</li>
                    )}
                    {preview.data_to_delete.surveys_created > 0 && (
                      <li>• {preview.data_to_delete.surveys_created} survey{preview.data_to_delete.surveys_created !== 1 ? 's' : ''} (creator will be removed)</li>
                    )}
                    {preview.data_to_delete.events_created > 0 && (
                      <li>• {preview.data_to_delete.events_created} event{preview.data_to_delete.events_created !== 1 ? 's' : ''} (creator will be removed)</li>
                    )}
                    {preview.data_to_delete.marketing_conversions > 0 && (
                      <li>• {preview.data_to_delete.marketing_conversions} marketing conversion{preview.data_to_delete.marketing_conversions !== 1 ? 's' : ''}</li>
                    )}
                    {preview.data_to_delete.portal_memberships > 0 && (
                      <li>• {preview.data_to_delete.portal_memberships} portal membership{preview.data_to_delete.portal_memberships !== 1 ? 's' : ''}</li>
                    )}
                  </ul>
                  {getTotalDataCount() === 0 && (
                    <p className="text-sm text-gray-600 italic">No associated data found</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            {/* Final Warning */}
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Warning:</strong> This action cannot be undone. The user will be permanently 
                removed from the system along with all their data.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load user information</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || loadingPreview || !preview}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Permanently
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}