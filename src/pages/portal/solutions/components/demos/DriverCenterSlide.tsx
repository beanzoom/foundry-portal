import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Package, Route, Clock, Star, CheckCircle,
  Calendar, AlertTriangle, Truck, BarChart3, Settings,
  Shield, Navigation, Phone, MessageSquare, Award
} from 'lucide-react';
import DriverCenterWireframe from '../feature-wireframes/driver-center/DriverCenterWireframe';

export function DriverCenterSlide() {
  const features = [
    {
      icon: <User className="h-5 w-5" />,
      title: "Your DEP (Driver Experience Preference)",
      description: "Personalized settings for route preferences, vehicle choices, and work schedules",
      highlight: true
    },
    {
      icon: <Route className="h-5 w-5" />,
      title: "Pre-Route Planning & Check-In",
      description: "Complete vehicle inspections, review route details, and prepare for departure"
    },
    {
      icon: <AlertTriangle className="h-5 w-5" />,
      title: "Add Maintenance Records in Real-Time",
      description: "Report vehicle issues instantly, attach photos, and track repair status"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Performance Dashboard",
      description: "View personal Netradyne metrics and performance trends"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Route History and Vehicle Maintenance Record views",
      description: "Access complete history of routes driven and maintenance issues reported"
    }
  ];

  const driverCapabilities = [
    {
      title: "Vehicle Selection",
      description: "Choose preferred vehicles based on DEP settings",
      icon: <Truck className="h-4 w-4" />
    },
    {
      title: "Route Preferences",
      description: "Set preferences for route types and delivery areas",
      icon: <Navigation className="h-4 w-4" />
    },
    {
      title: "Schedule Management",
      description: "View current and upcoming work schedule",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: "Issue Reporting",
      description: "Report vehicle or delivery issues instantly",
      icon: <AlertTriangle className="h-4 w-4" />
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Column - Driver Center Demo */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Driver Command Center</h3>
          <p className="text-gray-600 mb-6">
            Empowering drivers with personalized tools and real-time information
          </p>
          
          {/* Embedded Wireframe */}
          <div className="border rounded-lg overflow-hidden shadow-lg">
            <div className="transform scale-90 origin-top">
              <DriverCenterWireframe />
            </div>
          </div>
        </div>

        {/* Driver Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Driver Experience Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-teal-50 rounded-lg">
                <User className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-teal-900">156</p>
                <p className="text-sm text-gray-600">Active Drivers</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Star className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-900">4.8</p>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">3,847</p>
                <p className="text-sm text-gray-600">Daily Deliveries</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">8.5h</p>
                <p className="text-sm text-gray-600">Avg Route Time</p>
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
              <Card key={index} className={`hover:shadow-md transition-shadow ${feature.highlight ? 'ring-2 ring-teal-500' : ''}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 ${feature.highlight ? 'bg-teal-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                        {feature.highlight && (
                          <Badge className="bg-teal-500 text-white">Featured</Badge>
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

        {/* Driver Capabilities */}
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="text-lg">What Drivers Can Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverCapabilities.map((capability, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    {capability.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{capability.title}</p>
                    <p className="text-xs text-gray-600">{capability.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-teal-200">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-600" />
                <p className="text-sm font-medium">DEP System Benefits:</p>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Increased driver satisfaction</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Reduced turnover through personalization</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Better route-driver matching</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Improved delivery performance</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}