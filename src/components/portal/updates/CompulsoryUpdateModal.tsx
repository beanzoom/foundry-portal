import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useUnreadUpdates, useAcknowledgeUpdate, useMarkUpdateViewed } from '@/hooks/usePortalUpdates';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function CompulsoryUpdateModal() {
  const { data: unreadUpdates = [], isLoading, refetch } = useUnreadUpdates();
  const acknowledgeUpdate = useAcknowledgeUpdate();
  const markViewed = useMarkUpdateViewed();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  // Filter for compulsory updates that haven't been acknowledged
  // Include local tracking to prevent showing already acknowledged updates
  const compulsoryUpdates = unreadUpdates.filter(
    update => update.update_type === 'compulsory' && 
             !update.is_acknowledged && 
             !acknowledgedIds.has(update.update_id)
  );

  // Debug logging
  useEffect(() => {
    console.log('CompulsoryUpdateModal state:', {
      unreadUpdatesCount: unreadUpdates.length,
      compulsoryUpdatesCount: compulsoryUpdates.length,
      acknowledgedIdsCount: acknowledgedIds.size,
      currentIndex,
      compulsoryUpdateIds: compulsoryUpdates.map(u => u.update_id),
      acknowledgedIds: Array.from(acknowledgedIds)
    });
  }, [unreadUpdates, compulsoryUpdates, acknowledgedIds, currentIndex]);

  // Clear acknowledged IDs when no more compulsory updates
  useEffect(() => {
    if (compulsoryUpdates.length === 0 && acknowledgedIds.size > 0) {
      setAcknowledgedIds(new Set());
      setCurrentIndex(0);
    }
  }, [compulsoryUpdates.length, acknowledgedIds.size]);

  const currentUpdate = compulsoryUpdates[currentIndex];
  const hasMultiple = compulsoryUpdates.length > 1;

  // Mark as viewed when modal opens
  useEffect(() => {
    if (currentUpdate) {
      markViewed.mutate(currentUpdate.update_id);
    }
  }, [currentUpdate?.update_id]);

  // Reset scroll tracking when update changes
  useEffect(() => {
    setHasScrolledToBottom(false);
    // Check if content is already fully visible after a short delay
    setTimeout(() => {
      const scrollArea = document.querySelector('[data-scroll-area]');
      if (scrollArea) {
        const element = scrollArea as HTMLDivElement;
        console.log('Scroll check:', {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          needsScroll: element.scrollHeight > element.clientHeight
        });
        // If content doesn't overflow, mark as scrolled
        if (element.scrollHeight <= element.clientHeight + 5) { // Add small buffer for rounding
          console.log('Content fits, enabling button');
          setHasScrolledToBottom(true);
        }
      } else {
        console.log('Scroll area not found, enabling button as fallback');
        // If we can't find the scroll area, enable the button as a fallback
        setHasScrolledToBottom(true);
      }
    }, 200); // Increased delay to ensure DOM is ready
  }, [currentUpdate?.update_id]); // Changed dependency to current update ID

  const handleAcknowledge = async () => {
    if (!currentUpdate) return;
    
    setIsAcknowledging(true);
    try {
      await acknowledgeUpdate.mutateAsync(currentUpdate.update_id);
      
      // Track this acknowledgment locally to prevent re-showing
      const newAcknowledgedIds = new Set([...acknowledgedIds, currentUpdate.update_id]);
      setAcknowledgedIds(newAcknowledgedIds);
      
      // Reset scroll state for next update
      setHasScrolledToBottom(false);
      
      // Force a refetch to get the updated list
      await refetch();
      
      // After refetch, the compulsoryUpdates array will be updated
      // The current update should now be filtered out
      // Keep index at 0 to show the first remaining update
      setCurrentIndex(0);
      
    } catch (error) {
      console.error('Failed to acknowledge update:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom = 
      Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10;
    
    console.log('Scrolling:', {
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      scrollTop: element.scrollTop,
      scrolledToBottom
    });
    
    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Don't render anything if loading or no compulsory updates
  if (isLoading || compulsoryUpdates.length === 0 || !currentUpdate) {
    return null;
  }

  return (
    <Dialog open={compulsoryUpdates.length > 0} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] p-0"
        onPointerDownOutside={(e) => e.preventDefault()} // Prevent closing
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent ESC closing
        hideCloseButton={true} // Hide X button
      >
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">
                {currentUpdate.title}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="destructive">Compulsory Update</Badge>
                {currentUpdate.published_at && (
                  <span className="text-gray-500">
                    Published {format(new Date(currentUpdate.published_at), 'MMM d, yyyy')}
                  </span>
                )}
                {compulsoryUpdates.length > 0 && (
                  <Badge variant="outline" className="ml-auto">
                    Update {currentIndex + 1} of {compulsoryUpdates.length}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4">
          <ScrollArea 
            className="h-[400px] w-full rounded-md border p-4"
            onScroll={handleScroll}
            data-scroll-area
          >
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: currentUpdate.content }}
            />
            
            {/* Scroll indicator */}
            {!hasScrolledToBottom && (
              <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  Scroll to continue ↓
                </span>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-500">
                {!hasScrolledToBottom && (
                  <span>Please read the entire update to continue</span>
                )}
                {hasScrolledToBottom && hasMultiple && (
                  <span>After acknowledging, you'll see the next update</span>
                )}
              </div>
              {!hasScrolledToBottom && (
                <button
                  onClick={() => setHasScrolledToBottom(true)}
                  className="text-xs text-purple-600 underline text-left hover:text-purple-700"
                >
                  I have read this update (enable button)
                </button>
              )}
            </div>
            
            <Button
              onClick={handleAcknowledge}
              disabled={!hasScrolledToBottom || isAcknowledging}
              className={cn(
                "min-w-[120px]",
                hasScrolledToBottom && "bg-purple-600 hover:bg-purple-700"
              )}
            >
              {isAcknowledging ? (
                "Processing..."
              ) : hasMultiple && currentIndex < compulsoryUpdates.length - 1 ? (
                <>
                  Acknowledge & Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              ) : (
                "I Acknowledge"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}