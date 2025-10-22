
export { AppDialog } from './AppDialog';
export { AppDialogHeader, AppDialogTitle, AppDialogDescription } from './AppDialogHeader';
export { AppDialogBody, AppDialogContent } from './AppDialogBody';
export { AppDialogFooter } from './AppDialogFooter';
export type { AppDialogProps } from './types';

// Export DialogProvider and hooks for easy access
export { DialogProvider } from '@/components/dialog-library/base/DialogProvider';
export { useDialogContext } from '@/components/dialog-library/hooks/useDialogContext';
export { useDialog } from '@/components/dialog-library/hooks/useDialog';
export { useDialogSystem } from '@/components/dialog-library/hooks/useDialogSystem';
