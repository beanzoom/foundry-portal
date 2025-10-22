
export interface AppDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode; // Changed from string to ReactNode
  description?: React.ReactNode; // Changed from string to ReactNode
  footer?: React.ReactNode; // Added missing footer prop
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full' | string; // Added string fallback
  maxHeight?: string;
  hideCloseButton?: boolean;
  preventOutsideClose?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
  closeOnEscape?: boolean;
  dialogId?: string;
  parentId?: string;
  animationState?: 'entering' | 'entered' | 'exiting' | 'exited';
  initialFocusRef?: React.RefObject<HTMLElement>;
}
