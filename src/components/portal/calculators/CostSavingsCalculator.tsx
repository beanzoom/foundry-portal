import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Calculator,
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Download,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Settings,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { calculatorService } from '@/services/calculator.service';
import { SubmissionHistory } from './SubmissionHistory';
import { History } from 'lucide-react';
import { AFSSavingsSection, AFSSavings } from './AFSSavingsSection';
import { AFS_FMP_RATES, AFS_CAPTURE_RATES } from '@/lib/portal/investmentConstants';

// Types
interface LaborSavings {
  id: string;
  name: string;
  hourlyRate: number;
  employees: number;
  minutesPerDay: number;
  workdaysPerMonth: number;
  monthlySavings: number;
}

interface SystemReplacement {
  id: string;
  name: string;
  currentCostPerUser: number;
  numberOfUsers: number;
  monthlySavings: number;
}

interface FixedSavings {
  id: string;
  name: string;
  monthlyAmount: number;
  monthlySavings: number;
}

type SavingsItem = LaborSavings | SystemReplacement | FixedSavings;

// Preset templates
const PRESET_TEMPLATES = {
  labor: [
    { name: 'Driver Center Efficiency', minutesPerDay: 15, employees: 50 },
    { name: 'Dispatch Optimization', minutesPerDay: 30, employees: 5 },
    { name: 'Maintenance Tracking', minutesPerDay: 20, employees: 3 },
    { name: 'Route Planning', minutesPerDay: 25, employees: 50 },
  ],
  system: [
    { name: 'Dispatch Software', costPerUser: 25, users: 10 },
    { name: 'Fleet Tracking System', costPerUser: 35, users: 50 },
    { name: 'Maintenance Software', costPerUser: 15, users: 5 },
    { name: 'Compliance Platform', costPerUser: 20, users: 10 },
  ],
  fixed: [
    { name: 'Reduced Compliance Fines', amount: 500 },
    { name: 'Insurance Premium Reduction', amount: 250 },
    { name: 'Fuel Optimization', amount: 750 },
    { name: 'Third-party Service Elimination', amount: 300 },
  ],
};

export function CostSavingsCalculator() {
  const [laborSavings, setLaborSavings] = useState<LaborSavings[]>([]);
  const [systemReplacements, setSystemReplacements] = useState<SystemReplacement[]>([]);
  const [fixedSavings, setFixedSavings] = useState<FixedSavings[]>([]);
  const [afsSavings, setAfsSavings] = useState<AFSSavings[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    afs: true, // AFS expanded by default (hero feature)
    labor: true,
    system: true,
    fixed: true,
  });
  
  // Submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);

  // Calculate totals
  const totalAfsSavings = afsSavings.reduce((sum, item) => sum + item.monthlySavings, 0);
  const totalLaborSavings = laborSavings.reduce((sum, item) => sum + item.monthlySavings, 0);
  const totalSystemSavings = systemReplacements.reduce((sum, item) => sum + item.monthlySavings, 0);
  const totalFixedSavings = fixedSavings.reduce((sum, item) => sum + item.monthlySavings, 0);
  const totalMonthlySavings = totalAfsSavings + totalLaborSavings + totalSystemSavings + totalFixedSavings;
  const totalAnnualSavings = totalMonthlySavings * 12;

  // Add labor savings line
  const addLaborSavings = (preset?: any) => {
    const newItem: LaborSavings = {
      id: Date.now().toString(),
      name: preset?.name || 'New Labor Savings',
      hourlyRate: 22.25,
      employees: preset?.employees || 1,
      minutesPerDay: preset?.minutesPerDay || 15,
      workdaysPerMonth: 21,
      monthlySavings: 0,
    };
    newItem.monthlySavings = calculateLaborSavings(newItem);
    setLaborSavings([...laborSavings, newItem]);
  };

  // Add system replacement line
  const addSystemReplacement = (preset?: any) => {
    const newItem: SystemReplacement = {
      id: Date.now().toString(),
      name: preset?.name || 'New System Replacement',
      currentCostPerUser: preset?.costPerUser || 25,
      numberOfUsers: preset?.users || 1,
      monthlySavings: 0,
    };
    newItem.monthlySavings = calculateSystemSavings(newItem);
    setSystemReplacements([...systemReplacements, newItem]);
  };

  // Add fixed savings line
  const addFixedSavings = (preset?: any) => {
    const newItem: FixedSavings = {
      id: Date.now().toString(),
      name: preset?.name || 'New Fixed Savings',
      monthlyAmount: preset?.amount || 100,
      monthlySavings: preset?.amount || 100,
    };
    setFixedSavings([...fixedSavings, newItem]);
  };

  // Add AFS savings line
  const addAfsSavings = () => {
    const newItem: AFSSavings = {
      id: Date.now().toString(),
      name: 'AFS Revenue Recovery',
      vehicleType: 'blendedAverage',
      fmpRate: AFS_FMP_RATES.blendedAverage.rate,
      averageDowntimeVehicles: 3,
      averageDowntimeDays: 14,
      manualCaptureRate: AFS_CAPTURE_RATES.manual,
      fleetDRMSCaptureRate: AFS_CAPTURE_RATES.automated,
      monthlySavings: 0,
    };
    newItem.monthlySavings = calculateAfsSavings(newItem);
    setAfsSavings([...afsSavings, newItem]);
  };

  // Calculate labor savings
  const calculateLaborSavings = (item: LaborSavings): number => {
    const minuteRate = item.hourlyRate / 60;
    return minuteRate * item.minutesPerDay * item.employees * item.workdaysPerMonth;
  };

  // Calculate system replacement savings
  const calculateSystemSavings = (item: SystemReplacement): number => {
    return item.currentCostPerUser * item.numberOfUsers;
  };

  // Calculate AFS savings
  const calculateAfsSavings = (item: AFSSavings): number => {
    // Monthly downtime as fraction (e.g., 14 days / 30 days = 0.467)
    const downtimeFraction = item.averageDowntimeDays / 30;

    // Lost revenue without FleetDRMS (manual capture at 40%)
    const lostRevenueManual =
      item.averageDowntimeVehicles *
      item.fmpRate *
      downtimeFraction *
      (1 - item.manualCaptureRate / 100);

    // Lost revenue with FleetDRMS (automated capture at 90%)
    const lostRevenueWithFleetDRMS =
      item.averageDowntimeVehicles *
      item.fmpRate *
      downtimeFraction *
      (1 - item.fleetDRMSCaptureRate / 100);

    // Savings = reduction in lost revenue
    return Math.max(0, lostRevenueManual - lostRevenueWithFleetDRMS);
  };

  // Update labor savings
  const updateLaborSavings = (id: string, field: keyof LaborSavings, value: any) => {
    setLaborSavings(laborSavings.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.monthlySavings = calculateLaborSavings(updated);
        return updated;
      }
      return item;
    }));
  };

  // Update system replacement
  const updateSystemReplacement = (id: string, field: keyof SystemReplacement, value: any) => {
    setSystemReplacements(systemReplacements.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.monthlySavings = calculateSystemSavings(updated);
        return updated;
      }
      return item;
    }));
  };

  // Update fixed savings
  const updateFixedSavings = (id: string, field: keyof FixedSavings, value: any) => {
    setFixedSavings(fixedSavings.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.monthlySavings = field === 'monthlyAmount' ? value : item.monthlySavings;
        return updated;
      }
      return item;
    }));
  };

  // Update AFS savings
  const updateAfsSavings = (id: string, field: keyof AFSSavings, value: any) => {
    setAfsSavings(afsSavings.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.monthlySavings = calculateAfsSavings(updated);
        return updated;
      }
      return item;
    }));
  };

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  // Export results
  const exportResults = () => {
    const data = {
      laborSavings,
      systemReplacements,
      fixedSavings,
      totals: {
        monthly: totalMonthlySavings,
        annual: totalAnnualSavings,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cost-savings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Load previous submission
  const handleLoadSubmission = (submission: any) => {
    // Clear existing data
    setAfsSavings([]);
    setLaborSavings([]);
    setSystemReplacements([]);
    setFixedSavings([]);

    // Load AFS savings
    if (submission.afs_savings_items && submission.afs_savings_items.length > 0) {
      const afsItems = submission.afs_savings_items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        name: item.name,
        vehicleType: item.vehicleType,
        fmpRate: item.fmpRate,
        averageDowntimeVehicles: item.averageDowntimeVehicles,
        averageDowntimeDays: item.averageDowntimeDays,
        manualCaptureRate: item.manualCaptureRate || AFS_CAPTURE_RATES.manual,
        fleetDRMSCaptureRate: item.fleetDRMSCaptureRate || AFS_CAPTURE_RATES.automated,
        monthlySavings: item.monthlySavings,
      }));
      setAfsSavings(afsItems);
    }

    // Load labor savings
    if (submission.labor_savings_items && submission.labor_savings_items.length > 0) {
      const laborItems = submission.labor_savings_items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        name: item.name,
        hourlyRate: item.hourlyRate,
        employees: item.employees,
        minutesPerDay: item.minutesPerDay,
        workdaysPerMonth: item.workdaysPerMonth || 21,
        monthlySavings: item.monthlySavings,
      }));
      setLaborSavings(laborItems);
    }

    // Load system replacements
    if (submission.system_replacement_items && submission.system_replacement_items.length > 0) {
      const systemItems = submission.system_replacement_items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        name: item.name,
        currentCostPerUser: item.currentCostPerUser,
        numberOfUsers: item.numberOfUsers,
        monthlySavings: item.monthlySavings,
      }));
      setSystemReplacements(systemItems);
    }

    // Load fixed savings
    if (submission.fixed_savings_items && submission.fixed_savings_items.length > 0) {
      const fixedItems = submission.fixed_savings_items.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        name: item.name,
        monthlyAmount: item.monthlyAmount || item.amount,
        monthlySavings: item.monthlySavings || item.monthlyAmount || item.amount,
      }));
      setFixedSavings(fixedItems);
    }

    // Expand all sections to show loaded data
    setExpandedSections({
      afs: true,
      labor: true,
      system: true,
      fixed: true,
    });
  };

  // Handle submission
  const handleSubmitForReview = () => {
    if (totalMonthlySavings === 0) {
      toast({
        title: 'No savings to submit',
        description: 'Please add at least one savings item before submitting.',
        variant: 'destructive',
      });
      return;
    }
    setShowSubmitModal(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);

    try {
      const result = await calculatorService.submitCalculation({
        total_monthly_savings: totalMonthlySavings,
        total_annual_savings: totalAnnualSavings,
        afs_savings_total: totalAfsSavings,
        labor_savings_total: totalLaborSavings,
        system_savings_total: totalSystemSavings,
        fixed_savings_total: totalFixedSavings,
        afs_savings_items: afsSavings.map(item => ({
          name: item.name,
          vehicleType: item.vehicleType,
          fmpRate: item.fmpRate,
          averageDowntimeVehicles: item.averageDowntimeVehicles,
          averageDowntimeDays: item.averageDowntimeDays,
          manualCaptureRate: item.manualCaptureRate,
          fleetDRMSCaptureRate: item.fleetDRMSCaptureRate,
          monthlySavings: item.monthlySavings,
        })),
        labor_savings_items: laborSavings.map(item => ({
          name: item.name,
          hourlyRate: item.hourlyRate,
          employees: item.employees,
          minutesPerDay: item.minutesPerDay,
          workdaysPerMonth: item.workdaysPerMonth,
          monthlySavings: item.monthlySavings,
        })),
        system_replacement_items: systemReplacements.map(item => ({
          name: item.name,
          currentCostPerUser: item.currentCostPerUser,
          numberOfUsers: item.numberOfUsers,
          monthlySavings: item.monthlySavings,
        })),
        fixed_savings_items: fixedSavings.map(item => ({
          name: item.name,
          monthlyAmount: item.monthlyAmount,
          monthlySavings: item.monthlySavings,
        })),
        notes: submissionNotes,
      });

      if (result.success) {
        setLastSubmissionId(result.id || null);
        toast({
          title: 'Submission successful!',
          description: 'Your savings calculation has been submitted for review.',
          className: 'bg-green-50 border-green-200',
        });
        setShowSubmitModal(false);
        setSubmissionNotes('');
      } else {
        toast({
          title: 'Submission failed',
          description: result.error || 'An error occurred while submitting your calculation.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Savings Inputs (2/3 width) */}
      <div className="lg:col-span-2 space-y-4">
        {/* AFS Revenue Recovery Section - LEAD FEATURE */}
        <AFSSavingsSection
          items={afsSavings}
          totalSavings={totalAfsSavings}
          expanded={expandedSections.afs}
          onToggleExpand={() => toggleSection('afs')}
          onAddItem={addAfsSavings}
          onUpdateItem={updateAfsSavings}
          onRemoveItem={(id) => setAfsSavings(afsSavings.filter(i => i.id !== id))}
        />

        {/* Labor Savings Section */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => toggleSection('labor')}
            >
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Labor & Time Savings</CardTitle>
              {totalLaborSavings > 0 && (
                <Badge variant="secondary">
                  ${totalLaborSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </Badge>
              )}
              {expandedSections.labor ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addLaborSavings()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.labor && (
          <CardContent className="space-y-4">
            {laborSavings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Click + to add labor savings
              </p>
            ) : (
              laborSavings.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={item.name}
                      onChange={(e) => updateLaborSavings(item.id, 'name', e.target.value)}
                      className="font-medium text-lg border-0 p-0 h-auto"
                      placeholder="Savings name"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLaborSavings(laborSavings.filter(i => i.id !== item.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Hourly Rate</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={item.hourlyRate}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              updateLaborSavings(item.id, 'hourlyRate', 0);
                            } else {
                              updateLaborSavings(item.id, 'hourlyRate', parseFloat(value));
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="pl-6"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Employees</Label>
                      <Input
                        type="number"
                        value={item.employees}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateLaborSavings(item.id, 'employees', 0);
                          } else {
                            updateLaborSavings(item.id, 'employees', parseInt(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Minutes/Day Saved</Label>
                      <Input
                        type="number"
                        value={item.minutesPerDay}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateLaborSavings(item.id, 'minutesPerDay', 0);
                          } else {
                            updateLaborSavings(item.id, 'minutesPerDay', parseInt(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Work Days/Month</Label>
                      <Input
                        type="number"
                        value={item.workdaysPerMonth}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateLaborSavings(item.id, 'workdaysPerMonth', 0);
                          } else {
                            updateLaborSavings(item.id, 'workdaysPerMonth', parseInt(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        min="1"
                        max="31"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {item.employees} employees × {item.minutesPerDay} min/day × ${(item.hourlyRate/60).toFixed(3)}/min × {item.workdaysPerMonth} days
                    </span>
                    <Badge variant="default" className="text-lg">
                      ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* System Replacement Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => toggleSection('system')}
            >
              <Settings className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">System Replacement Savings</CardTitle>
              {totalSystemSavings > 0 && (
                <Badge variant="secondary">
                  ${totalSystemSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </Badge>
              )}
              {expandedSections.system ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addSystemReplacement()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.system && (
          <CardContent className="space-y-4">
            {systemReplacements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Click + to add system replacement savings
              </p>
            ) : (
              systemReplacements.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={item.name}
                      onChange={(e) => updateSystemReplacement(item.id, 'name', e.target.value)}
                      className="font-medium text-lg border-0 p-0 h-auto"
                      placeholder="System name"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSystemReplacements(systemReplacements.filter(i => i.id !== item.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Current Cost per User</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={item.currentCostPerUser}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              updateSystemReplacement(item.id, 'currentCostPerUser', 0);
                            } else {
                              updateSystemReplacement(item.id, 'currentCostPerUser', parseFloat(value));
                            }
                          }}
                          onFocus={(e) => e.target.select()}
                          className="pl-6"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Number of Users</Label>
                      <Input
                        type="number"
                        value={item.numberOfUsers}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateSystemReplacement(item.id, 'numberOfUsers', 0);
                          } else {
                            updateSystemReplacement(item.id, 'numberOfUsers', parseInt(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      ${item.currentCostPerUser}/user × {item.numberOfUsers} users
                    </span>
                    <Badge variant="default" className="text-lg">
                      ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>

      {/* Fixed Savings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => toggleSection('fixed')}
            >
              <Briefcase className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Fixed & Other Savings</CardTitle>
              {totalFixedSavings > 0 && (
                <Badge variant="secondary">
                  ${totalFixedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                </Badge>
              )}
              {expandedSections.fixed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addFixedSavings()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        {expandedSections.fixed && (
          <CardContent className="space-y-4">
            {fixedSavings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Click + to add fixed savings
              </p>
            ) : (
              fixedSavings.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={item.name}
                      onChange={(e) => updateFixedSavings(item.id, 'name', e.target.value)}
                      className="font-medium text-lg border-0 p-0 h-auto"
                      placeholder="Savings description"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFixedSavings(fixedSavings.filter(i => i.id !== item.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <Label className="text-xs">Monthly Amount</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={item.monthlyAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateFixedSavings(item.id, 'monthlyAmount', 0);
                          } else {
                            updateFixedSavings(item.id, 'monthlyAmount', parseFloat(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="pl-6"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end items-center pt-2 border-t">
                    <Badge variant="default" className="text-lg">
                      ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
      </div>

      {/* Right Column - Results Summary (1/3 width) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-lg">Savings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Category Breakdowns */}
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-green-50 p-2 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  AFS Revenue
                </span>
                <span className="font-bold text-green-700">
                  ${totalAfsSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Labor
                </span>
                <span className="font-semibold text-blue-600">
                  ${totalLaborSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Settings className="h-3 w-3 text-purple-500" />
                  Systems
                </span>
                <span className="font-semibold text-purple-600">
                  ${totalSystemSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-amber-500" />
                  Fixed
                </span>
                <span className="font-semibold text-amber-600">
                  ${totalFixedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Total</p>
                <p className="text-2xl font-bold text-primary">
                  ${totalMonthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Annual Total</p>
                <p className="text-2xl font-bold text-primary">
                  ${totalAnnualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Savings Breakdown Bar */}
            {totalMonthlySavings > 0 && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Distribution</p>
                <div className="w-full h-6 bg-gray-100 rounded overflow-hidden flex">
                  {totalAfsSavings > 0 && (
                    <div
                      className="bg-green-600 h-full"
                      style={{ width: `${(totalAfsSavings / totalMonthlySavings) * 100}%` }}
                      title={`AFS: ${((totalAfsSavings / totalMonthlySavings) * 100).toFixed(0)}%`}
                    />
                  )}
                  {totalLaborSavings > 0 && (
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${(totalLaborSavings / totalMonthlySavings) * 100}%` }}
                      title={`Labor: ${((totalLaborSavings / totalMonthlySavings) * 100).toFixed(0)}%`}
                    />
                  )}
                  {totalSystemSavings > 0 && (
                    <div
                      className="bg-purple-500 h-full"
                      style={{ width: `${(totalSystemSavings / totalMonthlySavings) * 100}%` }}
                      title={`Systems: ${((totalSystemSavings / totalMonthlySavings) * 100).toFixed(0)}%`}
                    />
                  )}
                  {totalFixedSavings > 0 && (
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(totalFixedSavings / totalMonthlySavings) * 100}%` }}
                      title={`Fixed: ${((totalFixedSavings / totalMonthlySavings) * 100).toFixed(0)}%`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t space-y-2">
              <Button 
                onClick={handleSubmitForReview} 
                className="w-full"
                disabled={totalMonthlySavings === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
              <div className="flex gap-2">
                <Button onClick={exportResults} variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={() => setShowHistoryModal(true)} variant="outline" size="sm" className="flex-1">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      </div>

      {/* Submission Confirmation Modal */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Your Submission</DialogTitle>
            <DialogDescription>
              Please review your savings calculation before submitting for review.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Summary Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Savings Summary
              </h3>
              
              {/* Category Breakdowns */}
              <div className="space-y-2">
                {totalAfsSavings > 0 && (
                  <div className="flex justify-between items-center py-2 border-b bg-green-50 px-3 rounded-lg">
                    <div>
                      <span className="font-semibold text-green-900">AFS Revenue Recovery</span>
                      <div className="text-sm text-green-700 mt-1">
                        {afsSavings.map(item => (
                          <div key={item.id} className="ml-4">
                            • {item.name}: ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="font-bold text-green-700">
                      ${totalAfsSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </span>
                  </div>
                )}

                {totalLaborSavings > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">Labor Savings</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {laborSavings.map(item => (
                          <div key={item.id} className="ml-4">
                            • {item.name}: ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="font-semibold text-blue-600">
                      ${totalLaborSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </span>
                  </div>
                )}
                
                {totalSystemSavings > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">System Replacements</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {systemReplacements.map(item => (
                          <div key={item.id} className="ml-4">
                            • {item.name}: ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="font-semibold text-purple-600">
                      ${totalSystemSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </span>
                  </div>
                )}
                
                {totalFixedSavings > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">Fixed Savings</span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {fixedSavings.map(item => (
                          <div key={item.id} className="ml-4">
                            • {item.name}: ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="font-semibold text-green-600">
                      ${totalFixedSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </span>
                  </div>
                )}
              </div>
              
              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total Monthly Savings</span>
                  <span className="font-bold text-primary">
                    ${totalMonthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total Annual Savings</span>
                  <span className="font-bold text-primary">
                    ${totalAnnualSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="notes">Optional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional context or notes about your calculation..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* Success Message */}
            {lastSubmissionId && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  A previous submission has been recorded. Submitting again will create a new submission.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmission}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm & Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submission History Modal */}
      <SubmissionHistory 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onLoadSubmission={handleLoadSubmission}
      />
    </div>
  );
}