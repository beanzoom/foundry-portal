
import React from "react";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useDialogHeader } from "@/components/dialog-library/contexts/DialogHeaderContext";
import { HeaderActions } from "@/components/dialog-library/base/components/HeaderActions";
import { createLogger } from "@/lib/logging";

const logger = createLogger('AppDialogHeader');

export interface AppDialogHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
  hideCloseButton?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  // New hierarchy context props
  dialogId?: string;
  parentId?: string;
  hasParent?: boolean;
}

export const AppDialogHeader = ({
  className,
  title,
  description,
  showBackButton = false,
  onBack,
  backButtonLabel = "Back",
  hideCloseButton = false,
  onClose,
  children,
  dialogId,
  parentId,
  hasParent,
  ...props
}: AppDialogHeaderProps) => {
  const { customActions } = useDialogHeader();

  // Enhanced logging with hierarchy context
  React.useEffect(() => {
    console.log(`[BACK-BUTTON-FIX] AppDialogHeader rendered for ${dialogId}:`, {
      title: typeof title === 'string' ? title : 'React node',
      showBackButton,
      hideCloseButton,
      parentId,
      hasParent: hasParent || !!parentId,
      willDelegateToHeaderActions: true
    });
    logger.debug(`[APP-DIALOG-HEADER-HIERARCHY] Header rendered for ${dialogId}:`, {
      title: typeof title === 'string' ? title : 'React node',
      showBackButton,
      hideCloseButton,
      parentId,
      hasParent: hasParent || !!parentId
    });
  }, [customActions, title, description, dialogId, showBackButton, hideCloseButton, children, parentId, hasParent]);

  // Calculate effective hasParent value
  const effectiveHasParent = hasParent || !!parentId;

  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-left shrink-0 p-6 pb-3 border-b",
        className
      )}
      {...props}
      data-dialog-id={dialogId}
      data-parent-id={parentId}
      data-has-parent={effectiveHasParent}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* REMOVED: Duplicate back button - HeaderActions handles this now */}
          <div className="font-semibold text-lg">{title}</div>
        </div>
        
        {/* Header Actions with hierarchy context - this handles back button */}
        <HeaderActions
          customActions={customActions || []}
          hideCloseButton={hideCloseButton}
          showBackButton={showBackButton}
          onBack={onBack}
          onClose={onClose}
          backButtonLabel={backButtonLabel}
          dialogId={dialogId}
          parentId={parentId}
          hasParent={effectiveHasParent}
        />
        
        {/* Legacy children support */}
        {children}
      </div>
      {description && (
        <div className="text-sm text-muted-foreground">
          {description}
        </div>
      )}
    </div>
  );
};

export const AppDialogTitle = DialogPrimitive.Title;
export const AppDialogDescription = DialogPrimitive.Description;
