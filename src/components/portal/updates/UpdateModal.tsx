import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, AlertTriangle } from 'lucide-react';
import { useAcknowledgeUpdate, useDismissUpdate } from '@/hooks/usePortalUpdates';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface UpdateModalProps {
  update: any;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateModal({ update, isOpen, onClose }: UpdateModalProps) {
  const acknowledgeUpdate = useAcknowledgeUpdate();
  const dismissUpdate = useDismissUpdate();
  
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCompulsory = update?.update_type === 'compulsory';
  const requiresAction = isCompulsory && !update?.is_acknowledged;

  // Reset scroll tracking when update changes
  useEffect(() => {
    setHasScrolledToBottom(false);
  }, [update?.update_id || update?.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!requiresAction) return; // Only track scroll for unacknowledged compulsory updates
    
    const element = e.currentTarget;
    const scrolledToBottom = 
      Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10;
    setHasScrolledToBottom(scrolledToBottom);
  };

  const handleAcknowledge = async () => {
    setIsProcessing(true);
    try {
      // Use update.id or update.update_id depending on the structure
      const updateId = update.update_id || update.id;
      await acknowledgeUpdate.mutateAsync(updateId);
      onClose();
    } catch (error) {
      console.error('Failed to acknowledge update:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      // Use update.id or update.update_id depending on the structure
      const updateId = update.update_id || update.id;
      console.log('Dismissing update:', { updateId, update }); // Debug log
      await dismissUpdate.mutateAsync(updateId);
      onClose();
    } catch (error) {
      console.error('Failed to dismiss update:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!requiresAction) {
      onClose();
    }
    // If requires action, prevent closing
  };

  if (!update) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] p-0"
        onPointerDownOutside={(e) => requiresAction && e.preventDefault()}
        onEscapeKeyDown={(e) => requiresAction && e.preventDefault()}
        hideCloseButton={requiresAction}
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              isCompulsory ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {isCompulsory ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <Info className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">
                {update.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={isCompulsory ? "destructive" : "secondary"}>
                  {isCompulsory ? 'Compulsory Update' : 'Advisory Update'}
                </Badge>
                {update.published_at && (
                  <span className="text-gray-500">
                    Published {format(new Date(update.published_at), 'MMM d, yyyy')}
                  </span>
                )}
                {update.target_audience === 'investors' && (
                  <Badge variant="outline">Investors Only</Badge>
                )}
              </div>
              {update.is_acknowledged && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ You acknowledged this update
                </div>
              )}
              {update.is_dismissed && (
                <div className="mt-2 text-sm text-gray-500">
                  You previously dismissed this update
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <ScrollArea 
            className="h-[400px] w-full rounded-md border p-4"
            onScroll={handleScroll}
          >
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: update.content }}
            />
            
            {/* Scroll indicator for compulsory updates */}
            {requiresAction && !hasScrolledToBottom && (
              <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  Scroll to continue ↓
                </span>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-0">
          {requiresAction ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500">
                {!hasScrolledToBottom ? 
                  "Please read the entire update to continue" : 
                  "You must acknowledge this update to proceed"
                }
              </span>
              <Button
                onClick={handleAcknowledge}
                disabled={!hasScrolledToBottom || isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? "Processing..." : "I Acknowledge"}
              </Button>
            </div>
          ) : update.update_type === 'advisory' && !update.is_dismissed ? (
            <div className="flex justify-end gap-2 w-full">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Keep in Notifications
              </Button>
              <Button
                onClick={handleDismiss}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? "Processing..." : "Dismiss"}
              </Button>
            </div>
          ) : (
            <Button onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}