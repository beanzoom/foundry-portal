import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Map, DollarSign, FileText, ArrowRight, Target, LineChart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PortalInvest() {
  const hostname = window.location.hostname;
  const pathPrefix = hostname === 'portal.localhost' ||
                     hostname.startsWith('portal.') ||
                     hostname.includes('vercel.app') ? '' : '/portal';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-violet-100 rounded-lg">
            <TrendingUp className="h-8 w-8 text-violet-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment Portal</h1>
            <p className="text-gray-600">Explore investment opportunities and company roadmap</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <Card className="mb-8 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-violet-900">Welcome to the Investment Portal</CardTitle>
          <CardDescription className="text-violet-700">
            Access exclusive information about our company's growth trajectory, strategic roadmap,
            and investment opportunities.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Strategic Overview Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Strategic Overview</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Company Roadmap */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Map className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Company Roadmap</CardTitle>
                    <CardDescription>Strategic milestones</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View our comprehensive roadmap outlining key milestones and strategic objectives.
              </p>
              <Link to={`${pathPrefix}/invest/roadmap`}>
                <Button className="w-full" variant="outline">
                  View Roadmap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Competitive Advantages */}
          <Card className="hover:shadow-lg transition-shadow border-purple-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Competitive Advantages</CardTitle>
                    <CardDescription>Why FleetDRMS wins</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Understand our unique positioning and defensible competitive advantages in the market.
              </p>
              <Link to={`${pathPrefix}/invest/competitive-advantages`}>
                <Button className="w-full" variant="outline">
                  View Advantages
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Investment Options */}
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Investment Options</CardTitle>
                    <CardDescription>Active opportunities</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Explore current fundraising round, terms, use of funds, and 12-month milestones.
              </p>
              <Link to={`${pathPrefix}/invest/opportunities`}>
                <Button className="w-full" variant="outline">
                  View Opportunities
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Market Analysis & Projections Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Analysis & Projections</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Market Opportunity Calculator */}
          <Card className="hover:shadow-lg transition-shadow border-purple-200 bg-gradient-to-br from-white to-purple-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Market Opportunity Calculator</CardTitle>
                    <CardDescription>Explore TAM and revenue potential</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Interactive calculator to model total addressable market, penetration scenarios, and
                revenue milestones across the 3,000 DSP market.
              </p>
              <Link to={`${pathPrefix}/invest/calculators/market-opportunity`}>
                <Button className="w-full">
                  Open Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Growth Projections Calculator */}
          <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <LineChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Growth Projections Calculator</CardTitle>
                    <CardDescription>Path to profitability</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Model customer acquisition, burn rate, cash runway, and break-even scenarios with
                transparent assumptions and milestone tracking.
              </p>
              <Link to={`${pathPrefix}/invest/calculators/growth-projections`}>
                <Button className="w-full">
                  Open Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Exclusive Investor Access</h3>
              <p className="text-sm text-blue-700">
                This section is exclusively available to investors and company administrators.
                All information provided here is confidential and should not be shared without
                proper authorization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
