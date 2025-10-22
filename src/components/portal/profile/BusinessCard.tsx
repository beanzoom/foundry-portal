import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  Truck,
  Users,
  Calendar,
  Edit,
  UserCheck
} from 'lucide-react';

interface Business {
  id: string;
  company_name: string;
  website?: string;
  email: string;
  phone: string;
  mobile?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  is_amazon_dsp: boolean;
  year_dsp_began?: number;
  avg_fleet_vehicles?: number;
  avg_drivers?: number;
  station_name?: string;
}

interface BusinessCardProps {
  business: Business;
  userRole?: string; // User's role in this business
  isPrimary?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  onManagePeople?: () => void;
}

export function BusinessCard({
  business,
  userRole,
  isPrimary,
  canEdit,
  onEdit,
  onManagePeople
}: BusinessCardProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>{business.company_name}</span>
            </CardTitle>

            <div className="flex items-center space-x-2">
              {isPrimary && (
                <Badge variant="default" className="text-xs">Primary</Badge>
              )}
              {business.is_amazon_dsp && (
                <Badge className="bg-orange-100 text-orange-800 text-xs">
                  Amazon DSP
                </Badge>
              )}
              {business.station_name && (
                <Badge variant="outline" className="text-xs">
                  {business.station_name}
                </Badge>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" onClick={onManagePeople}>
                <UserCheck className="h-4 w-4 mr-1" />
                People
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>

        {userRole && (
          <div className="mt-2">
            <span className="text-sm text-gray-600">Your Role: </span>
            <span className="text-sm font-medium">{userRole}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Contact Information</h4>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${business.email}`} className="text-blue-600 hover:underline">
                  {business.email}
                </a>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{business.phone}</span>
              </div>

              {business.mobile && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{business.mobile} (Mobile)</span>
                </div>
              )}

              {business.website && (
                <div className="flex items-center space-x-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {business.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Address</h4>

            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <div>
                <p>{business.street1}</p>
                {business.street2 && <p>{business.street2}</p>}
                <p>{business.city}, {business.state} {business.zip}</p>
              </div>
            </div>
          </div>
        </div>

        {/* DSP Metrics (if applicable) */}
        {business.is_amazon_dsp && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">DSP Operations</h4>

            <div className="grid grid-cols-3 gap-4">
              {business.year_dsp_began && (
                <div className="text-center">
                  <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">DSP Since</p>
                  <p className="font-semibold">{business.year_dsp_began}</p>
                </div>
              )}

              {business.avg_fleet_vehicles && (
                <div className="text-center">
                  <Truck className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Fleet Size</p>
                  <p className="font-semibold">{business.avg_fleet_vehicles}</p>
                </div>
              )}

              {business.avg_drivers && (
                <div className="text-center">
                  <Users className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Avg Drivers</p>
                  <p className="font-semibold">{business.avg_drivers}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}