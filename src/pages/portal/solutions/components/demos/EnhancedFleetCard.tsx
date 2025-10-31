import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { createLogger } from "@/lib/logging";
import { useState } from "react";
import { Calendar, Wrench, MapPin, Gauge } from "lucide-react";

const logger = createLogger('EnhancedFleetCard');

interface EnhancedFleetCardProps {
  vehicle: any;
  activeMaintenanceCount?: number;
  onView: (vehicleId: string, activeTab?: string) => void;
}

export function EnhancedFleetCard({
  vehicle,
  activeMaintenanceCount = 0,
  onView
}: EnhancedFleetCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  logger.debug(`EnhancedFleetCard for ${vehicle.id}: ${vehicle.vehicle_name}`);

  if (!vehicle.id) {
    logger.warn('EnhancedFleetCard received invalid vehicle ID');
    return null;
  }

  // Get operational state info
  const operationalState = vehicle.operational_state || vehicle.operationalState || 'Unknown';
  const activeIssuesCount = activeMaintenanceCount;
  const hasIssues = activeIssuesCount > 0;
  
  // Check states for styling
  const isGrounded = operationalState.toLowerCase().includes('ground');
  const isAvailable = operationalState.toLowerCase().includes('available') || 
                      operationalState.toLowerCase().includes('operational');
  const isInMaintenance = operationalState.toLowerCase().includes('maintenance');

  // Determine border color based on operational state
  const getBorderColor = () => {
    if (isGrounded) {
      return 'border-l-red-500 border-l-4';
    }
    if (isInMaintenance) {
      return 'border-l-orange-500 border-l-4';
    }
    if (isAvailable) {
      return 'border-l-green-500 border-l-4';
    }
    return 'border-l-gray-300 border-l-4';
  };

  // Get operational state badge styling
  const getOperationalBadgeStyle = () => {
    if (isGrounded) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (isInMaintenance) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (isAvailable) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Extract vehicle details
  const vehicleType = vehicle.vehicle_type || vehicle.type || 'Vehicle';
  const makeModel = (vehicle.make && vehicle.model) 
    ? `${vehicle.make} ${vehicle.model}`.trim() 
    : '';
  const vehicleName = vehicle.vehicle_name || vehicle.vehicleName || 'Unknown Vehicle';

  const handleClick = () => {
    logger.debug(`Enhanced fleet card clicked for vehicle ${vehicle.id}`);
    onView(vehicle.id!, 'details');
  };

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden relative flex flex-col h-full cursor-pointer transition-all duration-300",
          "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/5",
          "hover:scale-[1.02] hover:-translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "group bg-white border-3",
          getBorderColor(),
          "shadow-lg hover:shadow-xl"
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`View fleet details for ${vehicleName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Enhanced Header with three-column layout and light blue background */}
        <div className="px-5 pt-4 pb-3 bg-blue-50/80 border-b border-blue-200/50">
          <div className="flex justify-between items-center gap-4">
            {/* Left Column - Vehicle Type & Make/Model */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-900 line-clamp-1">
                {vehicleType}
              </div>
              {makeModel && (
                <div className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                  {makeModel}
                </div>
              )}
            </div>
            
            {/* Center Column - Vehicle Name (Prominent) */}
            <div className="flex-2 text-center">
              <h3 className="font-bold text-xl leading-tight text-gray-900 group-hover:text-primary transition-colors duration-200">
                {vehicleName}
              </h3>
            </div>
            
            {/* Right Column - Operational State Badge */}
            <div className="flex-1 flex justify-end">
              <Badge 
                variant="outline"
                className={cn(
                  "text-xs font-semibold px-3 py-1 transition-all duration-200 group-hover:shadow-md border-2",
                  getOperationalBadgeStyle()
                )}
              >
                {operationalState}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Enhanced Body content with fleet information */}
        <div className="px-5 pb-5 pt-4 flex flex-col gap-4 flex-grow justify-between bg-white">
          {/* Fleet Information Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* VIN */}
            {vehicle.vin && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div>
                  <div className="text-xs text-gray-500">VIN</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium text-gray-900 truncate cursor-help border-b border-dotted border-gray-400">
                          ...{vehicle.vin.slice(-8)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-mono">{vehicle.vin}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {/* License Plate */}
            {(vehicle.license_plate_number || vehicle.licensePlateNumber) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">License</div>
                  <div className="font-medium text-gray-900">
                    {vehicle.license_plate_number || vehicle.licensePlateNumber}
                  </div>
                </div>
              </div>
            )}

            {/* Year */}
            {vehicle.year && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Year</div>
                  <div className="font-medium text-gray-900">{vehicle.year}</div>
                </div>
              </div>
            )}

            {/* Odometer */}
            {vehicle.odometer && (
              <div className="flex items-center gap-2">
                <Gauge className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">Odometer</div>
                  <div className="font-medium text-gray-900">
                    {vehicle.odometer.toLocaleString()} mi
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Issues Count (only show if there are issues) */}
          {hasIssues && (
            <div className="flex justify-center items-center py-2">
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg transform transition-all duration-300 hover:scale-110 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                {activeIssuesCount} {activeIssuesCount === 1 ? 'Issue' : 'Issues'}
              </div>
            </div>
          )}

          {/* Vehicle Type and Service Type Information */}
          <div className="flex justify-center gap-3">
            {/* Vehicle Type */}
            {vehicleType && (
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Vehicle Type</div>
                <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {vehicleType}
                </div>
              </div>
            )}

            {/* Service Type */}
            {(vehicle.service_type || vehicle.serviceType) && (
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">Service Type</div>
                <div className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                  {vehicle.service_type || vehicle.serviceType}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced visual feedback overlay with subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Subtle inner glow effect */}
        <div className="absolute inset-0 rounded-lg shadow-inner opacity-20 pointer-events-none" />
      </Card>
    </>
  );
}