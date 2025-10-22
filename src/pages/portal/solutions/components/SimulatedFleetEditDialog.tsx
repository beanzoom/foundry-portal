import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, Info, Wrench, Shield, Save } from 'lucide-react';

interface SimulatedFleetEditDialogProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SimulatedFleetEditDialog({
  vehicle,
  open,
  onOpenChange
}: SimulatedFleetEditDialogProps) {
  const [formData, setFormData] = useState({
    vehicle_name: vehicle?.vehicle_name || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
    license_plate_number: vehicle?.license_plate_number || '',
    vin: vehicle?.vin || '',
    vehicle_type: vehicle?.vehicle_type || '',
    operational_state: vehicle?.operational_state || 'Available',
    ownership_type: vehicle?.ownership_type || '',
    vehicle_provider: vehicle?.vehicle_provider || '',
    registered_state: vehicle?.registered_state || '',
    insurance_expiry: vehicle?.insurance_expiry || '',
    registration_expiry: vehicle?.registration_expiry || '',
    service_type: vehicle?.service_type || '',
    service_tier: vehicle?.service_tier || '',
    station_code: vehicle?.station_code || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Simulate save with validation
    if (!formData.vehicle_name || !formData.make || !formData.model) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success('Vehicle information updated successfully', {
      description: `${formData.vehicle_name} has been updated.`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Edit Vehicle: {vehicle?.vehicle_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="gap-2">
              <Info className="w-4 h-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="operational" className="gap-2">
              <Truck className="w-4 h-4" />
              Operational
            </TabsTrigger>
            <TabsTrigger value="ownership" className="gap-2">
              <Shield className="w-4 h-4" />
              Ownership
            </TabsTrigger>
            <TabsTrigger value="service" className="gap-2">
              <Wrench className="w-4 h-4" />
              Service
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle_name">Vehicle Name *</Label>
                  <Input
                    id="vehicle_name"
                    value={formData.vehicle_name}
                    onChange={(e) => handleInputChange('vehicle_name', e.target.value)}
                    placeholder="e.g., Van 18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => handleInputChange('vehicle_type', value)}
                    modal={false}
                  >
                    <SelectTrigger id="vehicle_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cargo Van">Cargo Van</SelectItem>
                      <SelectItem value="Box Truck">Box Truck</SelectItem>
                      <SelectItem value="Sprinter Van">Sprinter Van</SelectItem>
                      <SelectItem value="Step Van">Step Van</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => handleInputChange('make', e.target.value)}
                    placeholder="e.g., Mercedes-Benz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g., Sprinter 2500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    placeholder="e.g., 2022"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate_number}
                    onChange={(e) => handleInputChange('license_plate_number', e.target.value)}
                    placeholder="e.g., ABC-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleInputChange('vin', e.target.value)}
                    placeholder="17-character VIN"
                    maxLength={17}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operational" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operational Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="operational_state">Operational State</Label>
                    <Select
                      value={formData.operational_state}
                      onValueChange={(value) => handleInputChange('operational_state', value)}
                      modal={false}
                    >
                      <SelectTrigger id="operational_state">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="In Use">In Use</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Grounded">Grounded</SelectItem>
                        <SelectItem value="Out of Service">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ownership" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ownership Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownership_type">Ownership Type</Label>
                      <Select
                        value={formData.ownership_type}
                        onValueChange={(value) => handleInputChange('ownership_type', value)}
                        modal={false}
                      >
                        <SelectTrigger id="ownership_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Owned">Owned</SelectItem>
                          <SelectItem value="Leased">Leased</SelectItem>
                          <SelectItem value="Rented">Rented</SelectItem>
                          <SelectItem value="Financed">Financed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_provider">Vehicle Provider</Label>
                      <Input
                        id="vehicle_provider"
                        value={formData.vehicle_provider}
                        onChange={(e) => handleInputChange('vehicle_provider', e.target.value)}
                        placeholder="e.g., Enterprise Fleet"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registered_state">Registered State</Label>
                      <Input
                        id="registered_state"
                        value={formData.registered_state}
                        onChange={(e) => handleInputChange('registered_state', e.target.value)}
                        placeholder="e.g., WA"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registration_expiry">Registration Expiry</Label>
                      <Input
                        id="registration_expiry"
                        type="date"
                        value={formData.registration_expiry}
                        onChange={(e) => handleInputChange('registration_expiry', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                    <Input
                      id="insurance_expiry"
                      type="date"
                      value={formData.insurance_expiry}
                      onChange={(e) => handleInputChange('insurance_expiry', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service_type">Service Type</Label>
                      <Select
                        value={formData.service_type}
                        onValueChange={(value) => handleInputChange('service_type', value)}
                        modal={false}
                      >
                        <SelectTrigger id="service_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Delivery">Delivery</SelectItem>
                          <SelectItem value="Transportation">Transportation</SelectItem>
                          <SelectItem value="Logistics">Logistics</SelectItem>
                          <SelectItem value="Special">Special</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service_tier">Service Tier</Label>
                      <Select
                        value={formData.service_tier}
                        onValueChange={(value) => handleInputChange('service_tier', value)}
                        modal={false}
                      >
                        <SelectTrigger id="service_tier">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Express">Express</SelectItem>
                          <SelectItem value="Priority">Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="station_code">Station Code</Label>
                    <Input
                      id="station_code"
                      value={formData.station_code}
                      onChange={(e) => handleInputChange('station_code', e.target.value)}
                      placeholder="e.g., SEA1"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}