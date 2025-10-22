import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, DollarSign, Target, Info } from 'lucide-react';
import { MARKET_DATA, PRICING_TIERS } from '@/lib/portal/investmentConstants';

export function MarketOpportunityCalculator() {
  const hostname = window.location.hostname;
  const pathPrefix = hostname === 'portal.localhost' ||
                     hostname.startsWith('portal.') ||
                     hostname.includes('vercel.app') ? '' : '/portal';

  // State for calculator inputs
  const [marketPenetration, setMarketPenetration] = useState(2); // percentage
  const [avgFleetSize, setAvgFleetSize] = useState(MARKET_DATA.averageFleetSize.default);
  const [pricePerVehicle, setPricePerVehicle] = useState(PRICING_TIERS.professional.price);
  const [totalDSPs] = useState(MARKET_DATA.totalDSPs);

  // Calculations
  const targetCustomers = Math.round((totalDSPs * marketPenetration) / 100);
  const totalVehicles = targetCustomers * avgFleetSize;
  const monthlyRecurringRevenue = totalVehicles * pricePerVehicle;
  const annualRecurringRevenue = monthlyRecurringRevenue * 12;

  // Market share in vehicles
  const totalMarketVehicles = (MARKET_DATA.totalVehicles.min + MARKET_DATA.totalVehicles.max) / 2;
  const vehicleMarketShare = ((totalVehicles / totalMarketVehicles) * 100).toFixed(2);

  // Revenue milestones
  const customersForMilestone = (targetARR: number) => {
    const vehiclesNeeded = targetARR / (pricePerVehicle * 12);
    const customersNeeded = Math.ceil(vehiclesNeeded / avgFleetSize);
    const penetrationNeeded = ((customersNeeded / totalDSPs) * 100).toFixed(2);
    return { customersNeeded, penetrationNeeded };
  };

  const milestone1M = customersForMilestone(1_000_000);
  const milestone5M = customersForMilestone(5_000_000);
  const milestone10M = customersForMilestone(10_000_000);

  // TAM Funnel data
  const totalMarketARR = (MARKET_DATA.annualTAM.min + MARKET_DATA.annualTAM.max) / 2;
  const addressableMarketARR = totalMarketARR * 0.7; // 70% addressable (those actively seeking solutions)
  const targetMarketARR = totalMarketARR * 0.3; // 30% target (early adopters)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link to={`${pathPrefix}/invest`}>
          <Button variant="ghost" className="mb-4">
            ← Back to Investment Portal
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Market Opportunity Calculator</h1>
            <p className="text-gray-600">Explore the total addressable market and revenue potential</p>
          </div>
        </div>
      </div>

      {/* Market Context */}
      <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-purple-900 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Market Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Total DSPs (USA)</div>
              <div className="text-2xl font-bold text-purple-900">{MARKET_DATA.totalDSPs.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Total Vehicles</div>
              <div className="text-2xl font-bold text-purple-900">
                {(MARKET_DATA.totalVehicles.min / 1000).toFixed(0)}-{(MARKET_DATA.totalVehicles.max / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Annual TAM</div>
              <div className="text-2xl font-bold text-purple-900">
                ${(MARKET_DATA.annualTAM.min / 1_000_000).toFixed(0)}-${(MARKET_DATA.annualTAM.max / 1_000_000).toFixed(0)}M
              </div>
            </div>
            <div className="p-4 bg-white rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Avg Fleet Size</div>
              <div className="text-2xl font-bold text-purple-900">
                {MARKET_DATA.averageFleetSize.min}-{MARKET_DATA.averageFleetSize.max}
              </div>
            </div>
          </div>
          <p className="text-sm text-purple-700 mt-4">
            Based on market research: 3,000 DSPs operating 60,000-120,000 vehicles across the USA.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Model Your Scenario</CardTitle>
              <CardDescription>Adjust the variables below to explore different market scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Market Penetration Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Market Penetration</label>
                  <Badge variant="outline" className="text-lg font-bold">
                    {marketPenetration.toFixed(1)}%
                  </Badge>
                </div>
                <Slider
                  value={[marketPenetration]}
                  onValueChange={(value) => setMarketPenetration(value[0])}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5%</span>
                  <span>10%</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Percentage of total DSP market captured
                </p>
              </div>

              {/* Average Fleet Size Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Average Fleet Size</label>
                  <Badge variant="outline" className="text-lg font-bold">
                    {avgFleetSize} vehicles
                  </Badge>
                </div>
                <Slider
                  value={[avgFleetSize]}
                  onValueChange={(value) => setAvgFleetSize(value[0])}
                  min={MARKET_DATA.averageFleetSize.min}
                  max={MARKET_DATA.averageFleetSize.max}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{MARKET_DATA.averageFleetSize.min}</span>
                  <span>{MARKET_DATA.averageFleetSize.max}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Average number of vehicles per DSP customer
                </p>
              </div>

              {/* Price Per Vehicle Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Price Per Vehicle/Month</label>
                  <Badge variant="outline" className="text-lg font-bold">
                    ${pricePerVehicle}
                  </Badge>
                </div>
                <Slider
                  value={[pricePerVehicle]}
                  onValueChange={(value) => setPricePerVehicle(value[0])}
                  min={PRICING_TIERS.starter.price}
                  max={PRICING_TIERS.enterprise.price}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${PRICING_TIERS.starter.price}</span>
                  <span>${PRICING_TIERS.enterprise.price}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>Starter (${PRICING_TIERS.starter.price})</span>
                  <span>Professional (${PRICING_TIERS.professional.price})</span>
                  <span>Enterprise (${PRICING_TIERS.enterprise.price})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TAM Funnel Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Market Funnel
              </CardTitle>
              <CardDescription>From total market to your capture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Total Market */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Total Market (100%)</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(totalMarketARR / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-full h-3 bg-purple-200 rounded-full" />
                  <p className="text-xs text-gray-600 mt-1">All DSPs in USA</p>
                </div>

                {/* Addressable Market */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Addressable (70%)</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(addressableMarketARR / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-[70%] h-3 bg-purple-300 rounded-full" />
                  <p className="text-xs text-gray-600 mt-1">DSPs seeking software solutions</p>
                </div>

                {/* Target Market */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Target (30%)</span>
                    <span className="text-sm font-bold text-gray-900">
                      ${(targetMarketARR / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="w-[30%] h-3 bg-purple-400 rounded-full" />
                  <p className="text-xs text-gray-600 mt-1">Early adopters &amp; tech-forward DSPs</p>
                </div>

                {/* Your Capture */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Your Capture ({marketPenetration}%)</span>
                    <span className="text-sm font-bold text-purple-700">
                      ${(annualRecurringRevenue / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                  <div
                    className="h-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    style={{ width: `${marketPenetration * 10}%` }}
                  />
                  <p className="text-xs text-gray-600 mt-1">Your projected market share</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {/* Revenue Results Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Revenue Projection
              </CardTitle>
              <CardDescription>At {marketPenetration}% market penetration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Customers */}
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Target Customers</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">{targetCustomers.toLocaleString()}</div>
                  <p className="text-xs text-gray-600 mt-1">DSPs ({marketPenetration}% of {totalDSPs.toLocaleString()})</p>
                </div>

                {/* Vehicles */}
                <div className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Total Vehicles</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">{totalVehicles.toLocaleString()}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {vehicleMarketShare}% of total market vehicles
                  </p>
                </div>

                {/* MRR */}
                <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg border border-purple-300">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-purple-700" />
                    <span className="text-sm font-medium text-purple-900">Monthly Recurring Revenue</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-900">
                    ${monthlyRecurringRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-purple-700 mt-1">
                    {totalVehicles.toLocaleString()} vehicles × ${pricePerVehicle}/vehicle
                  </p>
                </div>

                {/* ARR */}
                <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg border border-purple-800 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Annual Recurring Revenue</span>
                  </div>
                  <div className="text-4xl font-bold text-white">
                    ${(annualRecurringRevenue / 1_000_000).toFixed(2)}M
                  </div>
                  <p className="text-xs text-purple-200 mt-1">
                    ${monthlyRecurringRevenue.toLocaleString()} MRR × 12 months
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestone Card */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Milestones</CardTitle>
              <CardDescription>Customers needed to reach key ARR targets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* $1M ARR */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-green-900">$1M ARR</span>
                    <Badge variant="outline" className="bg-white">
                      {milestone1M.penetrationNeeded}% penetration
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-green-700 mb-1">
                    {milestone1M.customersNeeded.toLocaleString()} customers
                  </div>
                  <p className="text-xs text-green-700">
                    {(milestone1M.customersNeeded * avgFleetSize).toLocaleString()} vehicles @ ${pricePerVehicle}/vehicle
                  </p>
                </div>

                {/* $5M ARR */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-900">$5M ARR</span>
                    <Badge variant="outline" className="bg-white">
                      {milestone5M.penetrationNeeded}% penetration
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 mb-1">
                    {milestone5M.customersNeeded.toLocaleString()} customers
                  </div>
                  <p className="text-xs text-blue-700">
                    {(milestone5M.customersNeeded * avgFleetSize).toLocaleString()} vehicles @ ${pricePerVehicle}/vehicle
                  </p>
                </div>

                {/* $10M ARR */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-900">$10M ARR</span>
                    <Badge variant="outline" className="bg-white">
                      {milestone10M.penetrationNeeded}% penetration
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 mb-1">
                    {milestone10M.customersNeeded.toLocaleString()} customers
                  </div>
                  <p className="text-xs text-purple-700">
                    {(milestone10M.customersNeeded * avgFleetSize).toLocaleString()} vehicles @ ${pricePerVehicle}/vehicle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conservative Approach Note */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Info className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Conservative Modeling</h4>
                  <p className="text-xs text-blue-700">
                    Default scenario uses 2% market penetration, 30-vehicle average fleet, and $32/vehicle
                    pricing (Professional tier). These conservative assumptions demonstrate achievable revenue
                    targets while accounting for market adoption curves and competitive dynamics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Next Steps Card */}
      <Card className="mt-6 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Explore Growth Projections</h3>
              <p className="text-sm text-gray-600 mb-4">
                See how we plan to reach these milestones with transparent burn rate modeling
                and customer acquisition forecasts.
              </p>
              <Link to={`${pathPrefix}/invest/calculators/growth-projections`}>
                <Button>
                  View Growth Calculator
                  <TrendingUp className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Learn About Our Advantages</h3>
              <p className="text-sm text-gray-600 mb-4">
                Understand what makes FleetDRMS uniquely positioned to capture this market opportunity.
              </p>
              <Link to={`${pathPrefix}/invest/competitive-advantages`}>
                <Button variant="outline">
                  Competitive Advantages
                  <Target className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
