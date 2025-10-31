import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Truck, MapPin, Package, Clock, AlertTriangle, CheckCircle,
  User, MoreVertical, Activity, Fuel, Wrench, Calendar,
  TrendingUp, Battery, Navigation, FileText
} from 'lucide-react';
import { EnhancedFleetCard } from './EnhancedFleetCard';
import { FleetDetailsDemoDialog } from './FleetDetailsDemoDialog';
import { SimulatedFleetEditDialog } from '../SimulatedFleetEditDialog';

export function FleetManagementDemoSlide() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Mock vehicle data for demo
  const demoVehicle = {
    id: 'demo-1',
    vehicle_name: 'Van 18',
    make: 'Mercedes-Benz',
    model: 'Sprinter 2500',
    year: '2022',
    status: 'active',
    operational_state: 'Available',
    location: '123 Main St, Seattle, WA',
    current_driver: 'Sarah Johnson',
    driver_id: 'driver-123',
    route_number: 'SEA-42',
    packages_delivered: 87,
    packages_remaining: 23,
    fuel_level: 65,
    last_maintenance: '2024-02-15',
    next_maintenance_due: '2024-03-15',
    license_plate_number: 'ABC-1234',
    vin: '1HGBH41JXMN109186',
    insurance_expiry: '2024-12-31',
    registration_expiry: '2024-11-30',
    mileage: 45678,
    odometer: 45678,
    vehicle_type: 'Cargo Van',
    created_at: '2023-01-15',
    updated_at: '2024-03-10',
    // Service Information
    service_type: 'Delivery',
    service_tier: 'Premium',
    subservice_type: 'Last Mile',
    subservice_type2: 'Express',
    station_code: 'SEA1',
    pm_stats: 'Active',
    last_service_date: '2024-02-15',
    // Ownership Information
    ownership_type: 'Leased',
    vehicle_provider: 'Enterprise Fleet',
    vehicle_registration_type: 'Commercial',
    registered_state: 'WA',
    subcontractor_name: 'N/A',
    ownership_start_date: '2023-01-15',
    ownership_end_date: null,
    registration_expiry_date: '2024-11-30',
    // Maintenance status
    active_maintenance_count: 0
  };

  const handleCardClick = useCallback((vehicleId: string) => {
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const features = [
    {
      icon: <Truck className="h-5 w-5" />,
      title: "Real-time Vehicle Status",
      description: "Live updates on vehicle location, driver, and route progress"
    },
    {
      icon: <Wrench className="h-5 w-5" />,
      title: "Maintenance Alerts",
      description: "Proactive notifications for maintenance schedules",
      planned: true
    },
    {
      icon: <Navigation className="h-5 w-5" />,
      title: "Interactive Dialog System",
      description: "Drill down into detailed vehicle information with intuitive navigation"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Integrated Real-Time Maintenance History Views",
      description: "Access complete maintenance records and service history instantly"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Full Vehicle Detail Information",
      description: "Comprehensive vehicle data including ownership, service, and operational details"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Fleet Card Demo */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Interactive Fleet Card</h3>
          <p className="text-gray-600 mb-6">
            Click the card below to explore the comprehensive vehicle management system
          </p>
          
          <div className="max-w-md mx-auto">
            <EnhancedFleetCard
              vehicle={demoVehicle}
              onView={handleCardClick}
            />
          </div>
        </div>

        {/* Key Metrics Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fleet Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">94%</p>
                <p className="text-sm text-gray-600">Fleet Utilization</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">142</p>
                <p className="text-sm text-gray-600">Active Vehicles</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">156</p>
                <p className="text-sm text-gray-600">Active Drivers</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Package className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-900">3,847</p>
                <p className="text-sm text-gray-600">Daily Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Feature Highlights */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Key Features</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                        {feature.planned && (
                          <Badge variant="outline" className="text-xs">
                            Planned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg">Why FleetDRMS?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Reduce fleet downtime</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Real-time visibility across entire fleet</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Complete fleet vehicle management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Comprehensive historical maintenance history</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Details Dialog */}
      {dialogOpen && (
        <FleetDetailsDemoDialog
          vehicle={demoVehicle}
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onEdit={() => {
            setEditDialogOpen(true);
          }}
        />
      )}

      {/* Fleet Edit Dialog */}
      {editDialogOpen && (
        <SimulatedFleetEditDialog
          isOpen={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          vehicle={demoVehicle}
          maintenanceRecords={[]}
        />
      )}
    </div>
  );
}