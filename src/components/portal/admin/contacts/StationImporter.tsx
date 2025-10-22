import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { contactTrackingService } from '@/services/contact-tracking.service';
import { useMarkets } from '@/hooks/useContactTracking';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Loader2,
  Eye,
  Save,
  X
} from 'lucide-react';

interface ParsedStation {
  market_name: string;
  station_code: string;
  city: string;
  state: string;
  zip: string;
  full_address?: string;
  region?: string;
  status?: 'pending' | 'success' | 'error' | 'duplicate';
  message?: string;
}

// US Census Regions data
const US_REGIONS = {
  NE: {
    name: 'Northeast',
    states: ['ME','NH','VT','MA','RI','CT','NY','NJ','PA']
  },
  MW: {
    name: 'Midwest',
    states: ['OH','IN','IL','MI','WI','MN','IA','MO','ND','SD','NE','KS']
  },
  S: {
    name: 'South',
    states: ['DE','MD','DC','VA','WV','NC','SC','GA','FL','KY','TN','AL','MS','AR','LA','OK','TX']
  },
  W: {
    name: 'West',
    states: ['MT','ID','WY','CO','NM','AZ','UT','NV','WA','OR','CA','AK','HI']
  }
};

// Get region code from state
const getRegionFromState = (stateCode: string): string | null => {
  const upperState = stateCode.toUpperCase();
  for (const [code, region] of Object.entries(US_REGIONS)) {
    if (region.states.includes(upperState)) {
      return region.name;
    }
  }
  return null;
};

export function StationImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPhase, setImportPhase] = useState<'idle' | 'markets' | 'stations'>('idle');
  const [parsedData, setParsedData] = useState<ParsedStation[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    duplicates: number;
  }>({ success: 0, failed: 0, duplicates: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { markets } = useMarkets(true); // Include inactive markets

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate required headers
    const requiredHeaders = ['market_name', 'station_code', 'city', 'state', 'zip'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid CSV Format',
        description: `Missing required columns: ${missingHeaders.join(', ')}`
      });
      return;
    }

    const stations: ParsedStation[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const station: ParsedStation = {
        market_name: values[headers.indexOf('market_name')] || '',
        station_code: values[headers.indexOf('station_code')] || '',
        city: values[headers.indexOf('city')] || '',
        state: values[headers.indexOf('state')]?.toUpperCase() || '',
        zip: values[headers.indexOf('zip')] || '',
        full_address: values[headers.indexOf('full_address')] || undefined,
        status: 'pending'
      };

      // Auto-detect region from state
      station.region = getRegionFromState(station.state) || 'Unknown';

      // Basic validation
      if (!station.market_name || !station.station_code || !station.city || !station.state) {
        station.status = 'error';
        station.message = 'Missing required fields';
      } else if (station.state.length !== 2) {
        station.status = 'error';
        station.message = 'State must be 2-letter code';
      } else if (!getRegionFromState(station.state)) {
        station.status = 'error';
        station.message = 'Invalid state code';
      }

      stations.push(station);
    }

    setParsedData(stations);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportPhase('markets');
    
    const results = { success: 0, failed: 0, duplicates: 0 };
    const validStations = parsedData.filter(s => s.status === 'pending');
    
    // PHASE 1: Create all unique markets first
    const uniqueMarketNames = [...new Set(validStations.map(s => s.market_name))];
    const marketMap = new Map<string, any>();
    
    // Get existing markets
    let existingMarkets = await contactTrackingService.getMarkets(true);
    
    for (const marketName of uniqueMarketNames) {
      const existingMarket = existingMarkets.find(m => 
        m.name.toLowerCase() === marketName.toLowerCase()
      );
      
      if (existingMarket) {
        marketMap.set(marketName.toLowerCase(), existingMarket);
      } else {
        try {
          // Determine region from first station with this market
          const firstStation = validStations.find(s => s.market_name === marketName);
          const region = firstStation?.region || 'Unknown';
          
          const newMarket = await contactTrackingService.createMarket({
            name: marketName,
            description: `${region} Region`,
            is_active: true
          });
          marketMap.set(marketName.toLowerCase(), newMarket);
          console.log(`Created market: ${marketName}`);
        } catch (error: any) {
          console.error(`Failed to create market ${marketName}:`, error);
          // Try to fetch it again in case it was created by another process
          existingMarkets = await contactTrackingService.getMarkets(true);
          const foundMarket = existingMarkets.find(m => 
            m.name.toLowerCase() === marketName.toLowerCase()
          );
          if (foundMarket) {
            marketMap.set(marketName.toLowerCase(), foundMarket);
          }
        }
      }
    }
    
    // PHASE 2: Import stations with their market associations
    setImportPhase('stations');
    setImportProgress(0);
    
    for (let i = 0; i < validStations.length; i++) {
      const station = validStations[i];
      setImportProgress(Math.round(((i + 1) / validStations.length) * 100));
      
      try {
        const market = marketMap.get(station.market_name.toLowerCase());
        
        if (!market) {
          throw new Error(`Market '${station.market_name}' not found or could not be created`);
        }

        // Check for existing station code across ALL stations (not just in this market)
        const allStations = await contactTrackingService.getStations();
        const existingStation = allStations.find(s => 
          s.station_code.toLowerCase() === station.station_code.toLowerCase()
        );

        if (existingStation) {
          // UPDATE existing station with new data
          await contactTrackingService.updateStation(existingStation.id, {
            market_id: market.id,  // Update market association
            city: station.city,
            state: station.state,
            zip: station.zip,
            full_address: station.full_address || existingStation.full_address,
            is_active: true
          });
          
          station.status = 'success';
          station.message = 'Updated existing station';
          results.success++;
        } else {
          // CREATE new station
          await contactTrackingService.createStation({
            market_id: market.id,
            station_code: station.station_code,
            city: station.city,
            state: station.state,
            zip: station.zip,
            full_address: station.full_address,
            is_active: true
          });
          
          station.status = 'success';
          station.message = 'Created new station';
          results.success++;
        }
      } catch (error: any) {
        station.status = 'error';
        station.message = error.message || 'Import failed';
        results.failed++;
      }
      
      // Update the display
      setParsedData([...parsedData]);
    }
    
    setImportResults(results);
    setIsImporting(false);
    setImportPhase('idle');
    
    // Show completion toast
    toast({
      title: 'Import Complete',
      description: `Processed ${results.success} stations successfully. ${results.failed > 0 ? `${results.failed} failed.` : ''}`
    });
    
    if (onImportComplete && results.success > 0) {
      onImportComplete();
    }
  };

  const downloadTemplate = () => {
    const csvContent = `market_name,station_code,city,state,zip,full_address
"Northeast Market","BOS1","Boston","MA","02101","123 Main St, Boston, MA 02101"
"Southeast Market","ATL1","Atlanta","GA","30301","456 Peachtree St, Atlanta, GA 30301"
"West Coast Market","LAX1","Los Angeles","CA","90001","789 Pacific Ave, Los Angeles, CA 90001"
"Midwest Market","CHI1","Chicago","IL","60601","321 Michigan Ave, Chicago, IL 60601"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'station_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'duplicate':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string, message?: string) => {
    if (status === 'success' && message?.includes('Updated')) {
      return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
    }
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case 'duplicate':
        return <Badge className="bg-yellow-100 text-yellow-800">Duplicate</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Upload className="h-4 w-4" />
        Import Stations (CSV)
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Import Stations from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with station data. Markets will be created automatically if they don't exist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Required CSV columns:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li><code>market_name</code> - Name of the market (will be created if doesn't exist)</li>
                    <li><code>station_code</code> - Unique station identifier (e.g., DCA1)</li>
                    <li><code>city</code> - City name</li>
                    <li><code>state</code> - 2-letter state code (e.g., VA)</li>
                    <li><code>zip</code> - ZIP code</li>
                    <li><code>full_address</code> - (Optional) Complete address</li>
                  </ul>
                  <p className="text-sm mt-2">Region will be automatically determined from the state.</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* File Upload Area */}
            {parsedData.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose CSV File
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Preview Table */}
            {parsedData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Preview ({parsedData.length} stations)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setParsedData([]);
                        setImportResults({ success: 0, failed: 0, duplicates: 0 });
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Station Code</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>ZIP</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((station, index) => (
                        <TableRow key={index}>
                          <TableCell>{getStatusIcon(station.status)}</TableCell>
                          <TableCell>{station.market_name}</TableCell>
                          <TableCell className="font-mono">{station.station_code}</TableCell>
                          <TableCell>{station.city}</TableCell>
                          <TableCell>{station.state}</TableCell>
                          <TableCell>{station.zip}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{station.region}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getStatusBadge(station.status, station.message)}
                              {station.message && (
                                <p className="text-xs text-muted-foreground">{station.message}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                {/* Import Progress */}
                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {importPhase === 'markets' 
                          ? 'Phase 1: Creating markets...' 
                          : 'Phase 2: Importing stations...'}
                      </span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                    {importPhase === 'markets' && (
                      <p className="text-xs text-muted-foreground">
                        Ensuring all markets exist before importing stations...
                      </p>
                    )}
                  </div>
                )}

                {/* Results Summary */}
                {!isImporting && (importResults.success > 0 || importResults.failed > 0) && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex gap-4">
                        <span className="text-green-600">
                          ✓ {importResults.success} imported
                        </span>
                        {importResults.duplicates > 0 && (
                          <span className="text-yellow-600">
                            ⚠ {importResults.duplicates} duplicates
                          </span>
                        )}
                        {importResults.failed > 0 && (
                          <span className="text-red-600">
                            ✗ {importResults.failed} failed
                          </span>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            {parsedData.length > 0 && (
              <Button 
                onClick={handleImport}
                disabled={isImporting || parsedData.every(s => s.status !== 'pending')}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Import {parsedData.filter(s => s.status === 'pending').length} Stations
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}