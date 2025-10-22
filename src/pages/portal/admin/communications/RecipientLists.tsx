import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, Mail, Shield, UserPlus, TrendingUp, Plus, Edit, Trash2,
  Eye, Save, X, AlertCircle, CheckCircle, ChevronRight, Settings,
  Send, RefreshCw, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { adminRoute } from '@/lib/portal/navigation';

interface RecipientList {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: 'static' | 'role_based' | 'dynamic' | 'custom';
  config: any;
  is_system: boolean;
  is_active: boolean;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields
  usageCount?: number;
  recipientCount?: number;
}

interface RecipientListFormData {
  name: string;
  description: string;
  type: 'static' | 'role_based' | 'dynamic' | 'custom';
  staticEmails: string[];
  roles: string[];
  includeAdmins: boolean;
  dynamicSource: string;
  customQuery: string;
  color: string;
  icon: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  User: <User className="h-4 w-4" />,
  UserPlus: <UserPlus className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Mail: <Mail className="h-4 w-4" />,
  Settings: <Settings className="h-4 w-4" />,
};

const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function RecipientLists() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<RecipientList | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<RecipientList | null>(null);
  const [viewEmailsOpen, setViewEmailsOpen] = useState(false);
  const [viewingList, setViewingList] = useState<RecipientList | null>(null);
  const [resolvedEmails, setResolvedEmails] = useState<string[]>([]);

  // Form states
  const [formData, setFormData] = useState<RecipientListFormData>({
    name: '',
    description: '',
    type: 'static',
    staticEmails: [],
    roles: [],
    includeAdmins: false,
    dynamicSource: 'triggering_user',
    customQuery: '',
    color: 'blue',
    icon: 'Users',
  });

  // Available roles (would normally fetch from database)
  const availableRoles = [
    { id: 'member', name: 'All Members', count: 0 },
    { id: 'admin', name: 'Administrators', count: 0 },
    { id: 'investor', name: 'Investors', count: 0 },
    { id: 'super_admin', name: 'Super Admins', count: 0 },
  ];

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      // Load recipient lists
      const { data: listsData, error: listsError } = await supabase
        .from('recipient_lists')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (listsError) throw listsError;

      // Load usage counts
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select('recipient_list_id');

      if (rulesError) throw rulesError;

      // Calculate usage counts
      const usageCounts = (rulesData || []).reduce((acc, rule) => {
        if (rule.recipient_list_id) {
          acc[rule.recipient_list_id] = (acc[rule.recipient_list_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Attach usage counts to lists
      const listsWithUsage = (listsData || []).map(list => ({
        ...list,
        usageCount: usageCounts[list.id] || 0,
        recipientCount: estimateRecipientCount(list),
      }));

      setLists(listsWithUsage);
    } catch (error) {
      console.error('Error loading recipient lists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recipient lists',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const estimateRecipientCount = (list: RecipientList): number => {
    // This is a simplified estimation - in production, you'd query actual counts
    switch (list.type) {
      case 'static':
        return list.config?.emails?.length || 0;
      case 'role_based':
        return list.config?.roles?.includes('member') ? 100 : 10; // Placeholder
      case 'dynamic':
        return 1; // Dynamic is typically single user
      default:
        return 0;
    }
  };

  const handleOpenModal = (list?: RecipientList) => {
    if (list) {
      setEditingList(list);
      // Populate form with existing data
      setFormData({
        name: list.name,
        description: list.description || '',
        type: list.type,
        staticEmails: list.config?.emails || [],
        roles: list.config?.roles || [],
        includeAdmins: list.config?.include_admins || false,
        dynamicSource: list.config?.source || 'triggering_user',
        customQuery: list.config?.query || '',
        color: list.color || 'blue',
        icon: list.icon || 'Users',
      });
    } else {
      setEditingList(null);
      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'static',
        staticEmails: [],
        roles: [],
        includeAdmins: false,
        dynamicSource: 'triggering_user',
        customQuery: '',
        color: 'blue',
        icon: 'Users',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingList(null);
  };

  const handleSaveList = async () => {
    try {
      // Build config based on type
      let config: any = {};
      switch (formData.type) {
        case 'static':
          config = { emails: formData.staticEmails };
          break;
        case 'role_based':
          config = {
            roles: formData.roles,
            include_admins: formData.includeAdmins,
          };
          break;
        case 'dynamic':
          config = {
            source: formData.dynamicSource,
            query: formData.customQuery,
          };
          break;
        case 'custom':
          config = {
            rules: [], // Would be more complex in production
          };
          break;
      }

      const listData = {
        name: formData.name,
        code: formData.name.toLowerCase().replace(/\s+/g, '_'),
        description: formData.description,
        type: formData.type,
        config,
        color: formData.color,
        icon: formData.icon,
        is_active: true,
      };

      if (editingList && !editingList.is_system) {
        // Update existing list
        const { error } = await supabase
          .from('recipient_lists')
          .update(listData)
          .eq('id', editingList.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Recipient list updated successfully',
        });
      } else if (!editingList) {
        // Create new list
        const { error } = await supabase
          .from('recipient_lists')
          .insert(listData);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Recipient list created successfully',
        });
      }

      handleCloseModal();
      loadLists();
    } catch (error: any) {
      console.error('Error saving recipient list:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save recipient list',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete || listToDelete.is_system) return;

    try {
      const { error } = await supabase
        .from('recipient_lists')
        .delete()
        .eq('id', listToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Recipient list deleted successfully',
      });

      setDeleteConfirmOpen(false);
      setListToDelete(null);
      loadLists();
    } catch (error) {
      console.error('Error deleting recipient list:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete recipient list',
        variant: 'destructive',
      });
    }
  };

  const toggleListStatus = async (list: RecipientList) => {
    try {
      const { error } = await supabase
        .from('recipient_lists')
        .update({ is_active: !list.is_active })
        .eq('id', list.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Recipient list ${list.is_active ? 'deactivated' : 'activated'}`,
      });

      loadLists();
    } catch (error) {
      console.error('Error toggling list status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update list status',
        variant: 'destructive',
      });
    }
  };

  const handleViewEmails = async (list: RecipientList) => {
    setViewingList(list);
    setResolvedEmails([]);
    setViewEmailsOpen(true);

    // Resolve emails based on list type
    try {
      let emails: string[] = [];

      if (list.type === 'static') {
        // Static lists have emails in config
        emails = list.config?.emails || [];
      } else if (list.type === 'role_based') {
        // Role-based lists - query profiles by role
        const roles = list.config?.roles || [];
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .in('role', roles)
          .not('email', 'is', null);

        if (error) throw error;
        emails = data.map(p => p.email).filter(Boolean);
      } else if (list.type === 'dynamic') {
        // Dynamic lists can't show emails (depends on event context)
        emails = ['Dynamic recipient - depends on event context'];
      }

      setResolvedEmails(emails);
    } catch (error) {
      console.error('Error resolving emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email addresses',
        variant: 'destructive',
      });
    }
  };

  const getListIcon = (icon: string | null) => {
    return ICON_MAP[icon || 'Users'] || <Users className="h-4 w-4" />;
  };

  const getListBadge = (list: RecipientList) => {
    const colorClass = COLOR_CLASSES[list.color || 'gray'];
    return (
      <Badge className={colorClass}>
        {getListIcon(list.icon)}
        <span className="ml-1">{list.name}</span>
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'static':
        return <Badge variant="outline">Static</Badge>;
      case 'role_based':
        return <Badge variant="secondary">Role-based</Badge>;
      case 'dynamic':
        return <Badge>Dynamic</Badge>;
      case 'custom':
        return <Badge variant="default">Custom</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filter lists
  const filteredLists = lists.filter(list => {
    const matchesSearch = list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         list.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || list.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading recipient lists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to={adminRoute('settings')} className="hover:text-foreground">Settings</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link to={adminRoute('settings/communications')} className="hover:text-foreground">Communications</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">Recipient Lists</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Recipient Lists</h1>
          <p className="text-muted-foreground">
            Manage email recipient lists for notification rules
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-4 w-4" />
          New List
        </Button>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Recipient lists define who receives notifications for each event. System lists cannot be deleted but can be deactivated.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search lists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="static">Static</SelectItem>
                <SelectItem value="role_based">Role-based</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lists Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px] text-center">Recipients</TableHead>
                <TableHead className="w-[100px] text-center">Used By</TableHead>
                <TableHead className="w-[100px] text-center">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      <Mail className="h-8 w-8 mx-auto mb-2" />
                      <p>No recipient lists found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell>
                      <button
                        onClick={() => handleViewEmails(list)}
                        className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                        disabled={list.type === 'dynamic' && !['static', 'role_based'].includes(list.type)}
                      >
                        {getListBadge(list)}
                        {list.is_system && (
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>{getTypeBadge(list.type)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {list.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {list.recipientCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {list.usageCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={list.is_active}
                        onCheckedChange={() => toggleListStatus(list)}
                        disabled={list.is_system && list.code === 'portal_admins'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(list)}
                          disabled={list.is_system}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setListToDelete(list);
                            setDeleteConfirmOpen(true);
                          }}
                          disabled={list.is_system}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingList ? 'Edit Recipient List' : 'Create Recipient List'}
            </DialogTitle>
            <DialogDescription>
              Define who should receive notifications for this list
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Marketing Team"
                    disabled={editingList?.is_system}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    disabled={editingList?.is_system}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static (Fixed Emails)</SelectItem>
                      <SelectItem value="role_based">Role-based</SelectItem>
                      <SelectItem value="dynamic">Dynamic</SelectItem>
                      <SelectItem value="custom">Custom Rules</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe who this list includes..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Color</Label>
                  <Select
                    value={formData.color}
                    onValueChange={(value) => setFormData({ ...formData, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Red</SelectItem>
                      <SelectItem value="green">Green</SelectItem>
                      <SelectItem value="blue">Blue</SelectItem>
                      <SelectItem value="indigo">Indigo</SelectItem>
                      <SelectItem value="purple">Purple</SelectItem>
                      <SelectItem value="yellow">Yellow</SelectItem>
                      <SelectItem value="gray">Gray</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Users">Users</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Mail">Mail</SelectItem>
                      <SelectItem value="Shield">Shield</SelectItem>
                      <SelectItem value="UserPlus">User Plus</SelectItem>
                      <SelectItem value="TrendingUp">Trending Up</SelectItem>
                      <SelectItem value="Settings">Settings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Type-specific Configuration */}
            {formData.type === 'static' && (
              <div className="space-y-2">
                <Label>Email Addresses</Label>
                <Textarea
                  placeholder="Enter email addresses (one per line)"
                  value={formData.staticEmails.join('\n')}
                  onChange={(e) => setFormData({
                    ...formData,
                    staticEmails: e.target.value.split('\n').filter(email => email.trim())
                  })}
                  rows={4}
                />
                <p className="text-sm text-muted-foreground">
                  {formData.staticEmails.length} email address(es)
                </p>
              </div>
            )}

            {formData.type === 'role_based' && (
              <div className="space-y-4">
                <Label>Select User Roles</Label>
                <div className="space-y-2">
                  {availableRoles.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={role.id}
                        checked={formData.roles.includes(role.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              roles: [...formData.roles, role.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              roles: formData.roles.filter(r => r !== role.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={role.id} className="cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include_admins"
                    checked={formData.includeAdmins}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, includeAdmins: !!checked })
                    }
                  />
                  <Label htmlFor="include_admins" className="cursor-pointer">
                    Always include Portal Admins
                  </Label>
                </div>
              </div>
            )}

            {formData.type === 'dynamic' && (
              <div className="space-y-4">
                <Label>Dynamic Source</Label>
                <Select
                  value={formData.dynamicSource}
                  onValueChange={(value) => setFormData({ ...formData, dynamicSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="triggering_user">User who triggered the event</SelectItem>
                    <SelectItem value="referred_user">User being referred/invited</SelectItem>
                    <SelectItem value="event_participant">Event participant</SelectItem>
                    <SelectItem value="custom">Custom query</SelectItem>
                  </SelectContent>
                </Select>

                {formData.dynamicSource === 'custom' && (
                  <div>
                    <Label>Custom Query</Label>
                    <Textarea
                      placeholder="Define custom recipient logic..."
                      value={formData.customQuery}
                      onChange={(e) => setFormData({ ...formData, customQuery: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveList} disabled={!formData.name}>
              <Save className="mr-2 h-4 w-4" />
              {editingList ? 'Update' : 'Create'} List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipient List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{listToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteList}>
              Delete List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Emails Dialog */}
      <Dialog open={viewEmailsOpen} onOpenChange={setViewEmailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewingList?.name} - Email Addresses
            </DialogTitle>
            <DialogDescription>
              {viewingList?.type === 'static' && 'Static email addresses configured for this list'}
              {viewingList?.type === 'role_based' && `Users with roles: ${viewingList?.config?.roles?.join(', ')}`}
              {viewingList?.type === 'dynamic' && 'Dynamic recipients based on event context'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {resolvedEmails.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading email addresses...
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  {resolvedEmails.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-mono">{email}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Total: {resolvedEmails.length} email{resolvedEmails.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewEmailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}