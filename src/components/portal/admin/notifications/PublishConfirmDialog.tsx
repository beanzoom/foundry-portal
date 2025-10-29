import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Users,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  X
} from 'lucide-react';
import {
  emailQueueService,
  RecipientInfo,
  ProcessQueueResult
} from '@/services/email-queue.service';
import { createLogger } from '@/lib/logging';

const logger = createLogger('PublishConfirmDialog');

export type ContentType = 'update' | 'survey' | 'event';

interface PublishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
  templateName?: string;
  recipientListName?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function PublishConfirmDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  templateName,
  recipientListName,
  onConfirm,
  onCancel
}: PublishConfirmDialogProps) {
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<RecipientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [publishResult, setPublishResult] = useState<'success' | 'error' | null>(null);
  const [emailResult, setEmailResult] = useState<ProcessQueueResult | null>(null);
  const [showAll, setShowAll] = useState(false);

  const eventTypeMap: Record<ContentType, string> = {
    update: 'update_published',
    survey: 'survey_published',
    event: 'event_published'
  };

  // Load recipients when dialog opens
  useEffect(() => {
    if (open && contentId) {
      loadRecipients();
    } else {
      // Reset state when dialog closes
      setRecipients([]);
      setFilteredRecipients([]);
      setSearchTerm('');
      setPublishResult(null);
      setEmailResult(null);
      setShowAll(false);
    }
  }, [open, contentId]);

  // Filter recipients based on search
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecipients(recipients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = recipients.filter(r =>
      r.fullName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.role && r.role.toLowerCase().includes(term))
    );
    setFilteredRecipients(filtered);
  }, [searchTerm, recipients]);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      const eventType = eventTypeMap[contentType] as any;
      const recipientList = await emailQueueService.getEventRecipients(contentId, eventType);
      setRecipients(recipientList);
      setFilteredRecipients(recipientList);
      logger.info(`Loaded ${recipientList.length} recipients`);
    } catch (error) {
      logger.error('Error loading recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishAndSend = async () => {
    setPublishing(true);
    setPublishResult(null);
    setEmailResult(null);

    try {
      // Step 1: Publish the content
      logger.info('Publishing content...');
      await onConfirm();
      setPublishResult('success');
      logger.info('Content published successfully');

      // Wait a moment for the database trigger to process emails
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Check how many emails were sent for this event
      logger.info('Checking email stats...');
      setSendingEmails(true);
      const eventType = eventTypeMap[contentType];
      const result = await emailQueueService.getEventEmailStats(contentId, eventType);
      setEmailResult(result);

      if (result.success) {
        logger.info('Emails sent successfully', result);
      } else {
        logger.error('Email checking failed', result);
      }

    } catch (error) {
      logger.error('Error in publish process:', error);
      setPublishResult('error');
    } finally {
      setPublishing(false);
      setSendingEmails(false);
    }
  };

  const handlePublishWithoutSending = async () => {
    setPublishing(true);
    setPublishResult(null);

    try {
      await onConfirm();
      setPublishResult('success');
      logger.info('Content published (emails queued for later)');

      // Close dialog after brief delay
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      logger.error('Error publishing:', error);
      setPublishResult('error');
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    if (publishing || sendingEmails) {
      return; // Don't allow closing while operations are in progress
    }
    onCancel();
    onOpenChange(false);
  };

  const displayRecipients = showAll ? filteredRecipients : filteredRecipients.slice(0, 20);
  const hasMore = filteredRecipients.length > 20;

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'update': return 'Update';
      case 'survey': return 'Survey';
      case 'event': return 'Event';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Publish {getContentTypeLabel()}: {contentTitle}
          </DialogTitle>
          <DialogDescription>
            Review recipients and send email notifications
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Summary Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Email Template</div>
              <div className="text-sm font-semibold">{templateName || 'Default Template'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Recipient List</div>
              <div className="text-sm font-semibold">{recipientListName || 'Unknown'}</div>
            </div>
          </div>

          {/* Recipients Section */}
          <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Recipients ({filteredRecipients.length})
                </span>
              </div>
              {recipients.length > 0 && (
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading recipients...</span>
              </div>
            ) : recipients.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No recipients found. Please check your notification rules and recipient lists.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <ScrollArea className="flex-1 border rounded-md p-2">
                  <div className="space-y-1">
                    {displayRecipients.map((recipient, index) => (
                      <div
                        key={`${recipient.email}-${index}`}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{recipient.fullName}</div>
                          <div className="text-xs text-muted-foreground">{recipient.email}</div>
                        </div>
                        {recipient.role && (
                          <Badge variant="outline" className="text-xs">
                            {recipient.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {hasMore && !showAll && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="w-full"
                  >
                    Show all {filteredRecipients.length} recipients
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Status Messages */}
          {publishResult === 'success' && !emailResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {getContentTypeLabel()} published successfully!
              </AlertDescription>
            </Alert>
          )}

          {emailResult && (
            <Alert className={emailResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {emailResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={emailResult.success ? 'text-green-800' : 'text-red-800'}>
                {emailResult.success ? (
                  <>
                    Sent {emailResult.sent} email{emailResult.sent !== 1 ? 's' : ''} successfully!
                    {emailResult.failed > 0 && ` (${emailResult.failed} failed)`}
                  </>
                ) : (
                  <>Failed to send emails: {emailResult.message}</>
                )}
              </AlertDescription>
            </Alert>
          )}

          {publishResult === 'error' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to publish {getContentTypeLabel().toLowerCase()}. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {sendingEmails && (
            <Alert className="border-blue-200 bg-blue-50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                Sending emails to {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}...
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={publishing || sendingEmails}
          >
            {publishResult === 'success' && emailResult ? 'Close' : 'Cancel'}
          </Button>

          {!publishResult && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePublishWithoutSending}
                disabled={publishing || sendingEmails || recipients.length === 0}
              >
                {publishing && !sendingEmails ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Publish Without Sending
              </Button>
              <Button
                onClick={handlePublishAndSend}
                disabled={publishing || sendingEmails || recipients.length === 0}
              >
                {publishing || sendingEmails ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {sendingEmails ? 'Sending...' : 'Publish & Send Now'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
