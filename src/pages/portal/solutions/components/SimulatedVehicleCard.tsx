import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wrench, AlertTriangle, Truck, Calendar, Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulatedMaintenanceListDialog } from './SimulatedMaintenanceListDialog';

interface SimulatedVehicleCardProps {
  vehicle: any;
  maintenanceRecords: any[];
  onClick?: () => void;
}

export function SimulatedVehicleCard({
  vehicle,
  maintenanceRecords,
  onClick
}: SimulatedVehicleCardProps) {
  const [listDialogOpen, setListDialogOpen] = useState(false);

  const activeIssues = maintenanceRecords.filter(
    r => r.maintenance_record_status !== 'Resolved'
  ).length;

  const criticalIssues = maintenanceRecords.filter(
    r => r.severity >= 5 && r.maintenance_record_status !== 'Resolved'
  ).length;

  const highIssues = maintenanceRecords.filter(
    r => r.severity === 4 && r.maintenance_record_status !== 'Resolved'
  ).length;

  const mediumIssues = maintenanceRecords.filter(
    r => r.severity === 3 && r.maintenance_record_status !== 'Resolved'
  ).length;

  const lowIssues = maintenanceRecords.filter(
    r => r.severity <= 2 && r.maintenance_record_status !== 'Resolved'
  ).length;

  const handleCardClick = () => {
    setListDialogOpen(true);
  };

  // Get severity badges for display
  const severityBadges = [];
  if (criticalIssues > 0) {
    severityBadges.push({ count: criticalIssues, label: 'Critical', color: 'bg-red-500' });
  }
  if (highIssues > 0) {
    severityBadges.push({ count: highIssues, label: 'High', color: 'bg-orange-500' });
  }
  if (mediumIssues > 0) {
    severityBadges.push({ count: mediumIssues, label: 'Medium', color: 'bg-yellow-500' });
  }
  if (lowIssues > 0) {
    severityBadges.push({ count: lowIssues, label: 'Low', color: 'bg-blue-500' });
  }

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] overflow-hidden",
          "border-l-4",
          vehicle.operational_state === 'Grounded' ? "border-l-red-500" : "border-l-green-500"
        )}
        onClick={handleCardClick}
      >
        <CardHeader className="pb-3 bg-purple-50/80 border-b border-purple-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Truck className="w-5 h-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">{vehicle.vehicle_name}</CardTitle>
                <p className="text-sm text-gray-600">
                  {vehicle.make} {vehicle.model} {vehicle.year}
                </p>
              </div>
            </div>
            <Badge
              className={cn(
                "text-white font-semibold px-3 py-1",
                vehicle.operational_state === 'Active' && "bg-green-500",
                vehicle.operational_state === 'Grounded' && "bg-red-500",
                vehicle.operational_state === 'Maintenance' && "bg-yellow-500"
              )}
            >
              {vehicle.operational_state}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 pb-5 space-y-4">
          {/* Issue Count Button */}
          {activeIssues > 0 && (
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg transform transition-all duration-300 hover:scale-110">
                {activeIssues} {activeIssues === 1 ? 'Issue' : 'Issues'}
              </div>
            </div>
          )}

          {/* Severity Badges Grid */}
          {severityBadges.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {severityBadges.map((badge, idx) => (
                <Badge
                  key={idx}
                  className={cn(
                    "text-white py-1.5 justify-center",
                    badge.color
                  )}
                >
                  {badge.count} {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Vehicle Stats */}
          <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Odometer:</span>
              <span className="font-medium">{vehicle.odometer?.toLocaleString() || 'N/A'} mi</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Next Service:</span>
              <span className="font-medium">
                {vehicle.next_maintenance_due || 'TBD'}
              </span>
            </div>
          </div>

          {/* View All Button */}
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
          >
            <Wrench className="w-4 h-4" />
            View All Maintenance Issues
          </Button>
        </CardContent>
      </Card>

      {/* Maintenance List Dialog */}
      <SimulatedMaintenanceListDialog
        isOpen={listDialogOpen}
        onClose={() => setListDialogOpen(false)}
        vehicle={vehicle}
        maintenanceRecords={maintenanceRecords}
      />
    </>
  );
}