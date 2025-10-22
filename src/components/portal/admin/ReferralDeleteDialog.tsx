import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  Trash2,
  User,
  Mail,
  Database,
  FileX,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import {
  checkReferralDeletionEligibility,
  deleteReferral,
  formatDeletionSummary,
  type DeletionEligibilityResponse
} from '@/services/referral-deletion.service';
import { useToast } from '@/hooks/use-toast';

interface ReferralDeleteDialogProps {
  referral: {
    id: string;
    referee_first_name: string;
    referee_last_name: string;
    referee_email: string;
    referee_phone?: string;
    referee_company?: string;
    status: string;
    referrer?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReferralDeleteDialog({
  referral,
  isOpen,
  onClose,
  onSuccess
}: ReferralDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [eligibility, setEligibility] = useState<DeletionEligibilityResponse | null>(null);
  const [reason, setReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [step, setStep] = useState<'check' | 'confirm' | 'result'>('check');

  useEffect(() => {
    if (isOpen && referral) {
      // Reset state when dialog opens
      setStep('check');
      setEligibility(null);
      setReason('');
      setAdminNote('');
      setConfirmationChecked(false);
      checkEligibility();
    }
  }, [isOpen, referral]);

  const checkEligibility = async () => {
    if (!referral) return;

    setChecking(true);
    try {
      const result = await checkReferralDeletionEligibility(referral.id);
      setEligibility(result);
      setStep(result.eligible ? 'confirm' : 'check');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check deletion eligibility',
        variant: 'destructive'
      });
      onClose();
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async () => {
    if (!referral || !confirmationChecked) return;

    setLoading(true);
    try {
      const result = await deleteReferral(referral.id, reason, adminNote);

      if (result.success) {
        toast({
          title: 'Referral Deleted',
          description: (
            <div className="space-y-1">
              <p>Successfully deleted referral for {referral.referee_email}</p>
              {result.deleted && (
                <div className="text-xs text-gray-600">
                  • {result.deleted.contacts_deleted} contact(s) removed<br />
                  • {result.deleted.emails_cancelled} email(s) cancelled
                </div>
              )}
            </div>
          )
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: 'Deletion Failed',
          description: result.error || 'Failed to delete referral',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!referral) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {checking ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Referral
              </DialogTitle>
              <DialogDescription>
                {step === 'check' && eligibility?.eligible === false
                  ? 'This referral cannot be deleted'
                  : 'Permanently remove this referral and all related data'}
              </DialogDescription>
            </DialogHeader>

            {/* Content based on step */}
            {step === 'check' && eligibility && (
              <div className="space-y-4">
                {/* Referral Info */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {referral.referee_first_name} {referral.referee_last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{referral.referee_email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-gray-500">Status:</span>{' '}
                          <Badge variant={referral.status === 'registered' ? 'default' : 'secondary'}>
                            {referral.status}
                          </Badge>
                        </div>
                        {referral.referrer && (
                          <div className="text-sm">
                            <span className="text-gray-500">Referred by:</span>{' '}
                            <span>{referral.referrer.first_name} {referral.referrer.last_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Eligibility Result */}
                {eligibility.eligible ? (
                  <>
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription>
                        <strong>Eligible for deletion</strong>
                        <p className="mt-1 text-sm">
                          This referral can be safely deleted as the user has not registered.
                        </p>
                      </AlertDescription>
                    </Alert>

                    {/* What will be deleted */}
                    {eligibility.related_data && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">What will be deleted:</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {formatDeletionSummary(eligibility).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <Database className="h-3 w-3" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cannot delete this referral</strong>
                      <ul className="mt-2 space-y-1">
                        {eligibility.reasons?.map((reason, idx) => (
                          <li key={idx} className="text-sm">• {reason}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {step === 'confirm' && eligibility?.eligible && (
              <div className="space-y-4">
                {/* Warning */}
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription>
                    <strong className="text-orange-900">This action cannot be undone</strong>
                    <p className="mt-1 text-sm text-orange-800">
                      All data related to this referral will be permanently deleted. The referral
                      will be archived for audit purposes only.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Reason for deletion */}
                <div className="space-y-2">
                  <Label htmlFor="reason">
                    Reason for deletion <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Test referral, Duplicate entry, User requested removal..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="min-h-[80px]"
                    required
                  />
                </div>

                {/* Admin notes (optional) */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Admin notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional context or notes about this deletion..."
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>

                {/* Confirmation checkbox */}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="confirm"
                    checked={confirmationChecked}
                    onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
                  />
                  <Label
                    htmlFor="confirm"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I understand that this action is permanent and will delete all data
                    associated with this referral, including contact records and pending emails.
                  </Label>
                </div>

                {/* Summary of what will be deleted */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Summary of deletion:</p>
                        <ul className="space-y-0.5">
                          <li>• Referral for: {referral.referee_first_name} {referral.referee_last_name} ({referral.referee_email})</li>
                          {eligibility.related_data && formatDeletionSummary(eligibility).map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {step === 'check' && eligibility?.eligible && (
            <Button
              variant="destructive"
              onClick={() => setStep('confirm')}
            >
              Continue to Delete
            </Button>
          )}
          {step === 'confirm' && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || !reason.trim() || !confirmationChecked}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}