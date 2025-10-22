import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, FileText, AlertCircle } from 'lucide-react';

interface TemplateVariable {
  name: string;
  description?: string;
  required: boolean;
  example?: string;
}

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables: TemplateVariable[];
}

interface TemplatePreviewProps {
  template: EmailTemplate;
  sampleData: Record<string, string>;
  onDataChange: (data: Record<string, string>) => void;
}

export function TemplatePreview({ template, sampleData, onDataChange }: TemplatePreviewProps) {
  const [localData, setLocalData] = useState<Record<string, string>>(
    template.variables.reduce((acc, variable) => ({
      ...acc,
      [variable.name]: sampleData[variable.name] || variable.example || ''
    }), {})
  );

  const handleVariableChange = (name: string, value: string) => {
    const newData = { ...localData, [name]: value };
    setLocalData(newData);
    onDataChange(newData);
  };

  const replaceVariables = (content: string): string => {
    let result = content;

    // Replace standard variables
    Object.entries(localData).forEach(([key, value]) => {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(pattern, value || `[${key}]`);
    });

    // Handle conditional blocks (simple if statements)
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, variable, content) => {
      return localData[variable] ? content : '';
    });

    return result;
  };

  const processedSubject = replaceVariables(template.subject);
  const processedHtml = replaceVariables(template.html_content);
  const processedText = replaceVariables(template.text_content || '');

  return (
    <div className="space-y-6">
      {/* Variable Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.variables.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This template has no variables defined.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {template.variables.map((variable) => (
                <div key={variable.name} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={variable.name}>
                      {variable.name}
                    </Label>
                    {variable.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <Input
                    id={variable.name}
                    value={localData[variable.name] || ''}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    placeholder={variable.example || `Enter ${variable.name}`}
                  />
                  {variable.description && (
                    <p className="text-xs text-muted-foreground">
                      {variable.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Email Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="html" className="w-full">
            <TabsList>
              <TabsTrigger value="html">
                <Mail className="h-4 w-4 mr-2" />
                HTML Preview
              </TabsTrigger>
              <TabsTrigger value="text">
                <FileText className="h-4 w-4 mr-2" />
                Text Preview
              </TabsTrigger>
              <TabsTrigger value="raw">
                Raw HTML
              </TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              {/* Subject Preview */}
              <div className="border-b pb-3">
                <Label className="text-sm text-muted-foreground">Subject:</Label>
                <p className="font-semibold mt-1">{processedSubject}</p>
              </div>

              {/* HTML Preview in iframe */}
              <div className="border rounded">
                <iframe
                  srcDoc={processedHtml}
                  className="w-full h-[500px] border-0"
                  title="Email HTML Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </TabsContent>

            <TabsContent value="text">
              {/* Subject Preview */}
              <div className="border-b pb-3">
                <Label className="text-sm text-muted-foreground">Subject:</Label>
                <p className="font-semibold mt-1">{processedSubject}</p>
              </div>

              {/* Text Preview */}
              <ScrollArea className="h-[500px] border rounded p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {processedText || 'No plain text version available'}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="raw">
              {/* Raw HTML Code */}
              <ScrollArea className="h-[500px] border rounded p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {processedHtml}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Missing Variables Warning */}
      {(() => {
        const usedVariables = new Set<string>();
        const variablePattern = /{{([^}#/]+)}}/g;

        [template.subject, template.html_content, template.text_content].forEach(content => {
          if (content) {
            const matches = content.match(variablePattern);
            matches?.forEach(match => {
              const varName = match.replace(/[{}]/g, '').trim();
              usedVariables.add(varName);
            });
          }
        });

        const undefinedVars = Array.from(usedVariables).filter(
          v => !template.variables.find(tv => tv.name === v)
        );

        if (undefinedVars.length > 0) {
          return (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> The following variables are used in the template but not defined: {undefinedVars.join(', ')}
              </AlertDescription>
            </Alert>
          );
        }

        return null;
      })()}
    </div>
  );
}