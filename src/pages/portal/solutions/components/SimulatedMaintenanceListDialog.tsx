import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  Calendar,
  MapPin,
  User,
  ChevronRight,
  Wrench,
  Clock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulatedMaintenanceDialog } from './SimulatedMaintenanceDialog';

interface SimulatedMaintenanceListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: any;
  maintenanceRecords: any[];
}

export function SimulatedMaintenanceListDialog({
  isOpen,
  onClose,
  vehicle,
  maintenanceRecords
}: SimulatedMaintenanceListDialogProps) {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleRecordClick = (record: any) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const handleIssueResolved = () => {
    // Close the details dialog and keep the list open
    setDetailsOpen(false);
    setSelectedRecord(null);
    // List dialog stays open, no changes to the data
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 5) return 'bg-red-500';
    if (severity >= 4) return 'bg-orange-500';
    if (severity >= 3) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 5) return 'Critical';
    if (severity >= 4) return 'High';
    if (severity >= 3) return 'Medium';
    return 'Low';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress': return Clock;
      case 'Scheduled': return Calendar;
      case 'Resolved': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'text-yellow-600';
      case 'Scheduled': return 'text-blue-600';
      case 'Resolved': return 'text-green-600';
      case 'Requires Authorization': return 'text-orange-600';
      case 'Waiting for Parts': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-3 pr-8">
                <Wrench className="h-6 w-6 text-orange-600" />
                <span>{vehicle.vehicle_name} - Maintenance Issues</span>
                <Badge
                  className={cn(
                    "ml-auto text-white",
                    vehicle.operational_state === 'Grounded' ? 'bg-red-500' : 'bg-green-500'
                  )}
                >
                  {vehicle.operational_state}
                </Badge>
              </div>
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              {maintenanceRecords.length} active maintenance {maintenanceRecords.length === 1 ? 'issue' : 'issues'}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 mt-4">
            {maintenanceRecords.map((record) => {
              const StatusIcon = getStatusIcon(record.maintenance_record_status);

              return (
                <Card
                  key={record.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRecordClick(record)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={cn(
                              "text-white text-xs",
                              getSeverityColor(record.severity)
                            )}
                          >
                            {getSeverityLabel(record.severity)}
                          </Badge>
                          <h3 className="font-semibold text-base">{record.issue_title}</h3>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {record.issue_description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{record.location}</span>
                          </div>
                          <div className={cn("flex items-center gap-1", getStatusColor(record.maintenance_record_status))}>
                            <StatusIcon className="h-3 w-3" />
                            <span>{record.maintenance_record_status}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {record.date_due}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{record.profiles.first_name} {record.profiles.last_name}</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="border-t pt-4 mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Details Dialog */}
      <SimulatedMaintenanceDialog
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedRecord(null);
        }}
        maintenanceRecord={selectedRecord}
        onResolved={handleIssueResolved}
      />
    </>
  );
}