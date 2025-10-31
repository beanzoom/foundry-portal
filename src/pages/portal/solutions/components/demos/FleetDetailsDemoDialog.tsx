import React, { useState } from 'react';
import { StandardDialog } from '@/components/dialog-library/variants/StandardDialog';
import { FleetVehicle } from '@/features/fleet/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { 
  ArrowLeft, Edit, Archive, Wrench, History, Calendar, 
  MapPin, Gauge, Car, FileText, Building, User, ChevronDown,
  ChevronUp, AlertCircle, CheckCircle, Activity
} from 'lucide-react';

interface FleetDetailsDemoDialogProps {
  vehicle: FleetVehicle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onAddMaintenance?: () => void;
  onViewMaintenance?: () => void;
  canEdit?: boolean;
  canArchive?: boolean;
  canAddMaintenance?: boolean;
  onBack?: () => void;
}

// Professional data display component
const DataField: React.FC<{ label: string; value: string | number | null | undefined; className?: string }> = ({ 
  label, 
  value, 
  className 
}) => (
  <div className={cn("flex justify-between", className)}>
    <dt className="text-sm text-muted-foreground">{label}:</dt>
    <dd className="font-medium text-sm text-right">{value || 'N/A'}</dd>
  </div>
);

export const FleetDetailsDemoDialog: React.FC<FleetDetailsDemoDialogProps> = ({
  vehicle,
  open,
  onOpenChange,
  onEdit,
  onArchive,
  onAddMaintenance,
  onViewMaintenance,
  canEdit = true,
  canArchive = true,
  canAddMaintenance = true,
  onBack
}) => {
  const [showServiceInfo, setShowServiceInfo] = useState(false);
  const [showOwnershipInfo, setShowOwnershipInfo] = useState(false);
  const [showOdometerHistory, setShowOdometerHistory] = useState(false);

  // Mock odometer history for demo
  const mockOdometerHistory = [
    {
      id: '1',
      odometer: 45678,
      recorded_at: '2024-03-10T14:30:00',
      profiles: {
        first_name: 'Sarah',
        last_name: 'Johnson'
      },
      maintenance_record_id: null
    },
    {
      id: '2',
      odometer: 45234,
      recorded_at: '2024-03-08T09:15:00',
      profiles: {
        first_name: 'Mike',
        last_name: 'Chen'
      },
      maintenance_record_id: null
    },
    {
      id: '3',
      odometer: 44890,
      recorded_at: '2024-03-05T16:45:00',
      profiles: {
        first_name: 'Sarah',
        last_name: 'Johnson'
      },
      maintenance_record_id: null
    },
    {
      id: '4',
      odometer: 44456,
      recorded_at: '2024-03-03T11:20:00',
      profiles: {
        first_name: 'System',
        last_name: 'Auto'
      },
      maintenance_record_id: 'maint-123'
    },
    {
      id: '5',
      odometer: 44012,
      recorded_at: '2024-03-01T08:00:00',
      profiles: {
        first_name: 'Sarah',
        last_name: 'Johnson'
      },
      maintenance_record_id: null
    }
  ];

  // Extract vehicle data
  const operationalState = vehicle?.operational_state || vehicle?.operationalState || 'Unknown';
  const vehicleName = vehicle?.vehicle_name || vehicle?.vehicleName || 'Unknown Vehicle';
  const hasActiveMaintenance = !!(vehicle?.active_maintenance_count && vehicle.active_maintenance_count > 0);

  // Get operational state styling
  const getOperationalBadgeStyle = () => {
    const state = operationalState.toLowerCase();
    if (state.includes('ground')) {
      return 'bg-red-100 text-red-700 border-red-300';
    }
    if (state.includes('maintenance')) {
      return 'bg-orange-100 text-orange-700 border-orange-300';
    }
    if (state.includes('available') || state.includes('operational')) {
      return 'bg-green-100 text-green-700 border-green-300';
    }
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  // Service information check
  const hasServiceInfo = vehicle?.service_type || vehicle?.serviceType || 
    vehicle?.subservice_type || vehicle?.subserviceType ||
    vehicle?.service_tier || vehicle?.serviceTier;

  // Ownership information check
  const hasOwnershipInfo = vehicle?.ownership_type || vehicle?.ownershipType ||
    vehicle?.vehicle_provider || vehicle?.vehicleProvider ||
    vehicle?.ownership_start_date || vehicle?.ownershipStartDate;

  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      dialogId="fleet-details-demo-dialog"
      maxWidth="3xl"
      maxHeight="90vh"
      hideCloseButton={false}
      className="overflow-hidden"
      title={
        <div className="flex items-center justify-between w-full pr-12">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 -ml-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h2 className="text-xl font-semibold">
              {vehicleName}
            </h2>
          </div>
          
          {/* Centered operational state badge */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Badge 
              variant="outline"
              className={cn(
                "text-xs border",
                getOperationalBadgeStyle()
              )}
            >
              {operationalState}
            </Badge>
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end w-full gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {canEdit && onEdit && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canArchive && onArchive && (
            <Button 
              variant="outline"
              size="sm"
              onClick={onArchive}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      }
    >
      <ScrollArea className="h-full">
        <div className="space-y-4 px-6 py-6">
          {/* Maintenance action buttons */}
          <div className="flex justify-end gap-2">
            {canAddMaintenance && onAddMaintenance && (
              <Button 
                variant="outline"
                size="sm"
                onClick={onAddMaintenance}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Add Maintenance
              </Button>
            )}
            {onViewMaintenance && (
              <Button 
                variant="outline"
                size="sm"
                onClick={onViewMaintenance}
              >
                <History className="h-4 w-4 mr-2" />
                Maintenance History
              </Button>
            )}
          </div>

          {/* Basic Information - 2 column grid on desktop */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-purple-600 italic font-medium flex items-center gap-2">
                <Car className="h-4 w-4" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                <DataField label="VIN" value={vehicle?.vin} />
                <DataField label="License Plate" value={vehicle?.license_plate_number || vehicle?.licensePlateNumber} />
                <DataField label="Make" value={vehicle?.make} />
                <DataField label="Model" value={vehicle?.model} />
                <DataField label="Year" value={vehicle?.year} />
                <DataField label="Vehicle Type" value={vehicle?.vehicle_type || vehicle?.vehicleType || vehicle?.type} />
                {vehicle?.odometer && (
                  <DataField label="Current Odometer" value={`${vehicle.odometer.toLocaleString()} miles`} />
                )}
                <DataField label="Status" value={vehicle?.status} />
              </dl>
            </CardContent>
          </Card>

          {/* Active Maintenance Alert */}
          {hasActiveMaintenance ? (
            <Card className="border-muted bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium">
                    This vehicle has {vehicle.active_maintenance_count} active maintenance issue{vehicle.active_maintenance_count > 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Service Information - Collapsible */}
          {hasServiceInfo && (
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setShowServiceInfo(!showServiceInfo)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-purple-600 italic font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Service Information
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {showServiceInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showServiceInfo && (
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <DataField label="Service Type" value={vehicle?.service_type || vehicle?.serviceType} />
                    <DataField label="Service Tier" value={vehicle?.service_tier || vehicle?.serviceTier} />
                    <DataField label="Subservice Type" value={vehicle?.subservice_type || vehicle?.subserviceType} />
                    <DataField label="Subservice Type 2" value={vehicle?.subservice_type2 || vehicle?.subserviceType2} />
                    <DataField label="Station Code" value={vehicle?.station_code || vehicle?.stationCode} />
                    <DataField label="PM Stats" value={vehicle?.pm_stats || vehicle?.pmStats} />
                    {vehicle?.last_service_date && (
                      <DataField label="Last Service Date" value={formatDate(vehicle.last_service_date)} />
                    )}
                  </dl>
                </CardContent>
              )}
            </Card>
          )}

          {/* Ownership Information - Collapsible */}
          {hasOwnershipInfo && (
            <Card>
              <CardHeader 
                className="pb-3 cursor-pointer"
                onClick={() => setShowOwnershipInfo(!showOwnershipInfo)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-purple-600 italic font-medium flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Ownership Information
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {showOwnershipInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showOwnershipInfo && (
                <CardContent>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <DataField label="Ownership Type" value={vehicle?.ownership_type || vehicle?.ownershipType} />
                    <DataField label="Provider" value={vehicle?.vehicle_provider || vehicle?.vehicleProvider} />
                    <DataField label="Registration Type" value={vehicle?.vehicle_registration_type || vehicle?.vehicleRegistrationType} />
                    <DataField label="Registered State" value={vehicle?.registered_state || vehicle?.registeredState} />
                    <DataField label="Subcontractor" value={vehicle?.subcontractor_name || vehicle?.subcontractorName} />
                    {vehicle?.ownership_start_date && (
                      <DataField label="Ownership Start" value={formatDate(vehicle.ownership_start_date)} />
                    )}
                    {vehicle?.ownership_end_date && (
                      <DataField label="Ownership End" value={formatDate(vehicle.ownership_end_date)} />
                    )}
                    {vehicle?.registration_expiry_date && (
                      <DataField label="Registration Expiry" value={formatDate(vehicle.registration_expiry_date)} />
                    )}
                  </dl>
                </CardContent>
              )}
            </Card>
          )}

          {/* Odometer History - Collapsible */}
          <Card>
            <CardHeader 
              className="pb-3 cursor-pointer"
              onClick={() => setShowOdometerHistory(!showOdometerHistory)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-purple-600 italic font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Recent Odometer Readings
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {showOdometerHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showOdometerHistory && (
              <CardContent>
                <div className="space-y-2">
                  {mockOdometerHistory.map((entry, index) => {
                  const recordedBy = entry.profiles || {};
                  const recordedByName = recordedBy.first_name && recordedBy.last_name
                    ? `${recordedBy.first_name} ${recordedBy.last_name}`
                    : 'Unknown';

                  return (
                    <div 
                      key={entry.id} 
                      className={cn(
                        "flex items-center justify-between py-2",
                        index < mockOdometerHistory.length - 1 && "border-b"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">
                            {entry.odometer.toLocaleString()} miles
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.recorded_at)} by {recordedByName}
                          </p>
                        </div>
                      </div>
                      {entry.maintenance_record_id && (
                        <Badge variant="outline" className="text-xs">
                          From Maintenance
                        </Badge>
                      )}
                    </div>
                  );
                })}
                </div>
              </CardContent>
            )}
          </Card>

        </div>
      </ScrollArea>
    </StandardDialog>
  );
};