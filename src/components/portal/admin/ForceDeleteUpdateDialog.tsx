import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';

interface ForceDeleteUpdateDialogProps {
  update: {
    id: string;
    title: string;
    type?: string;
    status?: string;
    acknowledgment_count?: number;
  } | null;
  open: boolean;
  onConfirm: (updateId: string, confirmTitle: string) => Promise<void>;
  onCancel: () => void;
}

export function ForceDeleteUpdateDialog({
  update,
  open,
  onConfirm,
  onCancel
}: ForceDeleteUpdateDialogProps) {
  const [confirmTitle, setConfirmTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!update) return null;

  const canDelete = confirmTitle === update.title;

  const handleConfirm = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(update.id, confirmTitle);
      setConfirmTitle('');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmTitle('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Force Delete Update
          </DialogTitle>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>This action cannot be undone!</strong>
            <div className="mt-2">This will permanently delete:</div>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>Update: "{update.title}"</li>
              {update.type === 'compulsory' && (
                <li>{update.acknowledgment_count || 0} user acknowledgments</li>
              )}
              <li>All associated data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-title">
              Type <span className="font-mono bg-gray-100 px-1">{update.title}</span> to confirm:
            </Label>
            <Input
              id="confirm-title"
              placeholder="Enter update title exactly"
              value={confirmTitle}
              onChange={(e) => setConfirmTitle(e.target.value)}
              className="font-mono"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500">
              Title is case-sensitive and must match exactly
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Force Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}