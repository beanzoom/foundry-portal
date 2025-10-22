import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ChevronDown, ChevronUp, DollarSign, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AFS_FMP_RATES, AFS_CAPTURE_RATES } from '@/lib/portal/investmentConstants';

export interface AFSSavings {
  id: string;
  name: string;
  vehicleType: keyof typeof AFS_FMP_RATES;
  fmpRate: number;
  averageDowntimeVehicles: number;
  averageDowntimeDays: number;
  manualCaptureRate: number;
  fleetDRMSCaptureRate: number;
  monthlySavings: number;
}

interface AFSSavingsSectionProps {
  items: AFSSavings[];
  totalSavings: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onAddItem: () => void;
  onUpdateItem: (id: string, field: keyof AFSSavings, value: any) => void;
  onRemoveItem: (id: string) => void;
}

export function AFSSavingsSection({
  items,
  totalSavings,
  expanded,
  onToggleExpand,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}: AFSSavingsSectionProps) {
  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={onToggleExpand}
          >
            <div className="p-2 bg-green-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                AFS Revenue Recovery
                <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                  NEW
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Recover lost Fixed Monthly Payment revenue
              </p>
            </div>
            {totalSavings > 0 && (
              <Badge variant="default" className="bg-green-600 text-lg px-4 py-1">
                ${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
              </Badge>
            )}
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
          {expanded && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onAddItem();
              }}
              className="ml-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Info Alert */}
          <Alert className="border-green-300 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-sm text-green-900">
              <strong>What is AFS?</strong> Amazon's Authorized Fleet Size determines your Fixed Monthly Payment (FMP).
              When vehicles are down for maintenance, warranty, or recalls, you can request AFS adjustments to maintain payment.
              Manual tracking misses <strong>60% of eligible claims</strong> – FleetDRMS automates this and captures <strong>90% of revenue</strong>.
            </AlertDescription>
          </Alert>

          {/* AFS Items */}
          {items.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-lg bg-white">
              <DollarSign className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">
                Track AFS revenue recovery opportunities
              </p>
              <p className="text-sm text-green-700 mb-4">
                Each missed AFS adjustment costs $1,500-$5,400/month in lost revenue
              </p>
              <Button
                onClick={onAddItem}
                variant="outline"
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add AFS Tracking
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border-2 border-green-200 rounded-lg p-4 space-y-4 bg-white">
                {/* Item Header */}
                <div className="flex items-center justify-between">
                  <Input
                    value={item.name}
                    onChange={(e) => onUpdateItem(item.id, 'name', e.target.value)}
                    className="font-medium text-lg border-0 p-0 h-auto focus-visible:ring-0"
                    placeholder="e.g., Monthly Maintenance Downtime"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Input Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Vehicle Type Selector */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Vehicle Type & FMP Rate</Label>
                    <Select
                      value={item.vehicleType}
                      onValueChange={(value) => {
                        const vehicleType = value as keyof typeof AFS_FMP_RATES;
                        onUpdateItem(item.id, 'vehicleType', vehicleType);
                        // Auto-update FMP rate when vehicle type changes
                        if (vehicleType !== 'custom') {
                          onUpdateItem(item.id, 'fmpRate', AFS_FMP_RATES[vehicleType].rate);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(AFS_FMP_RATES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center justify-between w-full">
                              <span>{value.label}</span>
                              <span className="ml-4 text-muted-foreground">${value.rate}/mo</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {AFS_FMP_RATES[item.vehicleType].description}
                    </p>
                  </div>

                  {/* FMP Rate (editable if custom) */}
                  <div>
                    <Label className="text-sm font-medium">FMP Rate per Vehicle</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={item.fmpRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            onUpdateItem(item.id, 'fmpRate', 0);
                          } else {
                            onUpdateItem(item.id, 'fmpRate', parseFloat(value));
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        className="pl-7"
                        step="1"
                        min="0"
                        disabled={item.vehicleType !== 'custom'}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Amazon's monthly payment per vehicle
                    </p>
                  </div>

                  {/* Average Downtime Vehicles */}
                  <div>
                    <Label className="text-sm font-medium">Avg Vehicles Down/Month</Label>
                    <Input
                      type="number"
                      value={item.averageDowntimeVehicles}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          onUpdateItem(item.id, 'averageDowntimeVehicles', 0);
                        } else {
                          onUpdateItem(item.id, 'averageDowntimeVehicles', parseInt(value));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Typical vehicles in maintenance/warranty
                    </p>
                  </div>

                  {/* Average Downtime Days */}
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Avg Downtime Duration (Days)</Label>
                    <Input
                      type="number"
                      value={item.averageDowntimeDays}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          onUpdateItem(item.id, 'averageDowntimeDays', 0);
                        } else {
                          onUpdateItem(item.id, 'averageDowntimeDays', parseInt(value));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      min="1"
                      max="30"
                      step="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Average days per incident (warranty, maintenance, recalls)
                    </p>
                  </div>
                </div>

                {/* Capture Rate Comparison */}
                <div className="pt-3 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-red-900 font-medium">Manual Tracking</span>
                        <Badge variant="destructive" className="text-xs">{AFS_CAPTURE_RATES.manual}%</Badge>
                      </div>
                      <p className="text-xs text-red-700">
                        Missed AFS claims = lost revenue
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-green-900 font-medium">FleetDRMS</span>
                        <Badge className="bg-green-600 text-xs">{AFS_CAPTURE_RATES.automated}%</Badge>
                      </div>
                      <p className="text-xs text-green-700">
                        Automated tracking & submission
                      </p>
                    </div>
                  </div>

                  {/* Savings Calculation Display */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <div>
                        {item.averageDowntimeVehicles} vehicles × ${item.fmpRate}/mo × {item.averageDowntimeDays} days
                      </div>
                      <div className="text-xs">
                        Recovery improvement: {AFS_CAPTURE_RATES.automated - AFS_CAPTURE_RATES.manual}% (from {AFS_CAPTURE_RATES.manual}% to {AFS_CAPTURE_RATES.automated}%)
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
                      ${item.monthlySavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Total AFS Savings Callout */}
          {totalSavings > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-90">Total AFS Revenue Recovery</p>
                  <p className="text-2xl font-bold">${totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}/month</p>
                  <p className="text-sm opacity-90 mt-1">
                    ${(totalSavings * 12).toLocaleString('en-US', { minimumFractionDigits: 0 })} annually
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">Software ROI</p>
                  <p className="text-3xl font-bold">
                    {((totalSavings / 1600) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs opacity-75">monthly return</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
