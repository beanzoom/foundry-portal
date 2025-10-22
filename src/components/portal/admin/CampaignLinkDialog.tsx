import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Loader2, Copy, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CampaignLink {
  id: string;
  campaign_name: string;
  campaign_code: string;
  landing_url: string;
  direct_url: string;
  notes: string | null;
  created_at: string;
}

interface CampaignLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelName: string;
  campaignName: string;
  setCampaignName: (name: string) => void;
  campaignNotes: string;
  setCampaignNotes: (notes: string) => void;
  generatedCode: string;
  generatedLandingUrl: string;
  generatedDirectUrl: string;
  campaignLinks: CampaignLink[];
  loading: boolean;
  onGenerate: () => void;
  onCopyUrl: (url: string, type: 'landing' | 'direct') => void;
  onDelete: (linkId: string) => void;
}

export function CampaignLinkDialog({
  open,
  onOpenChange,
  funnelName,
  campaignName,
  setCampaignName,
  campaignNotes,
  setCampaignNotes,
  generatedCode,
  generatedLandingUrl,
  generatedDirectUrl,
  campaignLinks,
  loading,
  onGenerate,
  onCopyUrl,
  onDelete
}: CampaignLinkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Campaign Link</DialogTitle>
          <DialogDescription>
            Create trackable URLs for {funnelName}. Each campaign gets a unique code for tracking conversions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Generate New Campaign Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold text-sm">Create New Campaign Link</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Email 5 - DSP Pilot Invitation"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Descriptive name for this campaign
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-notes">Notes (Optional)</Label>
                <Input
                  id="campaign-notes"
                  placeholder="e.g., Sent to DSP owners in CA"
                  value={campaignNotes}
                  onChange={(e) => setCampaignNotes(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Internal notes about this campaign
                </p>
              </div>
            </div>

            <Button
              onClick={onGenerate}
              disabled={loading || !campaignName.trim()}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Campaign Link
            </Button>
          </div>

          {/* Generated URLs (shown after generation) */}
          {generatedCode && (
            <div className="space-y-4 p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-sm text-green-900">Campaign Link Generated!</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Campaign Code</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-3 py-2 bg-white border rounded text-sm font-mono flex-1">
                      {generatedCode}
                    </code>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Landing Page URL</Label>
                  <p className="text-xs text-gray-500 mb-1">Use this link in your emails/posts - users see the landing page first</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-white border rounded text-sm flex-1 break-all">
                      {generatedLandingUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyUrl(generatedLandingUrl, 'landing')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Direct Signup URL</Label>
                  <p className="text-xs text-gray-500 mb-1">Skips landing page, goes straight to signup (use sparingly)</p>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-2 bg-white border rounded text-sm flex-1 break-all">
                      {generatedDirectUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyUrl(generatedDirectUrl, 'direct')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Existing Campaign Links */}
          {campaignLinks.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Existing Campaign Links</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{link.campaign_name}</p>
                            {link.notes && (
                              <p className="text-xs text-gray-500">{link.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                            {link.campaign_code}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {format(new Date(link.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCopyUrl(link.landing_url, 'landing')}
                              title="Copy Landing URL"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Landing
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCopyUrl(link.direct_url, 'direct')}
                              title="Copy Direct URL"
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Direct
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(link.id)}
                              title="Delete Campaign Link"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
