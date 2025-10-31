import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Wrench, AlertTriangle, CheckCircle, Clock, Calendar,
  Activity, TrendingUp, FileText, BarChart3, Shield,
  DollarSign, Gauge, History
} from 'lucide-react';
// Removed: Portal solutions component no longer available
// import { SimulatedVehicleCard } from '@/pages/portal/solutions/components/SimulatedVehicleCard';
import { MaintenanceRecord } from '@/features/maintenance/types';

export function MaintenanceDemoSlide() {

  // Mock vehicle data that matches fleet structure
  const demoVehicle = {
    id: 'demo-maintenance-1',
    vehicle_name: 'Van 18',
    make: 'Mercedes-Benz',
    model: 'Sprinter 2500',
    year: '2022',
    vehicle_type: 'Cargo Van',
    operational_state: 'Grounded', // Changed to show red badge
    odometer: 45678,
    organization_id: 'demo-org-1',
    vin: 'DEMO123456789',
    last_maintenance: '2024-02-15',
    next_maintenance_due: '2024-03-15'
  };

  // Mock maintenance records - 5 issues (3 needing fixes, 2 scheduled maintenance)
  const mockMaintenanceRecords: MaintenanceRecord[] = [
    {
      id: 'maint-1',
      vehicle_id: demoVehicle.id,
      issue_title: 'Cracked Windshield',
      issue_description: 'Large crack on driver side windshield obstructing view. Safety hazard requiring immediate replacement.',
      location: 'Windshield',
      maintenance_record_status: 'In Progress',
      severity: 5, // Critical severity
      date_due: '2024-03-10',
      created_at: '2024-02-28',
      created_by: 'driver-report',
      fleet: demoVehicle,
      profiles: {
        id: 'user-1',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@demo.com',
        user_roles: [
          { role: 'driver' }
        ]
      }
    },
    {
      id: 'maint-2',
      vehicle_id: demoVehicle.id,
      issue_title: 'Sliding Door Not Opening',
      issue_description: 'Passenger side sliding door stuck closed. Motor failure suspected. Cannot access cargo area.',
      location: 'Body/Doors',
      maintenance_record_status: 'Requires Authorization',
      severity: 5, // Critical severity
      date_due: '2024-03-11',
      created_at: '2024-03-01',
      created_by: 'driver-report',
      fleet: demoVehicle,
      profiles: {
        id: 'user-2',
        first_name: 'Mike',
        last_name: 'Johnson',
        email: 'mike.johnson@demo.com',
        user_roles: [
          { role: 'driver' }
        ]
      }
    },
    {
      id: 'maint-3',
      vehicle_id: demoVehicle.id,
      issue_title: 'Check Engine Light On',
      issue_description: 'Check engine light illuminated. Diagnostic scan shows O2 sensor failure. Vehicle running rough.',
      location: 'Engine',
      maintenance_record_status: 'Waiting for Parts',
      severity: 4, // High severity
      date_due: '2024-03-12',
      created_at: '2024-03-02',
      created_by: 'inspection',
      fleet: demoVehicle,
      profiles: {
        id: 'user-3',
        first_name: 'Tom',
        last_name: 'Wilson',
        email: 'tom.wilson@demo.com',
        user_roles: [
          { role: 'tech' }
        ]
      }
    },
    {
      id: 'maint-4',
      vehicle_id: demoVehicle.id,
      issue_title: 'Oil Change Service Due',
      issue_description: 'Scheduled oil change service due at 45,000 miles. Currently at 44,850 miles.',
      location: 'Engine',
      maintenance_record_status: 'Scheduled',
      severity: 2, // Low severity
      date_due: '2024-03-15',
      created_at: '2024-03-05',
      created_by: 'system-auto',
      fleet: demoVehicle,
      profiles: {
        id: 'system',
        first_name: 'System',
        last_name: 'Auto',
        email: 'system@demo.com',
        user_roles: [
          { role: 'admin' }
        ]
      }
    },
    {
      id: 'maint-5',
      vehicle_id: demoVehicle.id,
      issue_title: '50K Mile Service',
      issue_description: 'Comprehensive 50,000 mile service including transmission fluid, brake fluid, and filter replacements.',
      location: 'Multiple',
      maintenance_record_status: 'Scheduled',
      severity: 3, // Medium severity
      date_due: '2024-03-20',
      created_at: '2024-03-07',
      created_by: 'system-auto',
      fleet: demoVehicle,
      profiles: {
        id: 'system',
        first_name: 'System',
        last_name: 'Auto',
        email: 'system@demo.com',
        user_roles: [
          { role: 'admin' }
        ]
      }
    }
  ];

  const features = [
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "Severity-Based Prioritization",
      description: "Issues categorized by severity for efficient resource allocation"
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Real-time Issue Tracking",
      description: "Live updates on maintenance status and progress"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Driver Maintenance Visibility",
      description: "Drivers see vehicle issues before dispatch and can report new problems"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Interactive Maintenance Dialogs",
      description: "Detailed maintenance records with full service history"
    },
    {
      icon: <History className="h-5 w-5" />,
      title: "Complete Service History",
      description: "Track all maintenance activities with costs and outcomes"
    },
    {
      icon: <Activity className="h-5 w-5" />,
      title: "Operational State Integration",
      description: "Vehicle status reflects current maintenance requirements"
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Maintenance Card Demo */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Interactive Maintenance Card</h3>
          <p className="text-gray-600 mb-6">
            Click the card below to explore the comprehensive maintenance management system
          </p>

          <div className="max-w-md mx-auto">
            {/* Removed: Portal solutions component no longer available */}
            <Card>
              <CardContent className="p-6">
                <p className="text-gray-500 text-center">
                  Demo vehicle card removed (was portal component)
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Metrics Display */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-900">5</p>
                <p className="text-sm text-gray-600">Active Issues</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">89%</p>
                <p className="text-sm text-gray-600">On-Time Service</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">2.3h</p>
                <p className="text-sm text-gray-600">Avg Resolution</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <History className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">4.2d</p>
                <p className="text-sm text-gray-600">Avg Issue Age</p>
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
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Value Proposition */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader>
            <CardTitle className="text-lg">Why FleetDRMS Maintenance?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Reduce vehicle breakdowns</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Predictive maintenance scheduling</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Complete maintenance history tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Issue Prioritization Management</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Cost optimization and analytics</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}