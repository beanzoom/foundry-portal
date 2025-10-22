import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Shield, Users, Mail, CheckCircle, Target, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { COMPANY_METRICS } from '@/lib/portal/investmentConstants';

interface InvestmentOption {
  name: string;
  type: 'equity' | 'convertible' | 'safe';
  minInvestment: string;
  targetRaise: string;
  valuation: string;
  status: 'open' | 'closing-soon' | 'closed';
  highlights: string[];
  terms: {
    label: string;
    value: string;
  }[];
}

const investmentOptions: InvestmentOption[] = [
  {
    name: 'Series 0 Round',
    type: 'convertible',
    minInvestment: '$10,000',
    targetRaise: '$75K',
    valuation: '$3M cap',
    status: 'open',
    highlights: [
      'Ground-floor opportunity in pre-revenue stage',
      'Proof-of-concept complete and demonstrable',
      'Transform POC into production MVP with 3 pilot customers',
      'De-risk investment before Series Seed at higher valuation',
      'Direct impact on product development timeline',
      'Pro-rata rights in future rounds'
    ],
    terms: [
      { label: 'Valuation Cap', value: '$3M' },
      { label: 'Maturity Date', value: '24 months' }
    ]
  },
  {
    name: 'Series Seed Round',
    type: 'convertible',
    minInvestment: '$50,000',
    targetRaise: `$${(COMPANY_METRICS.capitalRaise.target / 1000).toFixed(0)}K`,
    valuation: '$5-7M cap',
    status: 'open',
    highlights: [
      'Exceptional unit economics: 29:1 to 43:1 LTV:CAC ratio with 1-2 month payback',
      'Product & customers validated: 3 pilot customers launching Jan/Feb 2026',
      'Cash-flow positive within 12 months at 60-80 customers',
      'Break-even at 1.3% market penetration (30-40 customers)',
      'First-mover in $55M-$110M TAM with no comprehensive competitor',
      'Pro-rata rights in future rounds'
    ],
    terms: [
      { label: 'Valuation Cap', value: '$5-7M (negotiable)' },
      { label: 'Maturity Date', value: '24 months' }
    ]
  }
];

const getStatusColor = (status: InvestmentOption['status']) => {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'closing-soon':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeLabel = (type: InvestmentOption['type']) => {
  switch (type) {
    case 'equity':
      return 'Equity';
    case 'convertible':
      return 'Convertible Note';
    case 'safe':
      return 'SAFE';
  }
};

export function PortalInvestOpportunities() {
  const hostname = window.location.hostname;
  const pathPrefix = hostname === 'portal.localhost' ||
                     hostname.startsWith('portal.') ||
                     hostname.includes('vercel.app') ? '' : '/portal';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Link to={`${pathPrefix}/invest`}>
          <Button variant="ghost" className="mb-4">
            ← Back to Investment Portal
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Investment Opportunities</h1>
            <p className="text-gray-600">Current fundraising rounds and investment terms</p>
          </div>
        </div>
      </div>

      {/* Funding Strategy Overview */}
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Two-Phase Funding Strategy</CardTitle>
          <CardDescription className="text-blue-700">
            FleetDRMS is executing a strategic funding approach designed to maximize valuation and minimize dilution while de-risking the investment at each stage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Series 0 */}
            <div className="p-4 bg-white rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600">Series 0</Badge>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">Opens October 21, 2025</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">$75K</div>
              <div className="text-sm text-gray-600 mb-3">
                <strong>Purpose:</strong> MVP development and pilot customer launch
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Transform proof-of-concept into production SaaS</li>
                <li>• Launch 3 pilot customers (Jan/Feb 2026)</li>
                <li>• Gather validation data and ROI metrics</li>
                <li>• De-risk Series Seed raise with traction</li>
              </ul>
            </div>

            {/* Series Seed */}
            <div className="p-4 bg-white rounded-lg border border-green-300 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-600">Series Seed</Badge>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">Opens Q1 2026</Badge>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">$750K</div>
              <div className="text-sm text-gray-600 mb-3">
                <strong>Purpose:</strong> Full product development and scale customer acquisition
              </div>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Comprehensive feature development (Tiers 2-3)</li>
                <li>• Team expansion (engineers, SDR, CSM)</li>
                <li>• Trade show presence and marketing campaigns</li>
                <li>• Path to cash-flow positive within 12 months</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Fundraising */}
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-green-900">Series Seed Round Details</CardTitle>
          <CardDescription className="text-green-700">
            Opening upon completion of Series 0 and pilot program launch. Product and customers in market provide validated de-risked investment opportunity.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Investment Options */}
      <div className="space-y-6">
        {investmentOptions.map((option, index) => (
          <Card key={index} className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{option.name}</h3>
                    <Badge className={getStatusColor(option.status)}>
                      {option.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {getTypeLabel(option.type)}
                  </Badge>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Minimum Investment</div>
                  <div className="text-xl font-bold text-gray-900">{option.minInvestment}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Target Raise</div>
                  <div className="text-xl font-bold text-gray-900">{option.targetRaise}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Valuation Cap</div>
                  <div className="text-xl font-bold text-gray-900">{option.valuation}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Highlights */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Investment Highlights:</h4>
                <ul className="grid md:grid-cols-2 gap-3">
                  {option.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Terms */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Terms:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {option.terms.map((term, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-900 font-medium">{term.label}</span>
                      <span className="text-sm text-blue-700">{term.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Link to={`${pathPrefix}/contact`}>
                  <Button className="w-full" disabled={option.status === 'closed'}>
                    <Mail className="mr-2 h-4 w-4" />
                    Express Interest
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Use of Funds Card */}
      <Card className="mt-8 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Use of Funds
          </CardTitle>
          <CardDescription>
            How we'll deploy capital to reach our 12-month milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Engineering & Product */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900">Engineering & Product</h4>
                <Badge variant="outline" className="bg-white">43%</Badge>
              </div>
              <p className="text-sm text-blue-700 mb-3">$325K</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Engineering Team Identified for Core Development
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Third-Party Integrations
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Feature Expansion
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Advanced Reporting and Analytics
                </li>
              </ul>
            </div>

            {/* Sales & Marketing */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-900">Sales & Marketing</h4>
                <Badge variant="outline" className="bg-white">27%</Badge>
              </div>
              <p className="text-sm text-green-700 mb-3">$200K</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Sales Team
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Trade Show Presence (DSP summits, logistics conferences)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Digital Marketing Campaigns
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Customer Success & Advocacy
                </li>
              </ul>
            </div>

            {/* Operations & Infrastructure */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-purple-900">Operations & Infrastructure</h4>
                <Badge variant="outline" className="bg-white">20%</Badge>
              </div>
              <p className="text-sm text-purple-700 mb-3">$150K</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Business Operations Staffing
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Customer Training & Support Infrastructure
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Security Compliance (SOC 2, data protection)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Legal & Professional Services
                </li>
              </ul>
            </div>

            {/* Working Capital */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-amber-900">Working Capital</h4>
                <Badge variant="outline" className="bg-white">10%</Badge>
              </div>
              <p className="text-sm text-amber-700 mb-3">$75K</p>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  Cash buffer for unexpected opportunities
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  Contingency for market adjustments
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                  Office supplies and team equipment
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Capital Efficiency</h4>
                <p className="text-sm text-blue-700">
                  This allocation reflects our focus on building a sustainable business with clear
                  unit economics. Engineering investment prioritizes AFS (our proven ROI feature),
                  while sales/marketing focuses on demonstrating value to warm leads and trade show
                  attendees. We project break-even within 12-18 months with modest customer acquisition.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 12-Month Milestones */}
      <Card className="mt-8 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-purple-600" />
            12-Month Milestones
          </CardTitle>
          <CardDescription>
            Key objectives we'll achieve with this funding round
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Month 0-3 */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-green-600 text-white">Months 0-3</Badge>
                <h4 className="font-semibold text-green-900">Beta Launch & Pilot Program</h4>
              </div>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Launch scaled-down product with 3 pilot customers
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Gather validation data on efficiency gains
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Product soak and hardening
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  Ramp up full-scale development
                </li>
              </ul>
            </div>

            {/* Month 3-6 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-blue-600 text-white">Months 3-6</Badge>
                <h4 className="font-semibold text-blue-900">Customer Acquisition & Refinement</h4>
              </div>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Launch tier 2 features and integrations
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Attend 2 DSP industry trade shows
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Ramp up marketing campaigns and referral program
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  Reach 10-15 customers
                </li>
              </ul>
            </div>

            {/* Month 6-9 */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-purple-600 text-white">Months 6-9</Badge>
                <h4 className="font-semibold text-purple-900">Scale & Optimization</h4>
              </div>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Reach 30-40 customers (break-even trajectory)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Attend 2 DSP industry trade shows
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Complete SOC 2 Type 1 certification
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                  Launch tier 3 features and integrations
                </li>
              </ul>
            </div>

            {/* Month 9-12 */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-indigo-600 text-white">Months 9-12</Badge>
                <h4 className="font-semibold text-indigo-900">Profitability & Growth Scaling</h4>
              </div>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                  Reach 60-80 customers (cashflow positive)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                  Publish validated efficiency gain data
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                  $60-90K MRR with 90%+ retention
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-indigo-600 flex-shrink-0" />
                  Continue trade show attendance
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-purple-900 mb-2">Growth Strategy</h4>
                <p className="text-sm text-purple-700">
                  Our milestones reflect a capital-efficient growth strategy focused on proving product-market
                  fit with pilot customers, demonstrating repeatability through trade shows and referrals, and
                  building sustainable unit economics. By month 12, we project being cashflow positive with
                  strong validation data to support Series A fundraising at improved terms.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Traction & Validation */}
      <Card className="mt-8 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Traction & Validation
          </CardTitle>
          <CardDescription>
            De-risked investment with concrete validation and committed customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Product</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Proof-of-concept complete and demonstrable</li>
                <li>✅ Core architecture validated</li>
                <li>✅ Production SaaS in development (Series 0)</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Customers</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ 3 pilot customers committed (Jan/Feb 2026 launch)</li>
                <li>✅ 3 Foundry members providing product feedback</li>
                <li>✅ Pricing validated through customer interviews</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">Market</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ $55M-$110M TAM with 3,000 DSPs identified</li>
                <li>✅ No comprehensive competitor exists</li>
                <li>✅ ROI validated: AFS alone delivers 5:1-8:1 value</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Legal & Structure</h4>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>✅ Delaware C-Corporation registered</li>
                <li>✅ Founding team committed and aligned</li>
                <li>✅ Investment documentation prepared</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founding Team */}
      <Card className="mt-8 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Founding Team
          </CardTitle>
          <CardDescription>
            Complementary skill sets with no execution gaps: Technical + Domain + Scaling expertise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Joey */}
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="mb-3">
                <h4 className="font-semibold text-indigo-900">Joey Lutes</h4>
                <p className="text-xs text-indigo-700">Co-Founder, CEO & CTO</p>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Seasoned software architect and business entrepreneur with 20+ years building scalable systems.
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Full-stack engineering expertise</li>
                <li>• Product development leadership</li>
                <li>• Business strategy and operations</li>
              </ul>
            </div>

            {/* Damion */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="mb-3">
                <h4 className="font-semibold text-green-900">Damion Jackson</h4>
                <p className="text-xs text-green-700">Co-Founder, COO</p>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Fleet Operations Manager for a large Amazon DSP. Brings hands-on industry expertise and DSP community credibility.
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Day-to-day DSP operations expert</li>
                <li>• Product requirements validation</li>
                <li>• Industry relationships and network</li>
              </ul>
            </div>

            {/* Phil */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="mb-3">
                <h4 className="font-semibold text-purple-900">Phil Reynolds</h4>
                <p className="text-xs text-purple-700">Co-Founder, Strategic Advisor</p>
              </div>
              <p className="text-sm text-gray-700 mb-3">
                Successful SaaS entrepreneur who sold his previous venture for 9 figures. Provides proven scaling playbook.
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• Scaling SaaS from startup to exit</li>
                <li>• Fundraising and investor relations</li>
                <li>• Go-to-market strategy execution</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Why Invest Card */}
      <Card className="mt-8 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-600" />
            Why Invest in FleetDRMS?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <div className="p-2 bg-purple-100 rounded-lg h-fit">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Complementary Founding Team</h4>
                <p className="text-sm text-gray-600">
                  Software architect (Joey) + DSP operations expert (Damion) + 9-figure SaaS exit entrepreneur (Phil). No execution gaps.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-blue-100 rounded-lg h-fit">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Validated Growth Path</h4>
                <p className="text-sm text-gray-600">
                  3 committed pilot customers launching Jan/Feb 2026. Path to 60-80 customers and $60-90K MRR within 12 months. 15% monthly growth validated through go-to-market strategy.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-green-100 rounded-lg h-fit">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Market White Space</h4>
                <p className="text-sm text-gray-600">
                  No SaaS vendor comprehensively serves the 3,000 DSPs managing Amazon's last-mile delivery operations. Existing tools are fragmented point solutions requiring manual processes across AFS tracking, real-time dashboards and analytics, wave/route planning, and driver management. FleetDRMS is first-to-market with a unified platform for this underserved vertical.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="p-2 bg-amber-100 rounded-lg h-fit">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Defensible Market Position</h4>
                <p className="text-sm text-gray-600">
                  First-mover advantage in narrow vertical. High switching costs once operational. Community moat through Foundry co-development. Proprietary AFS and DEP algorithms.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Card */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Questions About Investing?</h3>
              <p className="text-sm text-blue-700 mb-3">
                Our investor relations team is here to answer your questions and provide additional
                information about investment opportunities, terms, and documentation.
              </p>
              <Link to={`${pathPrefix}/contact`}>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Investor Relations
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
