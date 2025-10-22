import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useUnreadUpdates, useDismissUpdate, useMarkUpdateViewed } from '@/hooks/usePortalUpdates';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { UpdateModal } from './UpdateModal';

export function AdvisoryNotifications() {
  const navigate = useNavigate();
  const { data: unreadUpdates = [] } = useUnreadUpdates();
  const dismissUpdate = useDismissUpdate();
  const markViewed = useMarkUpdateViewed();
  
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Count of all unread updates (both types)
  const unreadCount = unreadUpdates.length;

  const handleUpdateClick = (update: any) => {
    // Mark as viewed
    markViewed.mutate(update.update_id);
    
    // Open in modal
    setSelectedUpdate(update);
    setIsDropdownOpen(false);
  };

  const handleDismiss = async (e: React.MouseEvent, updateId: string) => {
    e.stopPropagation(); // Prevent opening the update
    try {
      await dismissUpdate.mutateAsync(updateId);
    } catch (error) {
      console.error('Failed to dismiss update:', error);
    }
  };

  const getUpdateIcon = (type: string) => {
    return type === 'compulsory' ? (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    ) : (
      <Info className="h-4 w-4 text-blue-500" />
    );
  };

  const getUpdateTypeLabel = (type: string) => {
    return type === 'compulsory' ? (
      <Badge variant="destructive" className="text-xs">Required</Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">Info</Badge>
    );
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-gray-300 rounded transition-colors"
          >
            <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-blue-600" : "text-gray-700"}`} />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white border-0"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-96 p-0"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Updates</h3>
              {unreadCount > 0 && (
                <Badge variant="outline">{unreadCount} unread</Badge>
              )}
            </div>
          </div>
          
          {unreadCount === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No new updates</p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/portal/updates');
                }}
              >
                View all updates
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px]">
                <div className="p-2">
                  {unreadUpdates.map((update) => (
                    <div
                      key={update.update_id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2 border"
                      onClick={() => handleUpdateClick(update)}
                    >
                      <div className="mt-1">
                        {getUpdateIcon(update.update_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm truncate">
                              {update.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {getUpdateTypeLabel(update.update_type)}
                              <span className="text-xs text-gray-500">
                                {format(new Date(update.published_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          
                          {update.update_type === 'advisory' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:bg-gray-200"
                              onClick={(e) => handleDismiss(e, update.update_id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/portal/updates');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View all updates
                </DropdownMenuItem>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Update Modal for viewing full content */}
      {selectedUpdate && (
        <UpdateModal
          update={selectedUpdate}
          isOpen={!!selectedUpdate}
          onClose={() => setSelectedUpdate(null)}
        />
      )}
    </>
  );
}