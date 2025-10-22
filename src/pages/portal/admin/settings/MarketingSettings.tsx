import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Copy,
  ExternalLink,
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  Edit,
  Play,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CampaignLinkDialog } from '@/components/portal/admin/CampaignLinkDialog';
import { FunnelAnalyticsDialog } from '@/components/portal/admin/FunnelAnalyticsDialog';

// Default production domains - used when environment variables are not set
const DEFAULT_PORTAL_DOMAIN = 'https://portal.fleetdrms.com';
const DEFAULT_BASE_DOMAIN = 'fleetdrms.com';

interface MarketingFunnel {
  id: string;
  referral_code: string;
  referral_source: string;
  source_metadata: {
    source_name?: string;
    campaign?: string;
    [key: string]: any;
  };
  usage_count: number;
  max_uses: number | null;
  expires_at: string | null;
  status: string;
  created_at: string;
  total_conversions: number;
  conversions_last_30_days: number;
  conversions_last_7_days: number;
  last_conversion_at: string | null;
}

interface CampaignLink {
  id: string;
  funnel_id: string;
  campaign_name: string;
  campaign_code: string;
  landing_url: string;
  direct_url: string;
  notes: string | null;
  created_at: string;
}

interface CampaignAnalytics {
  campaign_code: string;
  campaign_name: string;
  total_conversions: number;
  last_30_days: number;
  last_7_days: number;
  conversion_rate: number;
  last_conversion_at: string | null;
}

export function MarketingSettings() {
  const { toast } = useToast();
  const [funnels, setFunnels] = useState<MarketingFunnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [creatingFunnel, setCreatingFunnel] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState<MarketingFunnel | null>(null);
  const [selectedFunnel, setSelectedFunnel] = useState<MarketingFunnel | null>(null);
  const [campaignLinks, setCampaignLinks] = useState<CampaignLink[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<CampaignAnalytics[]>([]);

  // Form state
  const [sourceName, setSourceName] = useState('');
  const [sourceCode, setSourceCode] = useState('');
  const [campaign, setCampaign] = useState('');
  const [maxUses, setMaxUses] = useState<string>('');
  const [additionalMetadata, setAdditionalMetadata] = useState('');

  // Campaign link form state
  const [campaignName, setCampaignName] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');
  const [generatedCampaignCode, setGeneratedCampaignCode] = useState('');
  const [generatedLandingUrl, setGeneratedLandingUrl] = useState('');
  const [generatedDirectUrl, setGeneratedDirectUrl] = useState('');

  useEffect(() => {
    loadFunnels();
  }, []);

  const loadFunnels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('marketing_funnel_summary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFunnels(data || []);
    } catch (error) {
      console.error('Error loading marketing funnels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketing funnels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFunnel = async () => {
    if (!sourceName.trim() || !sourceCode.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Source name and code are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreatingFunnel(true);

      // Parse additional metadata if provided
      let metadata = { campaign: campaign || undefined };
      if (additionalMetadata.trim()) {
        try {
          const parsed = JSON.parse(additionalMetadata);
          metadata = { ...metadata, ...parsed };
        } catch (e) {
          toast({
            title: 'Invalid JSON',
            description: 'Additional metadata must be valid JSON',
            variant: 'destructive'
          });
          return;
        }
      }

      // Call the RPC function to create marketing funnel
      const { data, error } = await supabase.rpc('create_marketing_funnel', {
        p_source: sourceCode.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        p_source_name: sourceName,
        p_metadata: metadata,
        p_max_uses: maxUses ? parseInt(maxUses) : null,
        p_expires_at: null
      });

      if (error) throw error;

      toast({
        title: 'Funnel Created',
        description: `Marketing funnel "${sourceName}" created successfully`,
      });

      // Reset form and close dialog
      setSourceName('');
      setSourceCode('');
      setCampaign('');
      setMaxUses('');
      setAdditionalMetadata('');
      setShowCreateDialog(false);

      // Reload funnels
      loadFunnels();
    } catch (error: any) {
      console.error('Error creating funnel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create marketing funnel',
        variant: 'destructive'
      });
    } finally {
      setCreatingFunnel(false);
    }
  };

  const copyReferralUrl = (code: string) => {
    // ALWAYS use production URL for marketing/email links
    // These URLs are meant to be shared externally, never localhost
    const url = `${import.meta.env.VITE_PRODUCTION_PORTAL_DOMAIN || DEFAULT_PORTAL_DOMAIN}/auth?ref=${code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Production referral URL copied to clipboard'
    });
  };

  const copyReferralCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Referral code copied to clipboard'
    });
  };

  const handleEditFunnel = (funnel: MarketingFunnel) => {
    setEditingFunnel(funnel);
    setSourceName(funnel.source_metadata?.source_name || funnel.referral_source);
    setCampaign(funnel.source_metadata?.campaign || '');
    setMaxUses(funnel.max_uses ? funnel.max_uses.toString() : '');

    // Extract additional metadata (excluding source_name and campaign)
    const { source_name, campaign: _campaign, ...rest } = funnel.source_metadata || {};
    setAdditionalMetadata(Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : '');

    setShowEditDialog(true);
  };

  const handleUpdateFunnel = async () => {
    if (!editingFunnel || !sourceName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Source name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreatingFunnel(true);

      // Parse additional metadata if provided
      let metadata = {
        source_name: sourceName,
        campaign: campaign || undefined
      };
      if (additionalMetadata.trim()) {
        try {
          const parsed = JSON.parse(additionalMetadata);
          metadata = { ...metadata, ...parsed };
        } catch (e) {
          toast({
            title: 'Invalid JSON',
            description: 'Additional metadata must be valid JSON',
            variant: 'destructive'
          });
          return;
        }
      }

      const { error } = await supabase
        .from('portal_referrals')
        .update({
          source_metadata: metadata,
          max_uses: maxUses ? parseInt(maxUses) : null
        })
        .eq('id', editingFunnel.id);

      if (error) throw error;

      toast({
        title: 'Funnel Updated',
        description: `Marketing funnel "${sourceName}" updated successfully`,
      });

      // Reset form and close dialog
      setSourceName('');
      setSourceCode('');
      setCampaign('');
      setMaxUses('');
      setAdditionalMetadata('');
      setEditingFunnel(null);
      setShowEditDialog(false);

      // Reload funnels
      loadFunnels();
    } catch (error: any) {
      console.error('Error updating funnel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update marketing funnel',
        variant: 'destructive'
      });
    } finally {
      setCreatingFunnel(false);
    }
  };

  const handlePublishFunnel = async (funnelId: string) => {
    try {
      const { error } = await supabase
        .from('portal_referrals')
        .update({ status: 'sent' })
        .eq('id', funnelId);

      if (error) throw error;

      toast({
        title: 'Funnel Published',
        description: 'Marketing funnel is now active and ready to use',
      });

      loadFunnels();
    } catch (error: any) {
      console.error('Error publishing funnel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish marketing funnel',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateCampaignLink = async (funnel: MarketingFunnel) => {
    setSelectedFunnel(funnel);
    setCampaignName('');
    setCampaignNotes('');
    setGeneratedCampaignCode('');
    setGeneratedLandingUrl('');
    setGeneratedDirectUrl('');

    // Load existing campaign links for this funnel
    try {
      const { data, error } = await supabase
        .from('marketing_campaign_links')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaignLinks(data || []);
    } catch (error) {
      console.error('Error loading campaign links:', error);
    }

    setShowCampaignDialog(true);
  };

  const handleCreateCampaignLink = async () => {
    if (!selectedFunnel || !campaignName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Campaign name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreatingFunnel(true);

      const { data, error } = await supabase.rpc('create_campaign_link', {
        p_funnel_id: selectedFunnel.id,
        p_campaign_name: campaignName,
        p_campaign_code: null, // Let the function auto-generate
        p_notes: campaignNotes || null
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const link = data[0];

        // ALWAYS build production URLs for marketing campaigns
        // These are meant to be shared in emails/social media, never localhost
        const baseDomain = import.meta.env.VITE_PRODUCTION_BASE_DOMAIN || DEFAULT_BASE_DOMAIN;
        const landingDomain = `https://${selectedFunnel.referral_source}.${baseDomain}`;
        const portalDomain = import.meta.env.VITE_PRODUCTION_PORTAL_DOMAIN || DEFAULT_PORTAL_DOMAIN;

        // Use new return column names: link_campaign_code, link_landing_url, link_direct_url
        const campaignCode = link.link_campaign_code || link.campaign_code; // Fallback for compatibility
        const landingUrl = `${landingDomain}?campaign=${campaignCode}`;
        const directUrl = `${portalDomain}/auth?ref=${selectedFunnel.referral_code}&campaign=${campaignCode}`;

        setGeneratedCampaignCode(campaignCode);
        setGeneratedLandingUrl(landingUrl);
        setGeneratedDirectUrl(directUrl);

        toast({
          title: 'Campaign Link Created',
          description: `Campaign "${campaignName}" created successfully`,
        });

        // Reload campaign links
        const { data: updatedLinks } = await supabase
          .from('marketing_campaign_links')
          .select('*')
          .eq('funnel_id', selectedFunnel.id)
          .order('created_at', { ascending: false });

        setCampaignLinks(updatedLinks || []);
      }
    } catch (error: any) {
      console.error('Error creating campaign link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign link',
        variant: 'destructive'
      });
    } finally {
      setCreatingFunnel(false);
    }
  };

  const handleDeleteCampaignLink = async (linkId: string) => {
    try {
      const { error } = await supabase.rpc('delete_campaign_link', {
        p_link_id: linkId
      });

      if (error) throw error;

      toast({
        title: 'Campaign Link Deleted',
        description: 'Campaign link has been removed',
      });

      // Reload campaign links
      if (selectedFunnel) {
        const { data } = await supabase
          .from('marketing_campaign_links')
          .select('*')
          .eq('funnel_id', selectedFunnel.id)
          .order('created_at', { ascending: false });

        setCampaignLinks(data || []);
      }
    } catch (error: any) {
      console.error('Error deleting campaign link:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete campaign link',
        variant: 'destructive'
      });
    }
  };

  const handleViewAnalytics = async (funnel: MarketingFunnel) => {
    setSelectedFunnel(funnel);

    try {
      setLoading(true);

      // Load campaign analytics
      const { data, error } = await supabase.rpc('get_funnel_campaign_analytics', {
        p_funnel_id: funnel.id
      });

      if (error) throw error;
      setCampaignAnalytics(data || []);

      // Load campaign links
      const { data: links } = await supabase
        .from('marketing_campaign_links')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('created_at', { ascending: false});

      setCampaignLinks(links || []);
      setShowAnalyticsDialog(true);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCampaignUrl = (url: string, type: 'landing' | 'direct') => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: `${type === 'landing' ? 'Landing page' : 'Direct signup'} URL copied to clipboard`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Funnels</h2>
          <p className="text-gray-600 mt-1">
            Manage reusable referral codes for landing pages and marketing campaigns
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Funnel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Funnels</p>
                <p className="text-2xl font-bold">{funnels.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {funnels.reduce((sum, f) => sum + f.total_conversions, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 30 Days</p>
                <p className="text-2xl font-bold">
                  {funnels.reduce((sum, f) => sum + f.conversions_last_30_days, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Last 7 Days</p>
                <p className="text-2xl font-bold">
                  {funnels.reduce((sum, f) => sum + f.conversions_last_7_days, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Funnels</CardTitle>
          <CardDescription>
            View and manage your marketing referral codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {funnels.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No marketing funnels created yet</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Funnel
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-center">Conversions</TableHead>
                  <TableHead className="text-center">Last 30d</TableHead>
                  <TableHead className="text-center">Last 7d</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnels.map((funnel) => (
                  <TableRow key={funnel.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {funnel.source_metadata?.source_name || funnel.referral_source}
                        </p>
                        {funnel.source_metadata?.campaign && (
                          <p className="text-sm text-gray-500">
                            {funnel.source_metadata.campaign}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {funnel.referral_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyReferralCode(funnel.referral_code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{funnel.total_conversions}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      {funnel.conversions_last_30_days}
                    </TableCell>
                    <TableCell className="text-center">
                      {funnel.conversions_last_7_days}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={funnel.status === 'pending' ? 'secondary' : 'default'}
                      >
                        {funnel.status === 'pending' ? 'Draft' : funnel.status === 'sent' ? 'Active' : funnel.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(funnel.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleGenerateCampaignLink(funnel)}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Generate Campaign Link
                          </DropdownMenuItem>
                          {funnel.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleEditFunnel(funnel)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Funnel
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handlePublishFunnel(funnel.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Publish Funnel
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => copyReferralUrl(funnel.referral_code)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyReferralCode(funnel.referral_code)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewAnalytics(funnel)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Funnel Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Marketing Funnel</DialogTitle>
            <DialogDescription>
              Generate a new reusable referral code for a landing page or campaign. The funnel will be created as a draft.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source-name">
                  Source Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="source-name"
                  placeholder="e.g., Foundry Landing Page"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Display name shown in reports and analytics (e.g., "Foundry Landing Page", "LinkedIn Campaign")
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source-code">
                  Source Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="source-code"
                  placeholder="e.g., foundry"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Internal identifier used in the referral code (e.g., "foundry" generates "FOUNDR1234")
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign (Optional)</Label>
                <Input
                  id="campaign"
                  placeholder="e.g., Q1 2025 Pilot"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Campaign name for organizing multiple funnels (e.g., "Q1 2025 Pilot", "Investor Demo")
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-uses">Max Uses (Optional)</Label>
                <Input
                  id="max-uses"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of signups allowed (leave empty for unlimited)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metadata">Additional Metadata (Optional)</Label>
              <Textarea
                id="metadata"
                placeholder='{"utm_source": "linkedin", "target_audience": "dsp-owners"}'
                value={additionalMetadata}
                onChange={(e) => setAdditionalMetadata(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Custom tracking data in JSON format (e.g., UTM parameters, audience targeting)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creatingFunnel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFunnel}
              disabled={creatingFunnel || !sourceName.trim() || !sourceCode.trim()}
            >
              {creatingFunnel && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Funnel Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Marketing Funnel</DialogTitle>
            <DialogDescription>
              Update funnel details. Note: The referral code cannot be changed once created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-source-name">
                Source Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-source-name"
                placeholder="e.g., Foundry Landing Page"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Display name shown in reports and analytics
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-campaign">Campaign (Optional)</Label>
                <Input
                  id="edit-campaign"
                  placeholder="e.g., Q1 2025 Pilot"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Campaign name for organizing funnels
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-max-uses">Max Uses (Optional)</Label>
                <Input
                  id="edit-max-uses"
                  type="number"
                  placeholder="Unlimited"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Maximum signups allowed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-metadata">Additional Metadata (Optional)</Label>
              <Textarea
                id="edit-metadata"
                placeholder='{"utm_source": "linkedin", "target_audience": "dsp-owners"}'
                value={additionalMetadata}
                onChange={(e) => setAdditionalMetadata(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Custom tracking data in JSON format
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingFunnel(null);
                setSourceName('');
                setSourceCode('');
                setCampaign('');
                setMaxUses('');
                setAdditionalMetadata('');
              }}
              disabled={creatingFunnel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFunnel}
              disabled={creatingFunnel || !sourceName.trim()}
            >
              {creatingFunnel && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Funnel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Link Generator Dialog */}
      <CampaignLinkDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        funnelName={selectedFunnel?.source_metadata?.source_name || selectedFunnel?.referral_source || ''}
        campaignName={campaignName}
        setCampaignName={setCampaignName}
        campaignNotes={campaignNotes}
        setCampaignNotes={setCampaignNotes}
        generatedCode={generatedCampaignCode}
        generatedLandingUrl={generatedLandingUrl}
        generatedDirectUrl={generatedDirectUrl}
        campaignLinks={campaignLinks}
        loading={creatingFunnel}
        onGenerate={handleCreateCampaignLink}
        onCopyUrl={copyCampaignUrl}
        onDelete={handleDeleteCampaignLink}
      />

      {/* Analytics Dialog */}
      <FunnelAnalyticsDialog
        open={showAnalyticsDialog}
        onOpenChange={setShowAnalyticsDialog}
        funnel={selectedFunnel}
        analytics={campaignAnalytics}
      />
    </div>
  );
}
