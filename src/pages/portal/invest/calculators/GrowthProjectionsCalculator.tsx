import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, AlertCircle, Target, Info } from 'lucide-react';
import { MARKET_DATA, PRICING_TIERS, COMPANY_METRICS } from '@/lib/portal/investmentConstants';

export function GrowthProjectionsCalculator() {
  const hostname = window.location.hostname;
  const pathPrefix = hostname === 'portal.localhost' ||
                     hostname.startsWith('portal.') ||
                     hostname.includes('vercel.app') ? '' : '/portal';

  // State for calculator inputs
  const [launchMonth, setLaunchMonth] = useState(COMPANY_METRICS.pilots.launchMonth);
  const [initialCustomers, setInitialCustomers] = useState(COMPANY_METRICS.pilots.count);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(15); // percentage
  const [minCustomersPerMonth, setMinCustomersPerMonth] = useState(4); // minimum new customers per month
  const [avgFleetSize, setAvgFleetSize] = useState(MARKET_DATA.averageFleetSize.default);
  const [pricePerVehicle, setPricePerVehicle] = useState(PRICING_TIERS.professional.price);
  const [capitalRaised, setCapitalRaised] = useState(COMPANY_METRICS.capitalRaise.target);

  // Calculate monthly projections
  const generateProjections = () => {
    const months = [];
    let customers = 0;
    let cash = capitalRaised;

    for (let month = 0; month <= 24; month++) {
      // Customer growth
      if (month < launchMonth) {
        customers = 0; // Pre-launch
      } else if (month === launchMonth) {
        customers = initialCustomers; // Launch with pilot customers
      } else {
        // Calculate percentage-based growth
        const growthFactor = 1 + (monthlyGrowthRate / 100);
        const percentageGrowth = Math.round(customers * growthFactor);

        // Calculate minimum growth (previous + minimum new customers)
        const minimumGrowth = customers + minCustomersPerMonth;

        // Use the greater of percentage growth or minimum growth
        customers = Math.max(percentageGrowth, minimumGrowth);
      }

      // Revenue
      const vehicles = customers * avgFleetSize;
      const mrr = vehicles * pricePerVehicle;
      const arr = mrr * 12;

      // Burn rate
      const burnRate = month < launchMonth
        ? COMPANY_METRICS.burnRate.preLaunch
        : COMPANY_METRICS.burnRate.postLaunch;

      // Cash calculation
      if (month > 0) {
        cash = cash + mrr - burnRate;
      }

      // Runway in months (how many months until cash runs out)
      const netBurn = burnRate - mrr;
      const runway = cash > 0 && netBurn > 0 ? Math.floor(cash / netBurn) : 0;

      months.push({
        month,
        monthLabel: `M${month}`,
        customers,
        vehicles,
        mrr: mrr / 1000, // Convert to thousands for charting
        mrrRaw: mrr, // Keep raw for calculations
        arr: arr / 1000, // Convert to thousands for charting
        burnRate: burnRate / 1000, // Convert to thousands for charting
        burnRateRaw: burnRate, // Keep raw for calculations
        cash: cash / 1000, // Convert to thousands
        netCashFlow: (mrr - burnRate) / 1000, // Convert to thousands
        runway: Math.max(0, runway),
        breakEven: mrr >= burnRate
      });
    }

    return months;
  };

  const projections = generateProjections();

  // Find break-even month
  const breakEvenMonth = projections.find(p => p.breakEven);
  const finalMonth = projections[projections.length - 1];
  const cashRunoutMonth = projections.findIndex(p => p.cash <= 0);

  // Calculate metrics
  const month6 = projections[6];
  const month12 = projections[12];
  const month18 = projections[18];
  const month24 = projections[24];

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
          <div className="p-3 bg-blue-100 rounded-lg">
            <LineChart className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Growth Projections Calculator</h1>
            <p className="text-gray-600">Model customer acquisition and path to profitability</p>
          </div>
        </div>
      </div>

      {/* Funding Context */}
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Funding Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Capital Raise Target</div>
              <div className="text-2xl font-bold text-blue-900">
                ${(COMPANY_METRICS.capitalRaise.target / 1000).toFixed(0)}K
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Range: ${(COMPANY_METRICS.capitalRaise.min / 1000).toFixed(0)}K - ${(COMPANY_METRICS.capitalRaise.max / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Pre-Launch Burn</div>
              <div className="text-2xl font-bold text-blue-900">
                ${(COMPANY_METRICS.burnRate.preLaunch / 1000).toFixed(0)}K/mo
              </div>
              <p className="text-xs text-gray-600 mt-1">Months 0-{launchMonth}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Post-Launch Burn</div>
              <div className="text-2xl font-bold text-blue-900">
                ${(COMPANY_METRICS.burnRate.postLaunch / 1000).toFixed(0)}K/mo
              </div>
              <p className="text-xs text-gray-600 mt-1">Month {launchMonth}+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Inputs (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Growth Assumptions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Growth Assumptions</CardTitle>
              <CardDescription>Adjust variables to model different scenarios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Launch Month */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Launch Month</label>
                  <Badge variant="outline" className="text-base font-bold">
                    Month {launchMonth}
                  </Badge>
                </div>
                <Slider
                  value={[launchMonth]}
                  onValueChange={(value) => setLaunchMonth(value[0])}
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  When beta product launches
                </p>
              </div>

              {/* Initial Customers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Pilot Customers</label>
                  <Badge variant="outline" className="text-base font-bold">
                    {initialCustomers}
                  </Badge>
                </div>
                <Slider
                  value={[initialCustomers]}
                  onValueChange={(value) => setInitialCustomers(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Launch with warm leads
                </p>
              </div>

              {/* Monthly Growth Rate */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Monthly Growth %</label>
                  <Badge variant="outline" className="text-base font-bold">
                    {monthlyGrowthRate}%
                  </Badge>
                </div>
                <Slider
                  value={[monthlyGrowthRate]}
                  onValueChange={(value) => setMonthlyGrowthRate(value[0])}
                  min={5}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5% (Conservative)</span>
                  <span>30% (Aggressive)</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Percentage-based growth rate
                </p>
              </div>

              {/* Minimum Customers Per Month */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Min New Customers/Mo</label>
                  <Badge variant="outline" className="text-base font-bold">
                    {minCustomersPerMonth}
                  </Badge>
                </div>
                <Slider
                  value={[minCustomersPerMonth]}
                  onValueChange={(value) => setMinCustomersPerMonth(value[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Minimum guaranteed from campaigns/shows
                </p>
              </div>

              {/* Fleet Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Avg Fleet Size</label>
                  <Badge variant="outline" className="text-base font-bold">
                    {avgFleetSize}
                  </Badge>
                </div>
                <Slider
                  value={[avgFleetSize]}
                  onValueChange={(value) => setAvgFleetSize(value[0])}
                  min={20}
                  max={40}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Vehicles per customer
                </p>
              </div>

              {/* Price Per Vehicle */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Price/Vehicle/Mo</label>
                  <Badge variant="outline" className="text-base font-bold">
                    ${pricePerVehicle}
                  </Badge>
                </div>
                <Slider
                  value={[pricePerVehicle]}
                  onValueChange={(value) => setPricePerVehicle(value[0])}
                  min={25}
                  max={40}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Average revenue per vehicle
                </p>
              </div>

              {/* Capital Raised */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Capital Raised</label>
                  <Badge variant="outline" className="text-base font-bold">
                    ${(capitalRaised / 1000).toFixed(0)}K
                  </Badge>
                </div>
                <Slider
                  value={[capitalRaised]}
                  onValueChange={(value) => setCapitalRaised(value[0])}
                  min={COMPANY_METRICS.capitalRaise.min}
                  max={COMPANY_METRICS.capitalRaise.max}
                  step={50000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${(COMPANY_METRICS.capitalRaise.min / 1000).toFixed(0)}K</span>
                  <span>${(COMPANY_METRICS.capitalRaise.max / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Milestones Card */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Key Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {breakEvenMonth ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Break-Even</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">Month {breakEvenMonth.month}</div>
                  <p className="text-xs text-green-700 mt-1">
                    {breakEvenMonth.customers} customers, ${breakEvenMonth.mrr.toFixed(1)}K MRR
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">Break-Even</span>
                  </div>
                  <div className="text-base font-bold text-amber-700">Not reached in 24 months</div>
                  <p className="text-xs text-amber-700 mt-1">
                    Increase growth rate or reduce burn
                  </p>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Month 12</div>
                <div className="text-xl font-bold text-blue-900">
                  {month12.customers} customers
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  ${month12.mrr.toFixed(1)}K MRR, ${month12.arr.toFixed(1)}K ARR
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Month 24</div>
                <div className="text-xl font-bold text-purple-900">
                  {month24.customers} customers
                </div>
                <p className="text-xs text-purple-700 mt-1">
                  ${month24.mrr.toFixed(1)}K MRR, ${month24.arr.toFixed(1)}K ARR
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* MRR vs Burn Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Burn Rate</CardTitle>
              <CardDescription>Monthly recurring revenue compared to operating costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis
                    label={{ value: '$ (thousands)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(1)}K`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                  {breakEvenMonth && (
                    <ReferenceLine
                      x={`M${breakEvenMonth.month}`}
                      stroke="#22c55e"
                      strokeDasharray="3 3"
                      label={{ value: 'Break-Even', position: 'top', fill: '#22c55e' }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="MRR"
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="burnRate"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Burn Rate"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cash Runway Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cash Position</CardTitle>
              <CardDescription>Available cash over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis
                    label={{ value: '$ (thousands)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(1)}K`}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                  {cashRunoutMonth > 0 && (
                    <ReferenceLine
                      x={`M${cashRunoutMonth}`}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: 'Cash Out', position: 'top', fill: '#ef4444' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="cash"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Cash Position"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {cashRunoutMonth > 0 && cashRunoutMonth <= 24 && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">
                      Cash runway: {cashRunoutMonth} months
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Consider raising additional capital or accelerating customer acquisition
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
              <CardDescription>Projected customer acquisition over 24 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => value}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="customers"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Customers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Final Customers</div>
                <div className="text-2xl font-bold text-gray-900">{finalMonth.customers}</div>
                <p className="text-xs text-gray-600 mt-1">Month 24</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Final MRR</div>
                <div className="text-2xl font-bold text-blue-700">${finalMonth.mrr.toFixed(0)}K</div>
                <p className="text-xs text-gray-600 mt-1">Month 24</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Final ARR</div>
                <div className="text-2xl font-bold text-purple-700">${finalMonth.arr.toFixed(0)}K</div>
                <p className="text-xs text-gray-600 mt-1">Month 24</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-gray-600 mb-1">Cash Position</div>
                <div className={`text-2xl font-bold ${finalMonth.cash > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${(finalMonth.cash / 1000).toFixed(0)}K
                </div>
                <p className="text-xs text-gray-600 mt-1">Month 24</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Info className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Model Assumptions</h4>
              <p className="text-xs text-blue-700">
                Default scenario: 3 pilot customers at month 3 launch, 15% monthly growth rate OR minimum 4 new customers per month
                (whichever is greater), 30-vehicle average fleet, $32/vehicle pricing, $750K capital raise. Pre-launch burn: $60K/month
                (team building, product development). Post-launch burn: $40K/month (reduced as operations stabilize). Minimum customer
                floor ensures realistic projections based on email campaigns, referral programs, and trade show presence.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="mt-6 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Explore Market Size</h3>
              <p className="text-sm text-gray-600 mb-4">
                See the full market opportunity and revenue potential at different penetration levels.
              </p>
              <Link to={`${pathPrefix}/invest/calculators/market-opportunity`}>
                <Button variant="outline">
                  Market Opportunity
                  <Target className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">View Investment Terms</h3>
              <p className="text-sm text-gray-600 mb-4">
                Review our current fundraising round, valuation, and investment opportunities.
              </p>
              <Link to={`${pathPrefix}/invest/opportunities`}>
                <Button>
                  Investment Opportunities
                  <DollarSign className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
