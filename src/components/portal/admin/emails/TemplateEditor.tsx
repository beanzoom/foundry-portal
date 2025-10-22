import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Code, FileText, Eye, Save, X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { TemplatePreview } from './TemplatePreview';

interface TemplateVariable {
  name: string;
  description?: string;
  required: boolean;
  example?: string;
}

interface EmailTemplate {
  id?: string;
  name: string;
  description?: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: TemplateVariable[];
  category: string;
  is_active: boolean;
  is_system?: boolean;
}

interface TemplateEditorProps {
  template: EmailTemplate;
  onSave: (template: EmailTemplate) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [formData, setFormData] = useState<EmailTemplate>(template);
  const [previewMode, setPreviewMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    description: '',
    required: false,
    example: ''
  });

  const categories = [
    { value: 'system', label: 'System' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'custom', label: 'Custom' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.subject?.trim()) {
      newErrors.subject = 'Email subject is required';
    }

    if (!formData.html_content?.trim()) {
      newErrors.html = 'HTML content is required';
    }

    // Validate variables in template
    const variablePattern = /{{([^}]+)}}/g;
    const usedVariables = new Set<string>();

    const subjectVars = formData.subject.match(variablePattern);
    const htmlVars = formData.html_content.match(variablePattern);
    const textVars = formData.text_content?.match(variablePattern);

    [subjectVars, htmlVars, textVars].forEach(vars => {
      vars?.forEach(v => {
        const varName = v.replace(/[{}]/g, '').trim();
        usedVariables.add(varName);
      });
    });

    const definedVariables = new Set(formData.variables.map(v => v.name));
    const undefinedVars = Array.from(usedVariables).filter(v => !definedVariables.has(v));

    if (undefinedVars.length > 0) {
      newErrors.variables = `Undefined variables used: ${undefinedVars.join(', ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const addVariable = () => {
    if (newVariable.name.trim()) {
      setFormData({
        ...formData,
        variables: [...formData.variables, { ...newVariable }]
      });
      setNewVariable({
        name: '',
        description: '',
        required: false,
        example: ''
      });
    }
  };

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index)
    });
  };

  const generateTextFromHtml = () => {
    // Simple HTML to text conversion
    let text = formData.html_content;

    // Remove HTML tags
    text = text.replace(/<style[^>]*>.*?<\/style>/gs, '');
    text = text.replace(/<script[^>]*>.*?<\/script>/gs, '');
    text = text.replace(/<[^>]+>/g, '');

    // Clean up whitespace
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/\n\s*\n/g, '\n\n');

    setFormData({ ...formData, text_content: text.trim() });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>
                Basic information about the email template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., welcome-email"
                    disabled={template.is_system}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when this template is used"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome to {{companyName}}!"
                />
                {errors.subject && (
                  <p className="text-sm text-destructive">{errors.subject}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Template is active</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Variables</CardTitle>
              <CardDescription>
                Define variables that can be used in the template with {"{{variableName}}"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.variables && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.variables}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={variable.required ? 'default' : 'outline'}>
                          {`{{${variable.name}}}`}
                        </Badge>
                        {variable.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {variable.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="border rounded p-3 space-y-3 bg-muted/50">
                <Label>Add Variable</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    placeholder="Variable name"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={newVariable.description}
                    onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newVariable.required}
                      onCheckedChange={(checked) => setNewVariable({ ...newVariable, required: checked })}
                    />
                    <Label>Required</Label>
                  </div>
                  <Button onClick={addVariable} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HTML Content</CardTitle>
              <CardDescription>
                The HTML version of your email template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                placeholder="Enter HTML content..."
                className="font-mono text-sm"
                rows={20}
              />
              {errors.html && (
                <p className="text-sm text-destructive mt-2">{errors.html}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plain Text Content</CardTitle>
              <CardDescription>
                The plain text version for email clients that don't support HTML
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button variant="outline" onClick={generateTextFromHtml}>
                  Generate from HTML
                </Button>
              </div>
              <Textarea
                value={formData.text_content || ''}
                onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                placeholder="Enter plain text content..."
                className="font-mono text-sm"
                rows={20}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                Preview how your email will look with sample data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplatePreview
                template={formData}
                sampleData={{}}
                onDataChange={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>
    </div>
  );
}