import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Trash2 } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  response_count?: number;
  question_count?: number;
}

interface ForceDeleteSurveyDialogProps {
  survey: Survey | null;
  open: boolean;
  onConfirm: (surveyId: string, confirmTitle: string) => Promise<void>;
  onCancel: () => void;
}

export function ForceDeleteSurveyDialog({
  survey,
  open,
  onConfirm,
  onCancel
}: ForceDeleteSurveyDialogProps) {
  const [confirmTitle, setConfirmTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!survey) return null;

  const canDelete = confirmTitle === survey.title;

  const handleConfirm = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      await onConfirm(survey.id, confirmTitle);
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
            Force Delete Survey
          </DialogTitle>
        </DialogHeader>

        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>This action cannot be undone!</strong>
            <div className="mt-2">This will permanently delete:</div>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>Survey: "{survey.title}"</li>
              <li>{survey.response_count || 0} user responses</li>
              <li>{survey.question_count || 0} questions</li>
              <li>All associated answer data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-title">
              Type <span className="font-mono bg-gray-100 px-1">{survey.title}</span> to confirm:
            </Label>
            <Input
              id="confirm-title"
              placeholder="Enter survey title exactly"
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
                Delete Everything
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}