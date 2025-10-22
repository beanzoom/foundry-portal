import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { triggerPublishNotification } from '@/services/portal-notifications.service';
import { createLogger } from '@/lib/logging';
import { adminRoute } from '@/lib/portal/navigation';
import { PublishConfirmDialog } from '@/components/portal/admin/notifications/PublishConfirmDialog';

const logger = createLogger('PortalAdminUpdates');
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit2,
  Eye,
  Archive,
  Send,
  AlertTriangle,
  Info,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  FileText,
  RefreshCw,
  Trash2,
  RotateCcw,
  Mail,
  MoreVertical,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useAdminPortalUpdates, useCreateUpdate, useUpdateUpdate, usePublishUpdate, useDeleteUpdate, useArchiveUpdate, useUpdateAnalytics } from '@/hooks/usePortalUpdates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ForceDeleteUpdateDialog } from '@/components/portal/admin/ForceDeleteUpdateDialog';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function PortalAdminUpdates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [isComposing, setIsComposing] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [forceDeleteUpdate, setForceDeleteUpdate] = useState<any>(null);
  const [unarchiveConfirm, setUnarchiveConfirm] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [updateToPublish, setUpdateToPublish] = useState<any>(null);
  const [recipientListName, setRecipientListName] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');

  // Form state for new update
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    content: '',
    update_type: 'advisory' as 'advisory' | 'compulsory',
    target_audience: 'all' as 'all' | 'investors',
    priority: 0
  });

  // Form state for editing
  const [editUpdate, setEditUpdate] = useState({
    id: '',
    title: '',
    content: '',
    update_type: 'advisory' as 'advisory' | 'compulsory',
    target_audience: 'all' as 'all' | 'investors',
    priority: 0
  });

  // Fetch ALL updates for admin view (includes drafts, published, archived)
  const { data: updates = [], isLoading, refetch } = useAdminPortalUpdates();
  
  // Mutations
  const createUpdate = useCreateUpdate();
  const updateUpdate = useUpdateUpdate();
  const publishUpdate = usePublishUpdate();
  const deleteUpdate = useDeleteUpdate();
  const archiveUpdate = useArchiveUpdate();

  // Filter updates for display
  const displayUpdates = updates.filter(update => {
    if (activeTab === 'draft') return update.status === 'draft';
    if (activeTab === 'published') return update.status === 'published';
    if (activeTab === 'archived') return update.status === 'archived';
    return true;
  });

  const handleCreateDraft = async () => {
    if (!newUpdate.title || !newUpdate.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }


    try {
      const result = await createUpdate.mutateAsync({
        ...newUpdate,
        created_by: user?.id,
        status: 'draft'
      });
      
      
      toast({
        title: "Success",
        description: "Draft created successfully"
      });
      
      setIsComposing(false);
      setNewUpdate({
        title: '',
        content: '',
        update_type: 'advisory',
        target_audience: 'all',
        priority: 0
      });
      refetch();
    } catch (error) {
      logger.error('Failed to create draft:', error);
      toast({
        title: "Error",
        description: `Failed to create draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handlePublish = async (updateId: string) => {
    try {
      logger.debug('Opening publish dialog for update:', updateId);

      // Find the update to get its details
      const update = updates.find(u => u.id === updateId);
      if (!update) {
        throw new Error('Update not found');
      }

      // Get the notification rule and template info
      const { data: notificationRule, error: ruleError } = await supabase
        .from('notification_rules')
        .select('recipient_list_id, template_id')
        .eq('event_id', 'update_published')
        .eq('enabled', true)
        .single();

      if (!ruleError && notificationRule) {
        // Get recipient list name
        const { data: recipientList } = await supabase
          .from('recipient_lists')
          .select('name')
          .eq('id', notificationRule.recipient_list_id)
          .single();

        // Get template name
        const { data: template } = await supabase
          .from('email_templates')
          .select('name')
          .eq('id', notificationRule.template_id)
          .single();

        setRecipientListName(recipientList?.name || 'Unknown');
        setTemplateName(template?.name || 'Unknown');
      }

      setUpdateToPublish(update);
      setPublishDialogOpen(true);

    } catch (error) {
      logger.error('Error opening publish dialog:', error);
      toast({
        title: "Error",
        description: "Failed to prepare publish dialog",
        variant: "destructive"
      });
    }
  };

  const handleConfirmPublish = async () => {
    if (!updateToPublish) return;

    try {
      logger.debug('Publishing update:', updateToPublish.id);
      await publishUpdate.mutateAsync(updateToPublish.id);
      logger.info('Update published successfully');

      refetch();
    } catch (error) {
      logger.error('Error publishing update:', error);
      toast({
        title: "Error",
        description: `Failed to publish update: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      throw error; // Re-throw so dialog can handle it
    }
  };

  const handleCancelPublish = () => {
    setPublishDialogOpen(false);
    setUpdateToPublish(null);
    setRecipientListName('');
    setTemplateName('');
  };

  const handleEdit = (update: any) => {
    setEditUpdate({
      id: update.id,
      title: update.title,
      content: update.content,
      update_type: update.update_type,
      target_audience: update.target_audience,
      priority: update.priority
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editUpdate.title || !editUpdate.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUpdate.mutateAsync({
        id: editUpdate.id,
        title: editUpdate.title,
        content: editUpdate.content,
        update_type: editUpdate.update_type,
        target_audience: editUpdate.target_audience,
        priority: editUpdate.priority
      });
      
      toast({
        title: "Success",
        description: "Draft updated successfully"
      });
      
      setIsEditing(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update draft",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (updateId: string) => {
    try {
      await deleteUpdate.mutateAsync(updateId);
      toast({
        title: "Success",
        description: "Draft deleted successfully"
      });
      setDeleteConfirm(null);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (updateId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('archive_update', {
          p_update_id: updateId,
          p_admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Update archived successfully"
      });
      setArchiveConfirm(null);
      refetch();
    } catch (error) {
      logger.error('Archive error:', error);
      toast({
        title: "Error",
        description: "Failed to archive update",
        variant: "destructive"
      });
    }
  };

  const handleUnpublish = async (updateId: string) => {
    try {
      // Update the status back to draft and clear published_at
      const { error } = await supabase
        .from('portal_updates')
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', updateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Update unpublished successfully. You can now republish to trigger emails again."
      });
      refetch();
    } catch (error) {
      logger.error('Unpublish error:', error);
      toast({
        title: "Error",
        description: "Failed to unpublish update",
        variant: "destructive"
      });
    }
  };

  const handleUnarchive = async (updateId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('unarchive_update', {
          p_update_id: updateId,
          p_admin_id: user?.id,
          p_new_status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Update restored to drafts"
      });
      setUnarchiveConfirm(null);
      refetch();
    } catch (error) {
      logger.error('Unarchive error:', error);
      toast({
        title: "Error",
        description: "Failed to restore update",
        variant: "destructive"
      });
    }
  };

  const handleForceDelete = async (updateId: string, confirmTitle: string) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_update_force', {
          p_update_id: updateId,
          p_confirm_title: confirmTitle,
          p_admin_id: user?.id
        });

      if (error) throw error;
      
      // Check if the function actually succeeded
      if (data && !data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      toast({
        title: "Success",
        description: `Update "${confirmTitle}" permanently deleted`
      });
      setForceDeleteUpdate(null);
      
      // Invalidate the query cache to force a fresh fetch
      await queryClient.invalidateQueries({ queryKey: ['portal-updates'] });
      refetch();
    } catch (error: any) {
      logger.error('Force delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete update",
        variant: "destructive"
      });
    }
  };

  const getUpdateIcon = (type: string) => {
    return type === 'compulsory' ? 
      <AlertTriangle className="h-4 w-4 text-red-500" /> : 
      <Info className="h-4 w-4 text-blue-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'outline', label: 'Draft' },
      published: { variant: 'default', label: 'Published' },
      archived: { variant: 'secondary', label: 'Archived' }
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portal Updates Management</h2>
          <p className="text-gray-600 mt-1">Create and manage announcements for portal users</p>
        </div>
        <div className="flex gap-2">
          <Link to={adminRoute('settings/email/processing')}>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Email Processing
            </Button>
          </Link>
          <Button
            onClick={() => setIsComposing(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Update
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{updates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {updates.filter(u => u.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {updates.filter(u => u.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Compulsory Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {updates.filter(u => u.status === 'published' && u.update_type === 'compulsory').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Updates Table */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : displayUpdates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No updates found
                  </TableCell>
                </TableRow>
              ) : (
                displayUpdates.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell>{getUpdateIcon(update.update_type)}</TableCell>
                    <TableCell className="font-medium">{update.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {update.target_audience === 'investors' ? 'Investors' : 'All Users'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(update.status)}</TableCell>
                    <TableCell>
                      {update.published_at ? 
                        format(new Date(update.published_at), 'MMM d, yyyy') : 
                        '-'
                      }
                    </TableCell>
                    <TableCell>{update.view_count || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{update.acknowledgment_count || 0}</span>
                        {update.email_batch_id && (
                          <Badge variant="outline" className="text-xs">
                            <Mail className="h-3 w-3 mr-1" />
                            {update.email_sent_at ? 'Sent' : 'Pending'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View/Preview - Always available */}
                          <DropdownMenuItem onClick={() => setSelectedUpdate(update)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {/* Draft actions */}
                          {update.status === 'draft' && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(update)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePublish(update.id)}
                                className="text-green-600"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteConfirm(update.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Published actions */}
                          {update.status === 'published' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedUpdate(update);
                                setShowAnalytics(true);
                              }}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUnpublish(update.id)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setArchiveConfirm(update.id)}>
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Archived actions */}
                          {update.status === 'archived' && (
                            <>
                              <DropdownMenuItem onClick={() => setUnarchiveConfirm(update.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Restore to Drafts
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setForceDeleteUpdate(update)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compose Dialog */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Update</DialogTitle>
            <DialogDescription>
              Create a new announcement for portal users. Published updates cannot be edited.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newUpdate.title}
                onChange={(e) => {
                  setNewUpdate({ ...newUpdate, title: e.target.value });
                }}
                placeholder="Enter update title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Update Type *</Label>
                <Select
                  value={newUpdate.update_type}
                  onValueChange={(value: 'advisory' | 'compulsory') => 
                    setNewUpdate({ ...newUpdate, update_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advisory">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Advisory
                      </div>
                    </SelectItem>
                    <SelectItem value="compulsory">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Compulsory
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {newUpdate.update_type === 'compulsory' && (
                  <p className="text-xs text-red-600">
                    Users must acknowledge before accessing portal
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience *</Label>
                <Select
                  value={newUpdate.target_audience}
                  onValueChange={(value: 'all' | 'investors') => 
                    setNewUpdate({ ...newUpdate, target_audience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="investors">Investors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                value={newUpdate.content}
                onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                placeholder="Enter update content (HTML supported)"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Basic HTML is supported for formatting
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority (0-100)</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                max="100"
                value={newUpdate.priority}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewUpdate({ ...newUpdate, priority: value === '' ? 0 : parseInt(value) });
                }}
                onFocus={(e) => e.target.select()}
              />
              <p className="text-xs text-gray-500">
                Higher priority updates appear first
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposing(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateDraft}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={createUpdate.isPending}
            >
              {createUpdate.isPending ? 'Creating...' : 'Create Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Draft Update</DialogTitle>
            <DialogDescription>
              Make changes to your draft. You can still edit until it's published.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editUpdate.title}
                onChange={(e) => setEditUpdate({ ...editUpdate, title: e.target.value })}
                placeholder="Enter update title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Update Type *</Label>
                <Select
                  value={editUpdate.update_type}
                  onValueChange={(value: 'advisory' | 'compulsory') => 
                    setEditUpdate({ ...editUpdate, update_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advisory">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        Advisory
                      </div>
                    </SelectItem>
                    <SelectItem value="compulsory">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Compulsory
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-audience">Target Audience *</Label>
                <Select
                  value={editUpdate.target_audience}
                  onValueChange={(value: 'all' | 'investors') => 
                    setEditUpdate({ ...editUpdate, target_audience: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="investors">Investors Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">Content *</Label>
              <Textarea
                id="edit-content"
                value={editUpdate.content}
                onChange={(e) => setEditUpdate({ ...editUpdate, content: e.target.value })}
                placeholder="Enter update content (HTML supported)"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Basic HTML is supported for formatting
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority (0-100)</Label>
              <Input
                id="edit-priority"
                type="number"
                min="0"
                max="100"
                value={editUpdate.priority}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditUpdate({ ...editUpdate, priority: value === '' ? 0 : parseInt(value) });
                }}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={updateUpdate.isPending}
            >
              {updateUpdate.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={!!archiveConfirm} onOpenChange={() => setArchiveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Published Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this update? Archived updates will no longer be visible to users but can be viewed in the archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveConfirm && handleArchive(archiveConfirm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unarchive Confirmation Dialog */}
      <AlertDialog open={!!unarchiveConfirm} onOpenChange={() => setUnarchiveConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Archived Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this update? It will be moved back to drafts where you can edit and republish it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unarchiveConfirm && handleUnarchive(unarchiveConfirm)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Restore to Drafts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Delete Dialog */}
      <ForceDeleteUpdateDialog
        update={forceDeleteUpdate}
        open={!!forceDeleteUpdate}
        onConfirm={handleForceDelete}
        onCancel={() => setForceDeleteUpdate(null)}
      />

      {/* View/Analytics Dialog */}
      {selectedUpdate && (
        <UpdateDetailsDialog
          update={selectedUpdate}
          isOpen={!!selectedUpdate}
          onClose={() => {
            setSelectedUpdate(null);
            setShowAnalytics(false);
          }}
          showAnalytics={showAnalytics}
        />
      )}

      {/* Publish Confirm Dialog with Email Preview */}
      {updateToPublish && (
        <PublishConfirmDialog
          open={publishDialogOpen}
          onOpenChange={setPublishDialogOpen}
          contentType="update"
          contentId={updateToPublish.id}
          contentTitle={updateToPublish.title}
          templateName={templateName}
          recipientListName={recipientListName}
          onConfirm={handleConfirmPublish}
          onCancel={handleCancelPublish}
        />
      )}
    </div>
  );
}

// Update Details Dialog Component
function UpdateDetailsDialog({ 
  update, 
  isOpen, 
  onClose, 
  showAnalytics 
}: { 
  update: any; 
  isOpen: boolean; 
  onClose: () => void;
  showAnalytics?: boolean;
}) {
  const { data: analytics } = useUpdateAnalytics(update.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {update.update_type === 'compulsory' ? (
              <AlertTriangle className="h-5 w-5 text-red-500" />
            ) : (
              <Info className="h-5 w-5 text-blue-500" />
            )}
            {update.title}
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <div className="flex items-center gap-2 mt-2">
                {update.status === 'published' ? (
                  <Badge className="bg-green-100 text-green-800">Published</Badge>
                ) : update.status === 'draft' ? (
                  <Badge variant="outline">Draft</Badge>
                ) : (
                  <Badge variant="secondary">Archived</Badge>
                )}
                <Badge variant="outline">
                  {update.target_audience === 'investors' ? 'Investors Only' : 'All Users'}
                </Badge>
                {update.published_at && (
                  <span className="text-sm text-gray-500">
                    Published {format(new Date(update.published_at), 'MMM d, yyyy h:mm a')}
                  </span>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={showAnalytics ? "analytics" : "content"} className="mt-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            {update.status === 'published' && (
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: update.content }}
              />
            </ScrollArea>
          </TabsContent>

          {update.status === 'published' && (
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{update.view_count || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Acknowledgments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{update.acknowledgment_count || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {analytics && analytics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>First Viewed</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Acknowledged</TableHead>
                          <TableHead>Time to Acknowledge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-xs">
                              {record.user_id ? record.user_id.substring(0, 8) + '...' : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {format(new Date(record.first_viewed_at), 'MMM d, h:mm a')}
                            </TableCell>
                            <TableCell>{record.view_count}</TableCell>
                            <TableCell>
                              {record.acknowledged_at ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-300" />
                              )}
                            </TableCell>
                            <TableCell>
                              {record.time_to_acknowledge || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}