import React, { useState } from 'react';
import { StandardDialog } from '@/components/dialog-library/variants/StandardDialog';
import { MaintenanceRecord } from '@/features/maintenance/types';
import { ExemplarRecordCard } from '@/pages/admin/dev/dialog-exemplars/components/ExemplarRecordCard';
import { MaintenanceDetailsExemplarDialog } from '@/pages/admin/dev/dialog-exemplars/components/MaintenanceDetailsExemplarDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface MaintenanceListDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId?: string;
  vehicleName?: string;
  maintenanceRecords: MaintenanceRecord[];
}

export function MaintenanceListDemoDialog({
  open,
  onOpenChange,
  vehicleId,
  vehicleName,
  maintenanceRecords
}: MaintenanceListDemoDialogProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Find the selected record
  const selectedRecord = maintenanceRecords.find(record => record.id === selectedRecordId);

  const handleRecordClick = (recordId: string) => {
    setSelectedRecordId(recordId);
    setDetailsDialogOpen(true);
  };

  const handleCreateRecord = () => {
    // Demo: Would create new maintenance record for vehicle
  };

  const handleDetailsDialogClose = () => {
    setDetailsDialogOpen(false);
    setSelectedRecordId(null);
  };

  const handleBackFromDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedRecordId(null);
  };

  // Custom title with larger, bolder styling
  const customTitle = (
    <span className="text-2xl font-bold text-foreground">
      {vehicleName || "Vehicle"}
    </span>
  );

  // Dynamic description with record count
  const dynamicDescription = `Showing ${maintenanceRecords.length} active maintenance ${maintenanceRecords.length === 1 ? 'record' : 'records'}`;

  return (
    <>
      <StandardDialog
        open={open}
        onOpenChange={onOpenChange}
        title={customTitle}
        description={dynamicDescription}
        size="lg"
        dialogId="maintenance-list-demo-dialog"
      >
        <div className="space-y-2 p-0 pt-0 pb-2 -mt-2">
          {/* Create Record Button - minimal spacing */}
          <div className="flex justify-end">
            <Button 
              onClick={handleCreateRecord} 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Record
            </Button>
          </div>

          {/* Records List */}
          <div className="space-y-2">
            {maintenanceRecords.length === 0 ? (
              // Empty state - match the exact styling
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-lg font-medium">No maintenance records found</p>
                <p className="text-sm mt-2">
                  {vehicleId 
                    ? "This vehicle has no maintenance records yet."
                    : "Select a vehicle to view maintenance records."
                  }
                </p>
              </div>
            ) : (
              // Records - use the exact same RecordCard component styling
              maintenanceRecords.map((record: MaintenanceRecord) => (
                <ExemplarRecordCard
                  key={record.id}
                  record={record}
                  onClick={() => handleRecordClick(record.id)}
                  isActive={selectedRecordId === record.id}
                  showVehicleName={false} // Don't show vehicle name when viewing specific vehicle
                />
              ))
            )}
          </div>
        </div>
      </StandardDialog>

      {/* Details Dialog */}
      {detailsDialogOpen && selectedRecord && (
        <MaintenanceDetailsExemplarDialog
          record={selectedRecord}
          open={detailsDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleDetailsDialogClose();
              onOpenChange(false); // Close entire stack
            }
          }}
          onBack={handleBackFromDetails}
          canEdit={true}
          canResolve={true}
          onEdit={() => {
            // Demo: Would edit maintenance record
          }}
          onResolve={() => {
            // Demo: Would resolve maintenance record
          }}
        />
      )}
    </>
  );
}