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
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Calendar } from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  response_count?: number;
  due_date?: string | null;
}

export interface ReopenOptions {
  clearResponses: boolean;
  newDueDate: string | null;
}

interface ReopenSurveyDialogProps {
  survey: Survey | null;
  open: boolean;
  onConfirm: (options: ReopenOptions) => Promise<void>;
  onCancel: () => void;
}

export function ReopenSurveyDialog({
  survey,
  open,
  onConfirm,
  onCancel
}: ReopenSurveyDialogProps) {
  const [clearResponses, setClearResponses] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [isReopening, setIsReopening] = useState(false);

  if (!survey) return null;

  const handleConfirm = async () => {
    setIsReopening(true);
    try {
      await onConfirm({
        clearResponses,
        newDueDate: newDueDate || null
      });
      // Reset form
      setClearResponses(false);
      setNewDueDate('');
    } finally {
      setIsReopening(false);
    }
  };

  const handleCancel = () => {
    setClearResponses(false);
    setNewDueDate('');
    onCancel();
  };

  // Format existing due date for input if it exists
  const existingDueDate = survey.due_date 
    ? new Date(survey.due_date).toISOString().slice(0, 16)
    : '';

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Reopen Survey
          </DialogTitle>
          <DialogDescription>
            Reopen "{survey.title}" to accept new responses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current status */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              Current responses: <span className="font-semibold">{survey.response_count || 0}</span>
            </p>
            {survey.due_date && (
              <p className="text-sm text-gray-600 mt-1">
                Original due date: <span className="font-semibold">
                  {new Date(survey.due_date).toLocaleDateString()}
                </span>
              </p>
            )}
          </div>

          {/* Clear responses option */}
          <div className="flex items-start space-x-3">
            <Switch
              id="clear-responses"
              checked={clearResponses}
              onCheckedChange={setClearResponses}
            />
            <div className="space-y-1">
              <Label htmlFor="clear-responses" className="text-base cursor-pointer">
                Clear all existing responses
              </Label>
              <p className="text-sm text-gray-500">
                Start fresh with no previous responses
              </p>
            </div>
          </div>

          {/* Warning for clearing responses */}
          {clearResponses && survey.response_count && survey.response_count > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong>Warning:</strong> All {survey.response_count} existing responses 
                will be permanently deleted. This cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {/* New due date */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              New Due Date (Optional)
            </Label>
            <Input
              id="due-date"
              type="datetime-local"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              placeholder={existingDueDate}
            />
            <p className="text-xs text-gray-500">
              Leave blank to keep the existing due date or remove it
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isReopening}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isReopening}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isReopening ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Reopening...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reopen Survey
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}