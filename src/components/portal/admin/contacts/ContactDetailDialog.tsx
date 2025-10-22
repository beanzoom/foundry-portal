import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import type { Contact } from '@/types/contact-tracking';

interface ContactDetailDialogProps {
  contact: Contact;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ContactDetailDialog({ contact, open, onClose, onEdit }: ContactDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Contact Details</span>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <h3 className="font-medium mb-2">
            {contact.first_name} {contact.last_name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {contact.email} • {contact.phone}
          </p>
          <p className="text-muted-foreground">
            Contact detail view with interactions will be implemented here
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}