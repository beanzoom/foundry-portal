import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Save,
  Loader2,
  CheckCircle,
  Eye,
  Code,
  Mail,
  Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: string[];
  category: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface TemplateModalProps {
  templateId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (template: EmailTemplate) => void;
}

// Sample data for preview rendering
const SAMPLE_DATA: Record<string, string> = {
  // User data
  name: 'John Doe',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  user_name: 'John Doe',
  user_email: 'john.doe@example.com',

  // Content data
  title: 'Q1 Performance Review',
  description: 'Please review the quarterly performance metrics and provide your feedback.',
  content: 'This survey covers key performance indicators including delivery times, customer satisfaction, and operational efficiency.',
  subject: 'Quarterly Review Request',
  message: 'I would like to schedule a meeting to discuss the new fleet management features.',

  // Event data
  event_date: 'March 15, 2024 at 2:00 PM',
  event_time: '2:00 PM EST',
  location: 'Conference Room A',
  event_title: 'Fleet Management Workshop',

  // Survey data
  survey_title: 'Q1 Satisfaction Survey',
  deadline: 'March 31, 2024',
  due_date: 'March 31, 2024',

  // Update data
  update_type: 'important',

  // System data
  portal_url: 'https://portal.fleetdrms.com',
  admin_url: 'https://portal.fleetdrms.com/portal/admin',
  company: 'Fleet Dynamics Corp',
  phone: '(555) 123-4567',

  // Reference data
  ticketNumber: 'FD-2024-001',
  referral_id: 'REF-001',
  response_id: 'RESP-001',

  // Dates
  completed_at: 'March 12, 2024 at 3:45 PM',
  published_at: 'March 10, 2024',
  created_at: 'March 8, 2024',

  // Counts
  response_count: '23',
  question_count: '8'
};

export function TemplateModal({ templateId, isOpen, onClose, onSave }: TemplateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBodyHtml, setEditedBodyHtml] = useState('');
  const [editedBodyText, setEditedBodyText] = useState('');
  const [originalValues, setOriginalValues] = useState({ subject: '', body_html: '', body_text: '' });

  // Load template when modal opens
  useEffect(() => {
    if (isOpen && templateId) {
      loadTemplate();
    }
  }, [isOpen, templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      setTemplate(data);
      setEditedSubject(data.subject || '');
      setEditedBodyHtml(data.body_html || '');
      setEditedBodyText(data.body_text || '');
      setOriginalValues({
        subject: data.subject || '',
        body_html: data.body_html || '',
        body_text: data.body_text || ''
      });
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({
          subject: editedSubject,
          body_html: editedBodyHtml,
          body_text: editedBodyText,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      const updatedTemplate = {
        ...template,
        subject: editedSubject,
        body_html: editedBodyHtml,
        body_text: editedBodyText,
      };

      setTemplate(updatedTemplate);
      setOriginalValues({
        subject: editedSubject,
        body_html: editedBodyHtml,
        body_text: editedBodyText
      });

      toast({
        title: 'Template Updated',
        description: 'Email template has been saved successfully',
      });

      if (onSave) {
        onSave(updatedTemplate);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save email template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedSubject(originalValues.subject);
    setEditedBodyHtml(originalValues.body_html);
    setEditedBodyText(originalValues.body_text);
  };

  // Simple template variable replacement for preview
  const renderTemplate = (text: string) => {
    if (!text) return '';

    let rendered = text;

    // Replace variables with sample data
    Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi');
      rendered = rendered.replace(regex, value);
    });

    // Handle basic conditionals (simplified)
    rendered = rendered.replace(/\{\{#if\s+\w+\}\}(.*?)\{\{\/if\}\}/gs, '$1');
    rendered = rendered.replace(/\{\{#unless\s+\w+\}\}(.*?)\{\{\/unless\}\}/gs, '');

    return rendered;
  };

  const renderHtmlPreview = (html: string) => {
    const rendered = renderTemplate(html);
    return rendered;
  };

  const renderTextPreview = (text: string) => {
    const rendered = renderTemplate(text);
    return rendered
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)'); // Convert links to text
  };

  const hasChanges =
    editedSubject !== originalValues.subject ||
    editedBodyHtml !== originalValues.body_html ||
    editedBodyText !== originalValues.body_text;

  if (!template && loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!template) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Not Found</DialogTitle>
            <DialogDescription>
              The requested email template could not be loaded.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {template.name}
          </DialogTitle>
          <DialogDescription className="mt-1">
            Edit email template content and preview changes
          </DialogDescription>
        </DialogHeader>

        {/* Template Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Template ID</Label>
                <div className="font-mono text-sm">{template.id}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div><Badge variant="outline">{template.category}</Badge></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div>
                  <Badge className={template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {template.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            {template.variables && template.variables.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Available Variables:</strong><br />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Editor and Preview */}
        <Tabs defaultValue="edit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Edit Template
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            {/* Subject Line */}
            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Email subject line..."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HTML Body */}
              <div className="space-y-2">
                <Label htmlFor="body-html">HTML Body</Label>
                <Textarea
                  id="body-html"
                  value={editedBodyHtml}
                  onChange={(e) => setEditedBodyHtml(e.target.value)}
                  rows={16}
                  placeholder="HTML email content..."
                  className="font-mono text-sm"
                />
              </div>

              {/* Text Body */}
              <div className="space-y-2">
                <Label htmlFor="body-text">Plain Text Body</Label>
                <Textarea
                  id="body-text"
                  value={editedBodyText}
                  onChange={(e) => setEditedBodyText(e.target.value)}
                  rows={16}
                  placeholder="Plain text email content..."
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HTML Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">HTML Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-white min-h-[400px]">
                    <div className="mb-4 pb-2 border-b">
                      <p className="text-sm text-muted-foreground">Subject:</p>
                      <p className="font-medium">{renderTemplate(editedSubject)}</p>
                    </div>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderHtmlPreview(editedBodyHtml)
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Text Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Plain Text Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                    <div className="mb-4 pb-2 border-b border-gray-300">
                      <p className="text-sm text-muted-foreground">Subject:</p>
                      <p className="font-medium">{renderTemplate(editedSubject)}</p>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {renderTextPreview(editedBodyText)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'No changes'}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || saving}
            >
              Reset Changes
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}