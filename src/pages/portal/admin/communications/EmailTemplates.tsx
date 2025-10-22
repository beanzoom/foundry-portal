import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail, Search, Filter, Eye, Edit, Copy, CheckCircle,
  XCircle, FileText, Code, AlertCircle, Plus, ChevronRight, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { adminRoute } from '@/lib/portal/navigation';
import { TemplateModal } from '@/components/portal/admin/notifications/TemplateModal';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: string[] | null;
  category: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: any;
  // Computed fields
  usedBy?: string[];
  usageCount?: number;
}

export function EmailTemplates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  // Load templates with usage information
  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Load templates
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (templateError) throw templateError;

      // Load usage information
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select('template_id, event_id');

      if (rulesError) throw rulesError;

      // Combine data
      const templatesWithUsage = (templateData || []).map(template => {
        const usage = (rulesData || []).filter(rule => rule.template_id === template.id);
        return {
          ...template,
          usedBy: usage.map(u => u.event_id),
          usageCount: usage.length
        };
      });

      setTemplates(templatesWithUsage);
      setFilteredTemplates(templatesWithUsage);
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

  useEffect(() => {
    loadTemplates();
  }, []);

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

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(template => template.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(template => {
        if (statusFilter === 'active') return template.is_active === true;
        if (statusFilter === 'inactive') return template.is_active === false;
        if (statusFilter === 'orphaned') return (template.usageCount || 0) === 0;
        return true;
      });
    }

    setFilteredTemplates(filtered);
  }, [searchTerm, categoryFilter, statusFilter, templates]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category || 'uncategorized')))];

  // Toggle template status
  const toggleTemplateStatus = async (template: EmailTemplate) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Template ${template.is_active ? 'deactivated' : 'activated'}`,
      });

      loadTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    }
  };

  const getCategoryBadgeVariant = (category: string | null) => {
    switch (category) {
      case 'system': return 'default';
      case 'admin': return 'destructive';
      case 'notifications': return 'secondary';
      case 'security': return 'outline';
      default: return 'outline';
    }
  };

  const formatEventName = (eventId: string) => {
    return eventId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to={adminRoute('settings')} className="hover:text-foreground">Settings</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link to={adminRoute('settings/communications')} className="hover:text-foreground">Communications</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">Email Templates</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage and organize email templates for all notification types
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="orphaned">Not Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[250px]">Template Name</TableHead>
                  <TableHead className="w-[300px]">Subject</TableHead>
                  <TableHead className="w-[120px]">Category</TableHead>
                  <TableHead className="w-[200px]">Used By</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading templates...
                    </TableCell>
                  </TableRow>
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No templates found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate max-w-[280px]" title={template.subject}>
                          {template.subject}
                        </div>
                        {template.variables && template.variables.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {template.variables.slice(0, 3).map(v => (
                              <Badge key={v} variant="outline" className="text-xs">
                                {v}
                              </Badge>
                            ))}
                            {template.variables.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.variables.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getCategoryBadgeVariant(template.category)}
                          className={
                            template.category === 'admin' ? 'bg-red-100 text-red-700 border-red-200' :
                            template.category === 'notifications' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            template.category === 'system' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            template.category === 'security' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
                          }
                        >
                          {template.category || 'uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {template.usageCount === 0 ? (
                          <span className="text-sm text-muted-foreground italic">Not assigned</span>
                        ) : (
                          <div className="space-y-1">
                            {template.usedBy?.slice(0, 2).map((event, index) => (
                              <Badge key={`${template.id}-${event}-${index}`} variant="secondary" className="text-xs mr-1">
                                {formatEventName(event)}
                              </Badge>
                            ))}
                            {(template.usedBy?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{(template.usedBy?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={template.is_active === true}
                          onCheckedChange={() => toggleTemplateStatus(template)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setPreviewOpen(true);
                            }}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplateId(template.id);
                              setTemplateModalOpen(true);
                            }}
                            className="hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled className="hover:bg-gray-50">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Template Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Template ID: {selectedTemplate?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Subject</h4>
                <p className="p-2 bg-muted rounded">{selectedTemplate.subject}</p>
              </div>
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(v => (
                      <Badge key={v} variant="secondary">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">HTML Preview</h4>
                <div className="border rounded p-4 bg-white">
                  <iframe
                    srcDoc={selectedTemplate.body_html}
                    className="w-full h-[400px] border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Edit Modal */}
      {selectedTemplateId && (
        <TemplateModal
          templateId={selectedTemplateId}
          isOpen={templateModalOpen}
          onClose={() => {
            setTemplateModalOpen(false);
            setSelectedTemplateId(null);
            loadTemplates(); // Reload templates after edit
          }}
        />
      )}
    </div>
  );
}