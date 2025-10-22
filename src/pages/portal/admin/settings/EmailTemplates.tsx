import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  Mail,
  Search,
  Filter,
  Eye,
  RefreshCw,
  FileText,
  Code,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { TemplateModal } from '@/components/portal/admin/notifications/TemplateModal';
import { format } from 'date-fns';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailTemplates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Load templates
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter templates
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter (case-insensitive)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category.toLowerCase() === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(template => template.is_active === isActive);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Get unique categories with meaningful labels
  const categoryMap: Record<string, string> = {
    notifications: 'Updates',
    updates: 'Updates', // Map lowercase updates to Updates
    system: 'System',
    transactional: 'Contact Form',
    marketing: 'Surveys',
    general: 'General',
    admin: 'Admin',
    user: 'User',
    referrals: 'Referrals',
    events: 'Events'
  };

  // Normalize categories and get unique values
  const normalizedCategories = new Map<string, string>();
  templates.forEach(t => {
    const normalizedCategory = t.category.toLowerCase();
    const displayName = categoryMap[normalizedCategory] ||
                       (t.category.charAt(0).toUpperCase() + t.category.slice(1));

    // Only add if not already present (case-insensitive deduplication)
    if (!Array.from(normalizedCategories.values()).some(v => v.toLowerCase() === displayName.toLowerCase())) {
      normalizedCategories.set(normalizedCategory, displayName);
    }
  });

  const categories = Array.from(normalizedCategories.keys()).sort((a, b) => {
    const displayA = normalizedCategories.get(a) || a;
    const displayB = normalizedCategories.get(b) || b;
    return displayA.localeCompare(displayB);
  });

  // Handle template modal
  const openTemplateModal = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setSelectedTemplateId(null);
    setTemplateModalOpen(false);
  };

  const handleTemplateSaved = () => {
    loadTemplates(); // Refresh the list
    toast({
      title: 'Template Updated',
      description: 'Email template has been updated successfully',
    });
  };

  // Toggle template status
  const toggleTemplateStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Template Updated',
        description: `Template ${!currentStatus ? 'activated' : 'deactivated'}`,
      });

      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, { label: string; className: string }> = {
      notifications: { label: 'Updates', className: 'bg-blue-100 text-blue-800' },
      system: { label: 'System', className: 'bg-gray-100 text-gray-800' },
      transactional: { label: 'Contact Form', className: 'bg-green-100 text-green-800' },
      marketing: { label: 'Surveys', className: 'bg-purple-100 text-purple-800' },
    };

    const mapped = categoryMap[category] || { label: category, className: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={mapped.className}>
        {mapped.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
        {isActive ? (
          <>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and customize automated email templates for all system notifications
          </p>
        </div>
        <Button onClick={loadTemplates} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">All templates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {templates.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Template categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recently Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => {
                const updated = new Date(t.updated_at);
                const now = new Date();
                const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 3600 * 24);
                return daysDiff <= 7;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                Click on any template ID to view and edit the template content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-2 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates by name, ID, or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {normalizedCategories.get(category) || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grouped by Category */}
          <div className="space-y-6">
            {categories.map(category => {
              // Filter templates by normalized category (case-insensitive)
              const categoryTemplates = filteredTemplates.filter(t => t.category.toLowerCase() === category);
              if (categoryTemplates.length === 0) return null;

              // Sort templates alphabetically within each category
              const sortedTemplates = [...categoryTemplates].sort((a, b) =>
                a.name.localeCompare(b.name)
              );

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{normalizedCategories.get(category) || category}</h3>
                    <Badge variant="outline" className="text-xs">
                      {sortedTemplates.length} template{sortedTemplates.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Template</TableHead>
                          <TableHead>Subject Preview</TableHead>
                          <TableHead>Variables</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedTemplates.map(template => (
                          <TableRow key={template.id}>
                            <TableCell>
                              <div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openTemplateModal(template.id)}
                                  className="h-auto p-1 hover:bg-blue-50 justify-start"
                                >
                                  <div className="text-left">
                                    <div className="font-medium">{template.name}</div>
                                    <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {template.id}
                                    </code>
                                  </div>
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate text-sm text-muted-foreground">
                                {template.subject}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {template.variables?.length || 0} variables
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(template.is_active)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(template.updated_at), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openTemplateModal(template.id)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Switch
                                  checked={template.is_active}
                                  onCheckedChange={() => toggleTemplateStatus(template.id, template.is_active)}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No templates found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Modal */}
      <TemplateModal
        templateId={selectedTemplateId}
        isOpen={templateModalOpen}
        onClose={closeTemplateModal}
        onSave={handleTemplateSaved}
      />
    </div>
  );
}