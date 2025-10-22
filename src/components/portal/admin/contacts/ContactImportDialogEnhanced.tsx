import React, { useState, useCallback, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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
  Eye,
  EyeOff,
  AlertTriangle,
  UserCheck,
  UserX,
  UserPlus,
  Database,
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
  action?: 'created' | 'updated' | 'skipped';
}

interface ValidationIssue {
  row: number;
  field: string;
  value: any;
  issue: string;
}

interface ImportPreview {
  totalRows: number;
  validContacts: number;
  duplicates: number;
  newDSPs: number;
  existingDSPs: number;
  missingInfo: number;
  byStatus: Record<string, number>;
  potentialDuplicates: Array<{
    row: number;
    importData: ContactFormData;
    existingContact: any;
    matchScore: number;
    matchReasons: string[];
  }>;
  newDSPsList: Array<{
    dsp_code: string;
    dsp_name: string;
    station: string;
    rows: number[];
  }>;
  newContactsList: Array<{
    row: number;
    data: ContactFormData & { _dsp_name?: string; _dsp_code?: string; _station_ref?: string };
  }>;
}

export function ContactImportDialogEnhanced({ open, onClose, onImportComplete }: ContactImportDialogProps) {
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
  const [duplicateHandling, setDuplicateHandling] = useState<'skip' | 'update' | 'smart'>('smart');
  const [isDragging, setIsDragging] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<number>>(new Set());
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [selectedDSPs, setSelectedDSPs] = useState<Set<string>>(new Set());
  const [showFinalReview, setShowFinalReview] = useState(false);
  const [reviewTab, setReviewTab] = useState<'contacts' | 'dsps'>('contacts');
  
  const { contacts, refetch: refetchContacts } = useContacts();
  const { markets } = useMarkets();
  const { stations } = useStations();
  const { dsps, refetch: refetchDSPs } = useDSPs();
  
  // Reset dialog when opened
  React.useEffect(() => {
    if (open) {
      // Reset to initial state when dialog opens
      setStep('upload');
      setFile(null);
      setRawData([]);
      setHeaders([]);
      setMappings({});
      setProcessedData([]);
      setImportResults([]);
      setImporting(false);
      setImportProgress(0);
      setValidationIssues([]);
      setImportPreview(null);
      setShowFinalReview(false);
      setSelectedContacts(new Set());
      setSelectedDSPs(new Set());
      setReviewTab('contacts');
      setShowDuplicateDetails(false);
      setSelectedDuplicates(new Set());
    }
  }, [open]);
  
  // Format phone number to (xxx) xxx-xxxx
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      const number = cleaned.slice(1);
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    
    return phone;
  };
  
  // Fuzzy matching for duplicate detection
  const calculateMatchScore = (contact1: any, contact2: any): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];
    
    // Email match (highest weight - definitive duplicate)
    if (contact1.email && contact2.email) {
      const email1 = contact1.email.toLowerCase().trim();
      const email2 = contact2.email.toLowerCase().trim();
      if (email1 === email2) {
        score += 80; // Increased weight - email is unique identifier
        reasons.push('Email matches exactly');
      }
    }
    
    // Phone match (high weight - very likely duplicate)
    if (contact1.phone && contact2.phone) {
      const phone1 = contact1.phone.replace(/\D/g, '');
      const phone2 = contact2.phone.replace(/\D/g, '');
      if (phone1 && phone2) {
        // Handle cases where one has country code and other doesn't
        const normalizedPhone1 = phone1.length === 11 && phone1[0] === '1' ? phone1.slice(1) : phone1;
        const normalizedPhone2 = phone2.length === 11 && phone2[0] === '1' ? phone2.slice(1) : phone2;
        
        if (normalizedPhone1 === normalizedPhone2 && normalizedPhone1.length >= 10) {
          score += 70; // Increased weight - phone is unique identifier
          reasons.push('Phone number matches');
        }
      }
    }
    
    // Name match (fuzzy)
    const fname1 = (contact1.first_name || '').toLowerCase().trim();
    const fname2 = (contact2.first_name || '').toLowerCase().trim();
    const lname1 = (contact1.last_name || '').toLowerCase().trim();
    const lname2 = (contact2.last_name || '').toLowerCase().trim();
    
    if (fname1 && fname2) {
      if (fname1 === fname2) {
        score += 15;
        reasons.push('First name matches');
      } else if (fname1.includes(fname2) || fname2.includes(fname1)) {
        score += 8;
        reasons.push('First name partially matches');
      }
    }
    
    if (lname1 && lname2) {
      if (lname1 === lname2) {
        score += 15;
        reasons.push('Last name matches');
      } else if (lname1.includes(lname2) || lname2.includes(lname1)) {
        score += 8;
        reasons.push('Last name partially matches');
      }
    }
    
    // Full name check (catches "John Doe" vs separate fields)
    const fullName1 = `${fname1} ${lname1}`.trim();
    const fullName2 = `${fname2} ${lname2}`.trim();
    if (fullName1 && fullName2 && fullName1 === fullName2 && score < 30) {
      score += 30;
      reasons.push('Full name matches');
    }
    
    // DSP match
    if (contact1.dsp_id && contact2.dsp_id && contact1.dsp_id === contact2.dsp_id) {
      score += 10;
      reasons.push('Same DSP');
    }
    
    return { score, reasons };
  };

  // Field mapping suggestions
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
    console.log('Processing file:', uploadedFile.name, 'Size:', uploadedFile.size);
    setFile(uploadedFile);
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(uploadedFile, {
        complete: (result) => {
          const data = result.data as ImportRow[];
          console.log('CSV parsed, rows:', data.length, 'First row:', data[0]);
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

  // Initialize mappings
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

  // Initialize selection state when preview is generated
  const initializeSelections = (preview: ImportPreview) => {
    // Select all non-duplicate contacts by default
    const contactsToSelect = new Set<number>();
    const duplicateRows = new Set(preview.potentialDuplicates
      .filter(dup => dup.matchScore >= 70) // High confidence duplicates
      .map(dup => dup.row - 1));
    
    preview.newContactsList.forEach(({ row }) => {
      if (!duplicateRows.has(row - 1)) {
        contactsToSelect.add(row - 1);
      }
    });
    
    setSelectedContacts(contactsToSelect);
    
    // Select all DSPs by default
    const dspsToSelect = new Set<string>();
    preview.newDSPsList.forEach((dsp, idx) => {
      dspsToSelect.add(`dsp-${idx}`);
    });
    setSelectedDSPs(dspsToSelect);
  };

  // Generate import preview
  const generateImportPreview = async (data: ContactFormData[]): Promise<ImportPreview> => {
    const preview: ImportPreview = {
      totalRows: data.length,
      validContacts: 0,
      duplicates: 0,
      newDSPs: 0,
      existingDSPs: 0,
      missingInfo: 0,
      byStatus: {},
      potentialDuplicates: [],
      newDSPsList: [],
      newContactsList: [],
    };
    
    const dspMap = new Map<string, { dsp_code: string; dsp_name: string; station: string; rows: number[] }>();
    const processedDuplicates = new Set<number>();
    
    for (let i = 0; i < data.length; i++) {
      const contact = data[i] as any;
      
      // Count by status
      const status = contact.contact_status || 'new';
      preview.byStatus[status] = (preview.byStatus[status] || 0) + 1;
      
      // Check if has basic info
      if (!contact.email && !contact.phone && !contact.first_name && !contact.last_name) {
        preview.missingInfo++;
      } else {
        preview.validContacts++;
      }
      
      // Track DSPs
      if (contact._dsp_name || contact._dsp_code) {
        // Normalize DSP key - use lowercase and trim to catch duplicates better
        const normalizedName = (contact._dsp_name || '').toLowerCase().trim();
        const normalizedCode = (contact._dsp_code || '').toLowerCase().trim();
        const stationKey = contact.station_id || contact._station_ref || '';
        
        // Create key based on available identifiers - prioritize name over code
        let dspKey = '';
        if (normalizedName) {
          dspKey = `name:${normalizedName}_station:${stationKey}`;
        } else if (normalizedCode) {
          dspKey = `code:${normalizedCode}_station:${stationKey}`;
        }
        
        const existingDsp = dsps.find(d => 
          (contact._dsp_name && d.dsp_name?.toLowerCase() === contact._dsp_name.toLowerCase()) ||
          (contact._dsp_code && d.dsp_code?.toLowerCase() === contact._dsp_code.toLowerCase())
        );
        
        if (!existingDsp && dspKey) {
          // Check if we already found this DSP in the import data
          let existingMapEntry = null;
          for (const [key, value] of dspMap.entries()) {
            const mapName = value.dsp_name.toLowerCase().trim();
            const mapCode = value.dsp_code.toLowerCase().trim();
            
            // Match by name OR code (both should be considered the same DSP)
            if ((normalizedName && mapName === normalizedName) ||
                (normalizedCode && mapCode === normalizedCode)) {
              existingMapEntry = key;
              break;
            }
          }
          
          if (!existingMapEntry) {
            const station = stations.find(s => s.id === contact.station_id);
            dspMap.set(dspKey, {
              dsp_code: contact._dsp_code || '',
              dsp_name: contact._dsp_name || `DSP ${contact._dsp_code || 'Unknown'}`,
              station: station ? `${station.station_code} - ${station.city}, ${station.state}` : stationKey || 'No Station',
              rows: [i + 1]
            });
            preview.newDSPs++;
          } else {
            dspMap.get(existingMapEntry)!.rows.push(i + 1);
          }
        } else {
          preview.existingDSPs++;
        }
      }
      
      // Check for duplicates - both within import data and against existing contacts
      if (!processedDuplicates.has(i)) {
        // First check against existing contacts in database
        for (const existing of contacts) {
          const { score, reasons } = calculateMatchScore(contact, existing);
          if (score >= 30) { // Lower threshold for better detection
            preview.potentialDuplicates.push({
              row: i + 1,
              importData: contact,
              existingContact: existing,
              matchScore: score,
              matchReasons: [...reasons, 'Existing contact in database'],
            });
            processedDuplicates.add(i);
            if (score >= 40) {
              preview.duplicates++;
            }
            break;
          }
        }
        
        // Also check for duplicates within the import data itself
        if (!processedDuplicates.has(i)) {
          for (let j = 0; j < i; j++) {
            if (processedDuplicates.has(j)) continue;
            const otherContact = data[j] as any;
            const { score, reasons } = calculateMatchScore(contact, otherContact);
            if (score >= 30) {
              preview.potentialDuplicates.push({
                row: i + 1,
                importData: contact,
                existingContact: {
                  ...otherContact,
                  id: `import-row-${j + 1}`,
                  first_name: otherContact.first_name || '',
                  last_name: otherContact.last_name || '',
                  email: otherContact.email || '',
                  phone: otherContact.phone || '',
                },
                matchScore: score,
                matchReasons: [...reasons, `Duplicate of row ${j + 1} in import`],
              });
              processedDuplicates.add(i);
              if (score >= 40) {
                preview.duplicates++;
              }
              break;
            }
          }
        }
      }
      
      // Track new contacts (non-duplicates)
      const isDuplicate = preview.potentialDuplicates.some(dup => dup.row === i + 1 && dup.matchScore >= 50);
      if (!isDuplicate && (contact.email || contact.phone || contact.first_name || contact.last_name || contact.dsp_id)) {
        preview.newContactsList.push({
          row: i + 1,
          data: contact
        });
      }
    }
    
    // Convert DSP map to list
    preview.newDSPsList = Array.from(dspMap.values());
    
    return preview;
  };

  // Process and validate data
  const processData = async () => {
    const processed: ContactFormData[] = [];
    const issues: ValidationIssue[] = [];
    
    rawData.forEach((row, index) => {
      const contact: ContactFormData = {};
      let hasValidData = false;
      
      Object.entries(mappings).forEach(([column, mapping]) => {
        if (mapping.targetField !== 'skip' && row[column]) {
          const value = row[column];
          
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
            case 'dsp_code':
            case 'dsp_name':
              const fieldName = mapping.targetField === 'dsp_id' ? '_dsp_ref' :
                               mapping.targetField === 'dsp_code' ? '_dsp_code' : '_dsp_name';
              (contact as any)[fieldName] = String(value).trim();
              break;
              
            case 'station_id':
              const stationValue = String(value).trim();
              const station = stations.find(s => 
                s.station_code?.toLowerCase() === stationValue.toLowerCase()
              );
              if (station) {
                contact.station_id = station.id;
                if (station.market_id) {
                  contact.market_id = station.market_id;
                }
              }
              (contact as any)._station_ref = stationValue;
              break;
              
            case 'phone':
              contact.phone = formatPhoneNumber(String(value));
              break;
              
            default:
              (contact as any)[mapping.targetField] = value;
              break;
          }
          
          hasValidData = true;
        }
      });
      
      // More flexible validation
      const hasContactInfo = contact.email || contact.phone || (contact.first_name && contact.last_name);
      const hasDspInfo = (contact as any)._dsp_name || (contact as any)._dsp_code || contact.dsp_id;
      
      if (!hasContactInfo && !hasDspInfo) {
        issues.push({
          row: index + 1,
          field: 'identifier',
          value: '',
          issue: 'Row must have at least some identifying information',
        });
      } else if (hasValidData) {
        if (!contact.contact_status) {
          contact.contact_status = 'new';
        }
        
        if (!hasContactInfo && hasDspInfo) {
          const dspIdentifier = (contact as any)._dsp_name || (contact as any)._dsp_code || 'DSP';
          contact.notes = (contact.notes ? contact.notes + '\n' : '') + 
            `[Placeholder entry - ${dspIdentifier} known but no contact details yet]`;
        }
        
        processed.push(contact);
      }
    });
    
    setProcessedData(processed);
    setValidationIssues(issues);
    
    const preview = await generateImportPreview(processed);
    setImportPreview(preview);
    initializeSelections(preview);
    
    setStep('review');
  };

  // Import only selected items
  const importSelectedItems = async () => {
    if (!importPreview) return;
    
    // Get the actual rows that are selected from the newContactsList
    const selectedContactRows = importPreview.newContactsList
      .filter((_, idx) => selectedContacts.has(idx))
      .map(item => item.row - 1); // Convert to 0-based index for processedData
    
    // Filter processed data to only include selected contact rows
    const selectedData = processedData.filter((_, idx) => selectedContactRows.includes(idx));
    
    // Get selected DSPs to create
    const selectedDspIndices = Array.from(selectedDSPs).map(key => parseInt(key.split('-')[1]));
    const selectedDspsToCreate = importPreview.newDSPsList.filter((_, idx) => selectedDspIndices.includes(idx));
    
    // Import with filtered data and DSP list
    await importContacts(selectedData, selectedDspsToCreate);
  };

  // Import contacts with smart duplicate handling
  const importContacts = async (dataToImport?: ContactFormData[], dspsToCreate?: Array<{
    dsp_code: string;
    dsp_name: string;
    station: string;
    rows: number[];
  }>) => {
    const data = dataToImport || processedData;
    setImporting(true);
    setStep('import'); // Move to import step to show progress
    setImportProgress(0);
    const results: ImportResult[] = [];
    const dspCache = new Map<string, string>();
    
    // First, create all selected DSPs
    if (dspsToCreate && dspsToCreate.length > 0) {
      console.log(`Creating ${dspsToCreate.length} DSPs...`);
      for (const dspToCreate of dspsToCreate) {
        try {
          // Check if DSP already exists
          const existingDsp = dsps.find(d => 
            (dspToCreate.dsp_code && d.dsp_code?.toLowerCase() === dspToCreate.dsp_code.toLowerCase()) ||
            (dspToCreate.dsp_name && d.dsp_name?.toLowerCase() === dspToCreate.dsp_name.toLowerCase())
          );
          
          if (existingDsp) {
            console.log(`DSP already exists: ${existingDsp.dsp_name}`);
            const cacheKey = `${dspToCreate.dsp_code || ''}_${dspToCreate.dsp_name || ''}_`;
            dspCache.set(cacheKey, existingDsp.id);
          } else {
            // Create the DSP
            let dspCode = dspToCreate.dsp_code || '';
            let dspName = dspToCreate.dsp_name || '';
            
            // Generate code if missing but name exists
            if (!dspCode && dspName) {
              const initials = dspName
                .split(' ')
                .map((w: string) => w[0])
                .join('')
                .toUpperCase();
              const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
              dspCode = `${initials}${suffix}`;
            }
            
            // Use code as name if name is missing
            if (!dspName && dspCode) {
              dspName = `DSP ${dspCode}`;
            }
            
            const newDsp = await contactTrackingService.createDSP({
              dsp_code: dspCode,
              dsp_name: dspName,
              is_active: true,
            });
            
            console.log(`Created DSP: ${dspName} (${dspCode}) with ID: ${newDsp.id}`);
            const cacheKey = `${dspToCreate.dsp_code || ''}_${dspToCreate.dsp_name || ''}_`;
            dspCache.set(cacheKey, newDsp.id);
          }
        } catch (error) {
          console.error(`Failed to create DSP ${dspToCreate.dsp_name}:`, error);
        }
      }
      
      // Refresh DSPs list after creation
      await refetchDSPs();
    }
    
    // Calculate total items for progress
    const totalItems = data.length + (dspsToCreate?.length || 0);
    let processedItems = dspsToCreate?.length || 0;
    
    for (let i = 0; i < data.length; i++) {
      const contact = data[i] as any;
      processedItems++;
      const progress = (processedItems / totalItems) * 100;
      setImportProgress(progress);
      
      try {
        // Handle DSP creation
        if (!contact.dsp_id && (contact._dsp_name || contact._dsp_code)) {
          const dspKey = `${contact._dsp_code || ''}_${contact._dsp_name || ''}_${contact.station_id || ''}`;
          
          if (dspCache.has(dspKey)) {
            contact.dsp_id = dspCache.get(dspKey);
          } else {
            // Check for existing DSP by code OR name (with station consideration)
            const existingDsp = dsps.find(d => {
              const stationMatch = !contact.station_id || d.station_id === contact.station_id;
              const codeMatch = contact._dsp_code && d.dsp_code?.toLowerCase() === contact._dsp_code.toLowerCase();
              const nameMatch = contact._dsp_name && d.dsp_name?.toLowerCase() === contact._dsp_name.toLowerCase();
              
              // Match by code first (more precise), then by name
              return stationMatch && (codeMatch || nameMatch);
            });
            
            if (existingDsp) {
              console.log(`Found existing DSP: ${existingDsp.dsp_name} with ID: ${existingDsp.id}`);
              contact.dsp_id = existingDsp.id;
              dspCache.set(dspKey, existingDsp.id);
              
              // Update DSP if we have new information
              if ((contact._dsp_name && !existingDsp.dsp_name) || 
                  (contact._dsp_code && !existingDsp.dsp_code)) {
                try {
                  await contactTrackingService.updateDSP(existingDsp.id, {
                    dsp_code: contact._dsp_code || existingDsp.dsp_code,
                    dsp_name: contact._dsp_name || existingDsp.dsp_name,
                  });
                } catch (updateError) {
                  console.warn('Failed to update DSP with new information:', updateError);
                }
              }
            } else if (contact._dsp_name || contact._dsp_code) {
              // Create new DSP if we have at least a name or code
              try {
                let dspCode = contact._dsp_code || '';
                let dspName = contact._dsp_name || '';
                
                // Generate code if missing but name exists
                if (!dspCode && dspName) {
                  const initials = dspName
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase();
                  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                  dspCode = `${initials}${suffix}`;
                }
                
                // Use code as name if name is missing
                if (!dspName && dspCode) {
                  dspName = `DSP ${dspCode}`;
                }
                
                const newDsp = await contactTrackingService.createDSP({
                  dsp_code: dspCode,
                  dsp_name: dspName,
                  station_id: contact.station_id || undefined,
                  is_active: true,
                });
                console.log(`Created DSP: ${dspName} (${dspCode}) with ID: ${newDsp.id}`);
                contact.dsp_id = newDsp.id;
                dspCache.set(dspKey, newDsp.id);
                console.log(`Set contact.dsp_id to: ${contact.dsp_id}`);
              } catch (dspError: any) {
                console.warn(`Failed to create DSP for row ${i + 1}:`, dspError);
                const dspIdentifier = contact._dsp_name || contact._dsp_code || 'Unknown';
                contact.notes = (contact.notes ? contact.notes + '\n' : '') + 
                  `[DSP "${dspIdentifier}" needs manual creation]`;
              }
            }
          }
        }
        
        // Check for duplicates
        let existingContact = null;
        let matchScore = 0;
        
        if (contact.email || contact.phone || (contact.first_name && contact.last_name)) {
          for (const existing of contacts) {
            const { score } = calculateMatchScore(contact, existing);
            if (score >= 50) {
              existingContact = existing;
              matchScore = score;
              break;
            }
          }
        }
        
        // Handle based on duplicate strategy
        if (existingContact) {
          if (duplicateHandling === 'skip' || (duplicateHandling === 'smart' && selectedDuplicates.has(i))) {
            results.push({
              success: false,
              row: i + 1,
              data: contact,
              error: `Duplicate detected (${matchScore}% match) - skipped`,
              action: 'skipped',
            });
            continue;
          } else if (duplicateHandling === 'update' || (duplicateHandling === 'smart' && !selectedDuplicates.has(i))) {
            try {
              // Merge data intelligently
              const updateData: any = {};
              Object.keys(contact).forEach(key => {
                if (contact[key] && !key.startsWith('_')) {
                  updateData[key] = contact[key];
                }
              });
              
              const updatedContact = await contactTrackingService.updateContact(existingContact.id, updateData);
              results.push({
                success: true,
                row: i + 1,
                data: contact,
                contact: updatedContact,
                action: 'updated',
              });
              continue;
            } catch (updateError) {
              results.push({
                success: false,
                row: i + 1,
                data: contact,
                error: `Failed to update: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
                action: 'skipped',
              });
              continue;
            }
          }
        }
        
        // Clean up temporary fields
        delete contact._dsp_name;
        delete contact._dsp_code;
        delete contact._dsp_ref;
        delete contact._station_ref;
        
        // Ensure valid data
        if (!contact.email && !contact.phone && !contact.first_name && !contact.last_name) {
          if (contact.dsp_id) {
            contact.first_name = '[Unknown]';
            contact.notes = (contact.notes ? contact.notes + '\n' : '') + 
              '[Placeholder - Contact details needed]';
          } else {
            results.push({
              success: false,
              row: i + 1,
              data: contact,
              error: 'No valid contact or DSP information',
              action: 'skipped',
            });
            continue;
          }
        }
        
        // Create the contact
        console.log(`Creating contact for row ${i + 1} with dsp_id: ${contact.dsp_id}, station_id: ${contact.station_id}`);
        const newContact = await contactTrackingService.createContact(contact);
        console.log(`Created contact with ID: ${newContact.id}, actual dsp_id: ${newContact.dsp_id}`);
        results.push({
          success: true,
          row: i + 1,
          data: contact,
          contact: newContact,
          action: 'created',
        });
      } catch (error) {
        results.push({
          success: false,
          row: i + 1,
          data: contact,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'skipped',
        });
      }
    }
    
    setImportResults(results);
    setImporting(false);
    setStep('complete');
    
    refetchContacts();
    refetchDSPs();
    // Don't call onImportComplete here - wait for user to close the dialog
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Email': 'john.doe@example.com',
        'Phone': '555-0123',
        'Title': 'Owner',
        'DSP Code': 'DSP001',
        'DSP Name': 'Lightning Logistics',
        'Station Code': 'DCA1',
        'Status': 'new',
        'Tags': 'vip, fleet-owner',
        'Notes': 'Primary contact for operations',
        'Referred By': 'Jane Smith',
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

  // File handling
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  }, [processFile]);

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

  // Calculate stats
  const successCount = importResults.filter(r => r.success).length;
  const failureCount = importResults.filter(r => !r.success).length;
  const createdCount = importResults.filter(r => r.action === 'created').length;
  const updatedCount = importResults.filter(r => r.action === 'updated').length;
  const skippedCount = importResults.filter(r => r.action === 'skipped').length;

  // Debug logging
  console.log('Import Dialog State:', {
    step,
    hasFile: !!file,
    rawDataLength: rawData.length,
    processedDataLength: processedData.length,
    headers,
    firstRawRow: rawData[0],
    firstProcessedRow: processedData[0],
  });

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Only allow closing if not currently importing
      if (!importing && !newOpen) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onPointerDownOutside={(e) => {
        // Prevent closing by clicking outside during import
        if (importing) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Enhanced Contact Import</DialogTitle>
          <DialogDescription>
            Import contacts with intelligent duplicate detection and data validation
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
            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    "hover:border-primary hover:bg-primary/5 cursor-pointer"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragging ? 'Drop your file here' : 'Click or drag file to upload'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports CSV and Excel files (.csv, .xlsx, .xls)
                  </p>
                  
                  {file && (
                    <div className="mt-4 p-3 bg-muted rounded-lg inline-block">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  )}
                </div>

                {/* Template Download */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Need a template?</CardTitle>
                    <CardDescription>
                      Download our template with all available fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={downloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV Template
                    </Button>
                  </CardContent>
                </Card>

                {/* Instructions */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Import Instructions:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Ensure your file has headers in the first row</li>
                      <li>• Markets, Stations, and DSPs will be created automatically if needed</li>
                      <li>• Phone numbers will be formatted automatically</li>
                      <li>• Duplicate detection will help prevent creating duplicate contacts</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Mapping Step */}
            {step === 'map' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Map Your Columns</CardTitle>
                    <CardDescription>
                      Match your spreadsheet columns to contact fields
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {headers.map(header => (
                        <div key={header} className="flex items-center gap-4">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{header}</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sample: {rawData[0]?.[header] || '(empty)'}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={mappings[header]?.targetField || 'skip'}
                            onValueChange={(value) => updateMapping(header, value as any)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip">Skip this column</SelectItem>
                              <SelectItem value="first_name">First Name</SelectItem>
                              <SelectItem value="last_name">Last Name</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="title">Title</SelectItem>
                              <SelectItem value="dsp_code">DSP Code</SelectItem>
                              <SelectItem value="dsp_name">DSP Name</SelectItem>
                              <SelectItem value="station_id">Station Code</SelectItem>
                              <SelectItem value="contact_status">Status</SelectItem>
                              <SelectItem value="tags">Tags</SelectItem>
                              <SelectItem value="notes">Notes</SelectItem>
                              <SelectItem value="referred_by_text">Referred By</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Validation Issues */}
                {validationIssues.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation Issues Found:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {validationIssues.slice(0, 5).map((issue, idx) => (
                          <li key={idx}>
                            Row {issue.row}: {issue.field} - {issue.issue}
                          </li>
                        ))}
                        {validationIssues.length > 5 && (
                          <li>...and {validationIssues.length - 5} more issues</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && importPreview && !showFinalReview && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Rows</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{importPreview.totalRows}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Valid Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{importPreview.validContacts}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Likely Duplicates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-yellow-600">{importPreview.duplicates}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">New DSPs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">{importPreview.newDSPs}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Selection Summary Bar */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">Selected for import:</span>
                        <Badge variant="secondary">
                          {selectedContacts.size} contacts
                        </Badge>
                        <Badge variant="secondary">
                          {selectedDSPs.size} DSPs
                        </Badge>
                        {importPreview.duplicates > 0 && (
                          <>
                            <div className="h-4 w-px bg-gray-300" />
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Duplicates:</span>
                              <Select value={duplicateHandling} onValueChange={(v: any) => setDuplicateHandling(v)}>
                                <SelectTrigger className="h-8 w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="skip">Skip</SelectItem>
                                  <SelectItem value="update">Update</SelectItem>
                                  <SelectItem value="smart">Smart</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (reviewTab === 'contacts') {
                              setSelectedContacts(new Set(importPreview.newContactsList.map((_, idx) => idx)));
                            } else {
                              setSelectedDSPs(new Set(importPreview.newDSPsList.map((_, idx) => `dsp-${idx}`)));
                            }
                          }}
                        >
                          Select All {reviewTab === 'contacts' ? 'Contacts' : 'DSPs'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (reviewTab === 'contacts') {
                              setSelectedContacts(new Set());
                            } else {
                              setSelectedDSPs(new Set());
                            }
                          }}
                        >
                          Deselect All {reviewTab === 'contacts' ? 'Contacts' : 'DSPs'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs for DSPs and Contacts */}
                <Tabs value={reviewTab} onValueChange={(value) => setReviewTab(value as 'contacts' | 'dsps')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contacts" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contacts ({importPreview.newContactsList.length})
                      {importPreview.duplicates > 0 && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {importPreview.duplicates} duplicates
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="dsps" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      DSPs ({importPreview.newDSPsList.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* DSPs Tab */}
                  <TabsContent value="dsps">
                {importPreview.newDSPsList.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-blue-600" />
                            New DSPs to be Created ({importPreview.newDSPsList.length})
                          </CardTitle>
                          <CardDescription>
                            These DSPs will be created during import
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-blue-600">
                          {importPreview.newDSPsList.length} DSPs
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {importPreview.newDSPsList.map((dsp, idx) => {
                            const dspKey = `dsp-${idx}`;
                            const isSelected = selectedDSPs.has(dspKey);
                            
                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "flex items-center gap-3 p-3 border rounded-lg transition-colors",
                                  isSelected ? "bg-white hover:bg-muted/30" : "bg-gray-50 opacity-60"
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedDSPs);
                                    if (checked) {
                                      newSet.add(dspKey);
                                    } else {
                                      newSet.delete(dspKey);
                                    }
                                    setSelectedDSPs(newSet);
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <p className="font-medium">
                                        {dsp.dsp_name || `DSP ${dsp.dsp_code}`}
                                      </p>
                                      {dsp.dsp_code && (
                                        <p className="text-sm text-muted-foreground">
                                          Code: {dsp.dsp_code}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {dsp.station || 'No Station'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className="text-xs">
                                    {dsp.rows.length} contact{dsp.rows.length !== 1 ? 's' : ''}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Rows: {dsp.rows.join(', ')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No new DSPs to create
                      </div>
                    )}
                  </TabsContent>

                  {/* Contacts Tab */}
                  <TabsContent value="contacts">
                    {importPreview.newContactsList.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-green-600" />
                            New Contacts to be Imported ({importPreview.newContactsList.length})
                          </CardTitle>
                          <CardDescription>
                            These contacts will be added to the system
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {importPreview.newContactsList.length} Contacts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-2">
                          {importPreview.newContactsList.map(({ row, data }, idx) => {
                            const isSelected = selectedContacts.has(idx);
                            const duplicate = importPreview.potentialDuplicates.find(dup => dup.row === row);
                            const isDuplicate = duplicate && duplicate.matchScore >= 70;
                            
                            return (
                              <div 
                                key={idx} 
                                className={cn(
                                  "flex items-start gap-3 p-3 border rounded-lg transition-colors",
                                  isDuplicate 
                                    ? "bg-yellow-50 border-yellow-300" 
                                    : isSelected 
                                      ? "bg-white hover:bg-muted/30" 
                                      : "bg-gray-50 opacity-60"
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedContacts);
                                    if (checked) {
                                      newSet.add(idx);
                                    } else {
                                      newSet.delete(idx);
                                    }
                                    setSelectedContacts(newSet);
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="text-xs">Row {row}</Badge>
                                    {data.contact_status && (
                                      <Badge variant="secondary" className="text-xs">
                                        {data.contact_status}
                                      </Badge>
                                    )}
                                    {data.title && (
                                      <Badge variant="outline" className="text-xs">
                                        {data.title}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    {(data.first_name || data.last_name) && (
                                      <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="ml-2 font-medium">
                                          {data.first_name} {data.last_name}
                                        </span>
                                      </div>
                                    )}
                                    {data.email && (
                                      <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="ml-2">{data.email}</span>
                                      </div>
                                    )}
                                    {data.phone && (
                                      <div>
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="ml-2">{data.phone}</span>
                                      </div>
                                    )}
                                    {(data as any)._dsp_name && (
                                      <div>
                                        <span className="text-muted-foreground">DSP:</span>
                                        <span className="ml-2">{(data as any)._dsp_name}</span>
                                      </div>
                                    )}
                                    {(data as any)._dsp_code && !(data as any)._dsp_name && (
                                      <div>
                                        <span className="text-muted-foreground">DSP Code:</span>
                                        <span className="ml-2">{(data as any)._dsp_code}</span>
                                      </div>
                                    )}
                                    {(data as any)._station_ref && (
                                      <div>
                                        <span className="text-muted-foreground">Station:</span>
                                        <span className="ml-2">{(data as any)._station_ref}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {data.notes && (
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground italic">{data.notes}</p>
                                    </div>
                                  )}
                                  
                                  {duplicate && (
                                    <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                                      <div className="flex items-center gap-1 text-yellow-800">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span className="font-medium">
                                          {duplicate.matchScore}% match with existing contact
                                        </span>
                                      </div>
                                      <div className="text-yellow-700 mt-1">
                                        {duplicate.matchReasons.join(', ')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No contacts to import
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

              </div>
            )}

            {/* Final Review Step - Show selected items */}
            {step === 'review' && showFinalReview && importPreview && (
              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Final Review:</strong> These are the items that will be imported. 
                    Click "Import Now" to proceed or "Back" to adjust your selection.
                  </AlertDescription>
                </Alert>

                {/* Summary of what will be imported */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Contacts to Import</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">{selectedContacts.size}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">DSPs to Create</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-blue-600">{selectedDSPs.size}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Selected DSPs */}
                {selectedDSPs.size > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">DSPs to be Created</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {importPreview.newDSPsList
                          .filter((_, idx) => selectedDSPs.has(`dsp-${idx}`))
                          .map((dsp, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border rounded">
                              <span className="font-medium">{dsp.dsp_name || `DSP ${dsp.dsp_code}`}</span>
                              <Badge variant="outline" className="text-xs">
                                {dsp.station || 'No Station'}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Selected Contacts */}
                {selectedContacts.size > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Contacts to be Imported</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {importPreview.newContactsList
                            .filter((_, idx) => selectedContacts.has(idx))
                            .map(({ row, data }, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {data.first_name} {data.last_name}
                                  </span>
                                  {data.email && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {data.email}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Row {row}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

            {/* Import Progress */}
            {step === 'import' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Importing Contacts...
                    </CardTitle>
                    <CardDescription>
                      Please wait while we process your import
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        {Math.round(importProgress)}% Complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Import Complete */}
            {step === 'complete' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      Import Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{createdCount}</p>
                        <p className="text-sm text-muted-foreground">Created</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600">{updatedCount}</p>
                        <p className="text-sm text-muted-foreground">Updated</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600">{skippedCount}</p>
                        <p className="text-sm text-muted-foreground">Skipped</p>
                      </div>
                    </div>

                    {failureCount > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {failureCount} contact(s) failed to import. Review the details below.
                        </AlertDescription>
                      </Alert>
                    )}

                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {importResults.map((result, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg",
                              result.success ? "bg-green-50" : "bg-red-50"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">Row {result.row}</span>
                              {result.action && (
                                <Badge variant="outline" className="text-xs">
                                  {result.action}
                                </Badge>
                              )}
                            </div>
                            {result.error && (
                              <span className="text-xs text-red-600">{result.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Action Buttons - Outside ScrollArea for proper sticky behavior */}
        {step === 'review' && importPreview && !showFinalReview && (
          <div className="border-t p-4 bg-background">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('map')}>
                Back to Mapping
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedContacts.size} contacts, {selectedDSPs.size} DSPs selected
                </span>
                <Button 
                  onClick={() => setShowFinalReview(true)} 
                  disabled={selectedContacts.size === 0 && selectedDSPs.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Continue to Import
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Final Review Action Buttons */}
        {step === 'review' && showFinalReview && importPreview && (
          <div className="border-t p-4 bg-background">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setShowFinalReview(false)}
              >
                Back to Selection
              </Button>
              <Button 
                onClick={() => {
                  setShowFinalReview(false);
                  importSelectedItems();
                }} 
                disabled={importing}
                className="bg-green-600 hover:bg-green-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Now
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Import Progress - No action buttons (can't cancel mid-import) */}
        {step === 'import' && (
          <div className="border-t p-4 bg-background">
            <div className="text-center text-sm text-muted-foreground">
              Please wait while your contacts are being imported...
            </div>
          </div>
        )}
        
        {/* Upload Step Action Buttons */}
        {step === 'upload' && file && (
          <div className="border-t p-4 bg-background">
            <div className="flex justify-end">
              <Button 
                onClick={() => processFile(file)}
                className="bg-green-600 hover:bg-green-700"
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Continue to Mapping
              </Button>
            </div>
          </div>
        )}
        
        {/* Mapping Step Action Buttons */}
        {step === 'map' && (
          <div className="border-t p-4 bg-background">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back to Upload
              </Button>
              <Button 
                onClick={async () => {
                  await processData();
                  setStep('review');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Continue to Review
              </Button>
            </div>
          </div>
        )}
        
        {/* Complete Step Action Buttons */}
        {step === 'complete' && (
          <div className="border-t p-4 bg-background">
            <div className="flex justify-end">
              <Button onClick={() => {
                onImportComplete?.();
                onClose();
              }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}