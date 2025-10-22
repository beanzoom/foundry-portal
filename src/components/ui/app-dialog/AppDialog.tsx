
import React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AppDialogHeader } from './AppDialogHeader';
import { AppDialogBody } from './AppDialogBody';
import { AppDialogFooter } from './AppDialogFooter';
import type { AppDialogProps } from './types';
import { createLogger } from '@/lib/logging';

const logger = createLogger('AppDialog');

export interface EnhancedAppDialogProps extends AppDialogProps {
  onCloseButtonClick?: () => void;
  onEscapeKey?: () => void;
}

export const AppDialog = React.forwardRef<HTMLDivElement, EnhancedAppDialogProps>(({
  open,
  onOpenChange,
  onCloseButtonClick,
  onEscapeKey,
  onClose,
  children,
  className,
  title,
  description,
  footer,
  maxWidth = "lg",
  maxHeight,
  hideCloseButton = false,
  preventOutsideClose = false,
  showBackButton = false,
  onBack,
  backButtonLabel,
  closeOnEscape = true,
  dialogId,
  parentId,
  animationState = 'exited',
  initialFocusRef,
  ...restProps
}, ref) => {
  const defaultFocusRef = React.useRef<HTMLDivElement>(null);

  // Enhanced logging with hierarchy context
  React.useEffect(() => {
    console.log('[PHASE-3-DEBUG] AppDialog hierarchy configuration:', {
      dialogId,
      parentId,
      hasParent: !!parentId,
      hideCloseButton,
      hasTitle: !!title,
      willRenderHeader: !!title,
      showBackButton,
      hasInitialFocusRef: !!initialFocusRef,
      hierarchy: {
        isNested: !!parentId,
        level: parentId ? 'child' : 'root'
      }
    });
    logger.debug(`[DIALOG-HIERARCHY] AppDialog initialized:`, {
      dialogId,
      parentId,
      hasParent: !!parentId,
      open,
      title,
      hideCloseButton,
      showBackButton,
      hasInitialFocusRef: !!initialFocusRef
    });
  }, [dialogId, parentId, open, title, hideCloseButton, showBackButton, initialFocusRef]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  // Handle maxWidth - if it's a known key, use the class, otherwise use as-is
  const maxWidthClass = typeof maxWidth === 'string' && maxWidth in maxWidthClasses 
    ? maxWidthClasses[maxWidth as keyof typeof maxWidthClasses]
    : `max-w-${maxWidth}`;

  const maxHeightStyle = maxHeight ? { maxHeight } : undefined;

  // CRITICAL: Enhanced close handler with source tracking
  const handleClose = () => {
    console.log(`[APP-DIALOG] handleClose called for ${dialogId}`, {
      hasOnClose: !!onClose,
      hasOnCloseButtonClick: !!onCloseButtonClick,
      hasOnOpenChange: !!onOpenChange
    });
    logger.debug(`[DIALOG-CLOSE] Close button clicked for dialog: ${dialogId}`);
    
    if (onClose) {
      // Use custom close handler if provided
      onClose();
    } else if (onCloseButtonClick) {
      onCloseButtonClick();
    } else if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // CRITICAL: Isolate custom onBack handlers from dialog system
  const handleBackClick = () => {
    logger.debug(`[DIALOG-BACK-HIERARCHY] Back button clicked for dialog: ${dialogId}, parent: ${parentId}`);
    
    if (onBack) {
      onBack(); // Custom handler - STOP HERE, no context operations
      return; // CRITICAL: Don't continue to any close logic
    }
    
    // Only use default close logic if no custom onBack provided
    handleClose();
  };

  // Enhanced open/close change handler
  const handleOpenChange = (isOpen: boolean) => {
    logger.debug(`[DIALOG-OPEN-CHANGE] Dialog ${dialogId} open state changing to: ${isOpen}`);
    if (onOpenChange) {
      onOpenChange(isOpen);
    }
  };

  // CRITICAL: Enhanced keyboard handler with source tracking
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (!closeOnEscape) {
        e.preventDefault();
      } else {
        logger.debug(`[DIALOG-ESCAPE] Escape key pressed for dialog: ${dialogId}`);
        if (onEscapeKey) {
          onEscapeKey();
        } else {
          handleClose();
        }
      }
    }
  };

  // Determine animation classes based on state
  const animationClasses = React.useMemo(() => {
    switch (animationState) {
      case 'entering':
        return 'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] duration-200';
      case 'entered':
        return '';
      case 'exiting':
        return 'animate-out fade-out-0 zoom-out-95 slide-out-to-left-1/2 slide-out-to-top-[48%] duration-200';
      case 'exited':
      default:
        return '';
    }
  }, [animationState]);

  // Enhanced focus management with initialFocusRef support
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        // Prioritize custom initial focus ref
        if (initialFocusRef?.current) {
          logger.debug(`[DIALOG-FOCUS] Setting focus to initial focus ref for dialog: ${dialogId}`);
          initialFocusRef.current.focus();
        } else if (defaultFocusRef.current) {
          logger.debug(`[DIALOG-FOCUS] Setting focus to default target for dialog: ${dialogId}`);
          defaultFocusRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, initialFocusRef, dialogId]);

  // Calculate hierarchy context
  const hasParent = !!parentId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={ref}
        className={cn(
          maxWidthClass,
          animationClasses,
          className
        )}
        style={maxHeightStyle}
        hideCloseButton={true}
        preventOutsideClose={preventOutsideClose}
        showBackButton={showBackButton}
        onBack={handleBackClick}
        backButtonLabel={backButtonLabel}
        onKeyDown={handleKeyDown}
        {...preventOutsideClose ? { onPointerDownOutside: (e) => e.preventDefault() } : {}}
        {...restProps}
        data-dialog-id={dialogId}
        data-parent-dialog-id={parentId}
        data-has-parent={hasParent}
        data-dialog-level={hasParent ? 'child' : 'root'}
      >
        {/* Default focus target for accessibility - only used if no initialFocusRef provided */}
        {!initialFocusRef && (
          <div 
            ref={defaultFocusRef} 
            tabIndex={-1} 
            className="outline-none sr-only"
            aria-label="Dialog content"
          />
        )}
        
        {title && (
          <AppDialogHeader
            title={title}
            description={description}
            showBackButton={showBackButton}
            onBack={handleBackClick}
            backButtonLabel={backButtonLabel}
            onClose={handleClose}
            hideCloseButton={hideCloseButton}
            dialogId={dialogId}
            parentId={parentId}
            hasParent={hasParent}
          />
        )}
        
        {children}
        
        {footer && (
          <AppDialogFooter>
            {footer}
          </AppDialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

AppDialog.displayName = 'AppDialog';
