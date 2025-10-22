import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useContacts, useMarkets, useStations, useDSPs } from '@/hooks/useContactTracking';
import { contactTrackingService } from '@/services/contact-tracking.service';
import type { ContactFormData, ContactStatus, ContactTitle } from '@/types/contact-tracking';
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  ArrowRight,
  Info,
  Users,
  Building,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

interface ImportRow {
  [key: string]: any;
}

interface MappingField {
  sourceColumn: string;
  targetField: keyof ContactFormData | 'skip' | 'dsp_code' | 'dsp_name';
  transform?: (value: any) => any;
}

interface ImportResult {
  success: boolean;
  row: number;
  data?: ContactFormData;
  error?: string;
  contact?: any;
}

interface ValidationIssue {
  row: number;
  field: string;
  value: any;
  issue: string;
}

export function ContactImportDialog({ open, onClose, onImportComplete }: ContactImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'review' | 'import' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<ImportRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, MappingField>>({});
  const [processedData, setProcessedData] = useState<ContactFormData[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'create'>('skip');
  const [isDragging, setIsDragging] = useState(false);
  
  const { refetch: refetchContacts } = useContacts();
  const { markets } = useMarkets();
  const { stations } = useStations();
  const { dsps, refetch: refetchDSPs } = useDSPs();

  // Field mapping suggestions based on common column names
  const fieldSuggestions: Record<string, keyof ContactFormData | 'dsp_code' | 'dsp_name'> = {
    'first name': 'first_name',
    'firstname': 'first_name',
    'fname': 'first_name',
    'last name': 'last_name',
    'lastname': 'last_name',
    'lname': 'last_name',
    'email': 'email',
    'email address': 'email',
    'phone': 'phone',
    'phone number': 'phone',
    'mobile': 'phone',
    'cell': 'phone',
    'title': 'title',
    'role': 'title',
    'position': 'title',
    'notes': 'notes',
    'comments': 'notes',
    'tags': 'tags',
    'status': 'contact_status',
    'dsp': 'dsp_id',
    'dsp name': 'dsp_name',
    'dsp code': 'dsp_code',
    'station': 'station_id',
    'station code': 'station_id',
    'referred by': 'referred_by_text',
    'referrer': 'referred_by_text',
  };

  // Process file
  const processFile = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(uploadedFile, {
        complete: (result) => {
          const data = result.data as ImportRow[];
          if (data.length > 0) {
            setHeaders(Object.keys(data[0]));
            setRawData(data);
            initializeMappings(Object.keys(data[0]));
            setStep('map');
          }
        },
        header: true,
        skipEmptyLines: true,
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as ImportRow[];
        
        if (jsonData.length > 0) {
          setHeaders(Object.keys(jsonData[0]));
          setRawData(jsonData);
          initializeMappings(Object.keys(jsonData[0]));
          setStep('map');
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  }, [processFile]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    const validFile = files.find(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
    });
    
    if (validFile) {
      processFile(validFile);
    }
  }, [processFile]);

  // Initialize mappings with suggestions
  const initializeMappings = (columns: string[]) => {
    const initialMappings: Record<string, MappingField> = {};
    
    columns.forEach(column => {
      const columnLower = column.toLowerCase().trim();
      const suggestedField = fieldSuggestions[columnLower];
      
      initialMappings[column] = {
        sourceColumn: column,
        targetField: suggestedField || 'skip',
      };
    });
    
    setMappings(initialMappings);
  };

  // Update field mapping
  const updateMapping = (sourceColumn: string, targetField: keyof ContactFormData | 'skip' | 'dsp_code' | 'dsp_name') => {
    setMappings(prev => ({
      ...prev,
      [sourceColumn]: {
        ...prev[sourceColumn],
        targetField,
      },
    }));
  };

  // Process and validate data
  const processData = () => {
    const processed: ContactFormData[] = [];
    const issues: ValidationIssue[] = [];
    
    rawData.forEach((row, index) => {
      const contact: ContactFormData = {};
      let hasValidData = false;
      
      Object.entries(mappings).forEach(([column, mapping]) => {
        if (mapping.targetField !== 'skip' && row[column]) {
          const value = row[column];
          
          // Handle different field types
          switch (mapping.targetField) {
            case 'title':
              if (['Owner', 'Ops', 'Dispatch'].includes(value)) {
                contact.title = value as ContactTitle;
              } else if (value) {
                issues.push({
                  row: index + 1,
                  field: 'title',
                  value,
                  issue: `Invalid title. Must be Owner, Ops, or Dispatch`,
                });
              }
              break;
              
            case 'contact_status':
              if (['new', 'contacted', 'qualified', 'active', 'inactive'].includes(value)) {
                contact.contact_status = value as ContactStatus;
              } else {
                contact.contact_status = 'new';
              }
              break;
              
            case 'tags':
              contact.tags = typeof value === 'string' 
                ? value.split(',').map(t => t.trim()).filter(Boolean)
                : [];
              break;
              
            case 'dsp_id':
              // This field expects either DSP name or code
              // We'll try to match by both
              const dspValue = String(value).trim();
              if (dspValue) {
                const dsp = dsps.find(d => 
                  d.dsp_name?.toLowerCase() === dspValue.toLowerCase() ||
                  d.dsp_code?.toLowerCase() === dspValue.toLowerCase()
                );
                if (dsp) {
                  contact.dsp_id = dsp.id;
                  // Auto-set station and market from DSP if available
                  if (dsp.station_id) {
                    contact.station_id = dsp.station_id;
                    const station = stations.find(s => s.id === dsp.station_id);
                    if (station?.market_id) {
                      contact.market_id = station.market_id;
                    }
                  }
                }
                // Store DSP info for potential creation later
                (contact as any)._dsp_ref = dspValue;
              }
              break;
              
            case 'dsp_code':
              // Handle DSP Code specifically
              const codeValue = String(value).trim();
              if (codeValue && !contact.dsp_id) {  // Only if not already set
                const dspByCode = dsps.find(d => 
                  d.dsp_code?.toLowerCase() === codeValue.toLowerCase()
                );
                if (dspByCode) {
                  contact.dsp_id = dspByCode.id;
                  // Auto-set station and market from DSP if available
                  if (dspByCode.station_id) {
                    contact.station_id = dspByCode.station_id;
                    const station = stations.find(s => s.id === dspByCode.station_id);
                    if (station?.market_id) {
                      contact.market_id = station.market_id;
                    }
                  }
                }
                // Store DSP code for potential creation later
                (contact as any)._dsp_code = codeValue;
              }
              break;
              
            case 'dsp_name':
              // Handle DSP Name specifically
              const nameValue = String(value).trim();
              if (nameValue && !contact.dsp_id) {  // Only if not already set
                const dspByName = dsps.find(d => 
                  d.dsp_name?.toLowerCase() === nameValue.toLowerCase()
                );
                if (dspByName) {
                  contact.dsp_id = dspByName.id;
                  // Auto-set station and market from DSP if available
                  if (dspByName.station_id) {
                    contact.station_id = dspByName.station_id;
                    const station = stations.find(s => s.id === dspByName.station_id);
                    if (station?.market_id) {
                      contact.market_id = station.market_id;
                    }
                  }
                }
                // Store DSP name for potential creation later
                (contact as any)._dsp_name = nameValue;
              }
              break;
              
            case 'station_id':
              // Only set if not already set by DSP
              const stationValue = String(value).trim();
              if (stationValue && !contact.station_id) {
                const station = stations.find(s => 
                  s.station_code?.toLowerCase() === stationValue.toLowerCase()
                );
                if (station) {
                  contact.station_id = station.id;
                  if (station.market_id) {
                    contact.market_id = station.market_id;
                  }
                }
                // Store station code for reference (but don't create - stations need more info)
                (contact as any)._station_ref = stationValue;
              }
              break;
              
            case 'market_id':
              // Skip - markets are auto-set from station/DSP
              // We don't allow direct market assignment
              break;
              
            default:
              (contact as any)[mapping.targetField] = value;
              break;
          }
          
          hasValidData = true;
        }
      });
      
      // More flexible validation - allow contacts with just DSP info
      const hasContactInfo = contact.email || contact.phone || (contact.first_name && contact.last_name);
      const hasDspInfo = (contact as any)._dsp_name || (contact as any)._dsp_code || contact.dsp_id;
      const hasStationInfo = (contact as any)._station_ref || contact.station_id;
      
      if (!hasContactInfo && !hasDspInfo && !hasStationInfo) {
        issues.push({
          row: index + 1,
          field: 'identifier',
          value: '',
          issue: 'Row must have at least some identifying information',
        });
      } else if (hasValidData) {
        // Set default status if not provided
        if (!contact.contact_status) {
          contact.contact_status = 'new';
        }
        
        // If we only have DSP info but no contact details, create a placeholder contact
        if (!hasContactInfo && hasDspInfo) {
          // Set a note indicating this is a placeholder
          contact.notes = (contact.notes ? contact.notes + '\n' : '') + 
            `[Placeholder entry - DSP known but no contact details yet]`;
          contact.contact_status = 'new';
        }
        
        processed.push(contact);
      }
    });
    
    setProcessedData(processed);
    setValidationIssues(issues);
    setStep('review');
  };

  // Import contacts
  const importContacts = async () => {
    setImporting(true);
    setImportProgress(0);
    const results: ImportResult[] = [];
    const dspCache = new Map<string, string>(); // Cache created DSPs
    
    for (let i = 0; i < processedData.length; i++) {
      const contact = processedData[i] as any;
      const progress = ((i + 1) / processedData.length) * 100;
      setImportProgress(progress);
      
      try {
        // Check for duplicates
        if (duplicateHandling === 'skip' && contact.email) {
          const existing = await contactTrackingService.searchContacts(contact.email, 1);
          if (existing.length > 0) {
            results.push({
              success: false,
              row: i + 1,
              data: contact,
              error: 'Duplicate email - skipped',
            });
            continue;
          }
        }
        
        // Create DSP if needed and not already created
        if (!contact.dsp_id && (contact._dsp_name || contact._dsp_code)) {
          const dspKey = `${contact._dsp_code || ''}_${contact._dsp_name || ''}`;
          
          // Check cache first
          if (dspCache.has(dspKey)) {
            contact.dsp_id = dspCache.get(dspKey);
          } else if (contact._dsp_name) {
            // Create new DSP with minimal info
            try {
              const newDsp = await contactTrackingService.createDSP({
                dsp_code: contact._dsp_code || '',
                dsp_name: contact._dsp_name,
                station_id: contact.station_id || undefined,
                is_active: true,
              });
              contact.dsp_id = newDsp.id;
              dspCache.set(dspKey, newDsp.id);
            } catch (dspError) {
              // DSP creation failed, but continue with contact creation
              console.warn(`Failed to create DSP for row ${i + 1}:`, dspError);
            }
          }
        }
        
        // Clean up temporary fields
        delete contact._dsp_name;
        delete contact._dsp_code;
        delete contact._dsp_ref;
        delete contact._station_ref;
        
        // Create the contact
        const newContact = await contactTrackingService.createContact(contact);
        results.push({
          success: true,
          row: i + 1,
          data: contact,
          contact: newContact,
        });
      } catch (error) {
        results.push({
          success: false,
          row: i + 1,
          data: contact,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    setImportResults(results);
    setImporting(false);
    setStep('complete');
    
    // Refresh contacts and DSPs lists
    refetchContacts();
    refetchDSPs();
    onImportComplete?.();
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '555-0123',
        'Title': 'Owner',  // Must be: Owner, Ops, or Dispatch
        'DSP Code': 'DSP001',  // Optional: DSP code
        'DSP Name': 'Lightning Logistics',  // Optional: DSP name
        'Station Code': 'DCA1',  // Optional: Station code
        'Status': 'new',  // Options: new, contacted, qualified, active, inactive
        'Tags': 'vip, fleet-owner',  // Comma-separated tags
        'Notes': 'Primary contact for operations',
        'Referred By': 'Jane Smith',  // Free text for referral source
      },
      {
        'First Name': '',  // Can be blank if you only know DSP
        'Last Name': '',
        'Email': '',
        'Phone': '',
        'Title': '',
        'DSP Name': 'Thunder Express',  // Track DSP without contact details
        'Station Code': 'LAX3',
        'Status': 'new',
        'Tags': 'needs-contact-info',
        'Notes': 'DSP exists but no owner contact yet',
        'Referred By': '',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Email': 'jane.smith@example.com',
        'Phone': '555-0456',
        'Title': 'Dispatch',
        'DSP Name': 'Lightning Logistics',  // Can use DSP name
        'Station Code': 'LAX3',
        'Status': 'active',
        'Tags': 'dispatcher',
        'Notes': 'Night shift dispatcher',
        'Referred By': 'John Doe',
      },
    ];
    
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate stats
  const successCount = importResults.filter(r => r.success).length;
  const failureCount = importResults.filter(r => !r.success).length;
  const warningCount = validationIssues.filter(i => i.issue.includes('will be created')).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to bulk import contacts into the system
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-6">
          {['upload', 'map', 'review', 'import', 'complete'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s ? "bg-primary text-primary-foreground" : 
                index < ['upload', 'map', 'review', 'import', 'complete'].indexOf(step) 
                  ? "bg-green-500 text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {index < ['upload', 'map', 'review', 'import', 'complete'].indexOf(step) ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 4 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <div className="px-6 pb-6">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload File</CardTitle>
                    <CardDescription>
                      Select a CSV or Excel file containing your contact data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                        isDragging ? "border-primary bg-primary/5" : "border-border"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <FileSpreadsheet className={cn(
                        "h-12 w-12 mx-auto mb-4",
                        isDragging ? "text-primary" : "text-muted-foreground"
                      )} />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className={cn(
                          "text-sm",
                          isDragging ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {isDragging ? "Drop your file here" : "Click to upload or drag and drop"}
                        </span>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </Label>
                      <p className="text-xs text-muted-foreground mt-2">
                        CSV, XLSX, or XLS files up to 10MB
                      </p>
                    </div>

                    {file && (
                      <Alert>
                        <FileSpreadsheet className="h-4 w-4" />
                        <AlertDescription>
                          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                      </Button>
                      <Button 
                        onClick={() => setStep('map')} 
                        disabled={!file}
                      >
                        Next: Map Fields
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Import Tips:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Flexible import: Can import contacts, DSP references, or both</li>
                      <li>Contact info (email/phone/name) is optional if DSP info is provided</li>
                      <li>DSPs will be created automatically if they don't exist</li>
                      <li>Use this to track DSPs you know about but don't have contacts for yet</li>
                      <li>Title options: Owner, Ops, or Dispatch (optional)</li>
                      <li>Station codes should match existing stations if provided</li>
                      <li>Separate multiple tags with commas</li>
                      <li>You can add contact details and organize hierarchy later</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Map Fields */}
            {step === 'map' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Map Fields</CardTitle>
                    <CardDescription>
                      Map your spreadsheet columns to contact fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {headers.map(header => (
                        <div key={header} className="grid grid-cols-3 gap-4 items-center">
                          <div className="font-medium text-sm">{header}</div>
                          <div className="text-sm text-muted-foreground">
                            {rawData[0]?.[header] || '(empty)'}
                          </div>
                          <Select
                            value={mappings[header]?.targetField || 'skip'}
                            onValueChange={(value) => updateMapping(header, value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Skip this column</SelectItem>
                              <SelectItem value="first_name">First Name</SelectItem>
                              <SelectItem value="last_name">Last Name</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="title">Title (Owner/Ops/Dispatch)</SelectItem>
                              <SelectItem value="dsp_code">DSP Code</SelectItem>
                              <SelectItem value="dsp_name">DSP Name</SelectItem>
                              <SelectItem value="station_id">Station Code</SelectItem>
                              <SelectItem value="notes">Notes</SelectItem>
                              <SelectItem value="tags">Tags (comma-separated)</SelectItem>
                              <SelectItem value="contact_status">Status</SelectItem>
                              <SelectItem value="referred_by_text">Referred By</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-6">
                      <Button variant="outline" onClick={() => setStep('upload')}>
                        Back
                      </Button>
                      <Button onClick={processData}>
                        Next: Review
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Duplicate Handling Option */}
                <Card>
                  <CardHeader>
                    <CardTitle>Duplicate Handling</CardTitle>
                    <CardDescription>
                      How should we handle contacts with existing email addresses?
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={duplicateHandling}
                      onValueChange={(value) => setDuplicateHandling(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip duplicates</SelectItem>
                        <SelectItem value="update">Update existing contacts</SelectItem>
                        <SelectItem value="create">Create new contacts anyway</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Import</CardTitle>
                    <CardDescription>
                      Review the data before importing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{processedData.length}</div>
                          <p className="text-xs text-muted-foreground">Valid Contacts</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                          <p className="text-xs text-muted-foreground">Warnings</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-600">
                            {validationIssues.filter(i => !i.issue.includes('will be created')).length}
                          </div>
                          <p className="text-xs text-muted-foreground">Errors</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Validation Issues */}
                    {validationIssues.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Validation Issues:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {validationIssues.map((issue, index) => (
                              <li key={index} className="text-sm">
                                Row {issue.row}: {issue.issue}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Preview */}
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedData.slice(0, 5).map((contact, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {contact.first_name} {contact.last_name}
                              </TableCell>
                              <TableCell>{contact.email}</TableCell>
                              <TableCell>{contact.phone}</TableCell>
                              <TableCell>{contact.title}</TableCell>
                              <TableCell>{contact.contact_status || 'new'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {processedData.length > 5 && (
                        <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                          And {processedData.length - 5} more...
                        </div>
                      )}
                    </div>

                    {/* Import Options */}
                    <div className="space-y-4 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="duplicate-handling">Duplicate Handling</Label>
                        <Select value={duplicateHandling} onValueChange={setDuplicateHandling as any}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip">Skip Duplicates</SelectItem>
                            <SelectItem value="update">Update Existing</SelectItem>
                            <SelectItem value="create">Create New</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Contacts will only be imported if referenced DSPs and Stations exist in the system. 
                          Set up your organization hierarchy first in the Organization tab.
                        </AlertDescription>
                      </Alert>
                    </div>

                    <div className="flex items-center justify-between">
                      <Button variant="outline" onClick={() => setStep('map')}>
                        Back
                      </Button>
                      <Button 
                        onClick={importContacts}
                        disabled={processedData.length === 0}
                      >
                        Import {processedData.length} Contacts
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Importing */}
            {step === 'import' && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-medium">Importing Contacts...</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please don't close this window
                        </p>
                      </div>
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-center text-sm text-muted-foreground">
                        {Math.round(importProgress)}% complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Import Complete</CardTitle>
                    <CardDescription>
                      Your contacts have been imported successfully
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Results Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="text-2xl font-bold">{successCount}</div>
                              <p className="text-xs text-muted-foreground">Successfully Imported</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <div>
                              <div className="text-2xl font-bold">{failureCount}</div>
                              <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Error Details */}
                    {failureCount > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Import Errors:</strong>
                          <ul className="list-disc list-inside mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {importResults
                              .filter(r => !r.success)
                              .slice(0, 10)
                              .map((result, index) => (
                                <li key={index} className="text-sm">
                                  Row {result.row}: {result.error}
                                </li>
                              ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Add missing Table imports at the top of the file
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';