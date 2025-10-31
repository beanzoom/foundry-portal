import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Edit, Wrench, Calendar,
  MapPin, Gauge, Car, FileText, Building,
} from 'lucide-react';

// Simple format date helper
const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
};

interface FleetDetailsDemoDialogProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export const FleetDetailsDemoDialog: React.FC<FleetDetailsDemoDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
  onEdit
}) => {
  // Extract vehicle data
  const operationalState = vehicle?.operational_state || vehicle?.operationalState || 'Unknown';
  const vehicleName = vehicle?.vehicle_name || vehicle?.vehicleName || 'Unknown Vehicle';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{vehicleName}</DialogTitle>
            <Badge className="bg-green-500">
              {operationalState}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="service">Service Info</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Make</p>
                  <p className="font-medium">{vehicle.make || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Model</p>
                  <p className="font-medium">{vehicle.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year</p>
                  <p className="font-medium">{vehicle.year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">VIN</p>
                  <p className="font-medium font-mono text-xs">{vehicle.vin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">License Plate</p>
                  <p className="font-medium">{vehicle.license_plate_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle Type</p>
                  <p className="font-medium">{vehicle.vehicle_type || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="w-5 h-5" />
                  Mileage & Condition
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Odometer</p>
                  <p className="font-medium">{vehicle.odometer?.toLocaleString() || 'N/A'} mi</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Level</p>
                  <p className="font-medium">{vehicle.fuel_level ? `${vehicle.fuel_level}%` : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location & Route
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Current Location</p>
                  <p className="font-medium">{vehicle.location || 'N/A'}</p>
                </div>
                {vehicle.current_driver && (
                  <div>
                    <p className="text-sm text-gray-600">Current Driver</p>
                    <p className="font-medium">{vehicle.current_driver}</p>
                  </div>
                )}
                {vehicle.route_number && (
                  <div>
                    <p className="text-sm text-gray-600">Route Number</p>
                    <p className="font-medium">{vehicle.route_number}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Service Type</p>
                  <p className="font-medium">{vehicle.service_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Service Tier</p>
                  <p className="font-medium">{vehicle.service_tier || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Subservice Type</p>
                  <p className="font-medium">{vehicle.subservice_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Station Code</p>
                  <p className="font-medium">{vehicle.station_code || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ownership" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Ownership Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ownership Type</p>
                  <p className="font-medium">{vehicle.ownership_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle Provider</p>
                  <p className="font-medium">{vehicle.vehicle_provider || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered State</p>
                  <p className="font-medium">{vehicle.registered_state || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ownership Start</p>
                  <p className="font-medium">{formatDate(vehicle.ownership_start_date)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Registration & Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Insurance Expiry</p>
                  <p className="font-medium">{formatDate(vehicle.insurance_expiry)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Expiry</p>
                  <p className="font-medium">{formatDate(vehicle.registration_expiry)}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Last Maintenance</p>
                  <p className="font-medium">{formatDate(vehicle.last_maintenance)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Next Maintenance Due</p>
                  <p className="font-medium">{formatDate(vehicle.next_maintenance_due)}</p>
                </div>
                {vehicle.active_maintenance_count !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Active Issues</p>
                    <p className="font-medium">{vehicle.active_maintenance_count}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Vehicle
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
