import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InteractionFeed } from './InteractionFeed';
import { User, Building, MapPin, Phone, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/types/contact-tracking';

interface InteractionDialogProps {
  contact: Contact | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InteractionDialog({ contact, open, onClose, onSuccess }: InteractionDialogProps) {
  if (!contact) return null;

  const contactName = contact.first_name || contact.last_name 
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
    : 'Unknown Contact';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Interactions</DialogTitle>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-medium">{contactName}</span>
              {contact.title && (
                <Badge variant="outline">{contact.title}</Badge>
              )}
            </div>
            {contact.dsp?.dsp_name && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building className="w-4 h-4 text-gray-400" />
                <span>{contact.dsp.dsp_name}</span>
                {contact.dsp.dsp_code && (
                  <Badge variant="secondary" className="text-xs">
                    {contact.dsp.dsp_code}
                  </Badge>
                )}
              </div>
            )}
            {contact.station?.station_code && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>Station {contact.station.station_code}</span>
              </div>
            )}
            <div className="flex gap-4 text-sm text-gray-600">
              {contact.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{contact.phone}</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          <InteractionFeed 
            contactId={contact.id} 
            dspId={contact.dsp_id}
            showAddButton={true}
            limit={50}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}