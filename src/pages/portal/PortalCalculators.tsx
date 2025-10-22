import { Calculator, Lightbulb, CheckCircle } from "lucide-react";
import { CostSavingsCalculator } from "@/components/portal/calculators/CostSavingsCalculator";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

export function PortalCalculators() {
  // Check if we're on subdomain to determine path prefix
  const isSubdomain = window.location.hostname === 'portal.localhost' ||
                     window.location.hostname.startsWith('portal.');
  const pathPrefix = isSubdomain ? '' : '/portal';

  return (
    <div className="p-6">
      <div className="max-w-7xl">
        {/* Header - Left aligned like other portal pages */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Financial Calculators</h1>
          <p className="text-muted-foreground mt-1">
            Calculate potential savings and ROI for your DSP operations
          </p>
        </div>

        {/* Instructional Card */}
        <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Maximize Your Savings Potential</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                After exploring our <Link to={`${pathPrefix}/solutions`} className="text-blue-600 hover:text-blue-700 font-medium underline">Current Solutions showcase</Link>,
                use this calculator to identify specific cost-saving opportunities the FleetDRMS solution can deliver for your business.
                Input your current operational metrics to see projected savings in communication efficiency, process automation,
                and operational optimization.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Customize calculations based on your fleet size and operational needs</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Calculator Content */}
        <CostSavingsCalculator />
      </div>
    </div>
  );
}