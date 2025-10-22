import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, CheckCircle, Clock, TrendingUp, Target, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface RoadmapPhase {
  phase: string;
  quarter: string;
  status: 'completed' | 'in-progress' | 'planned';
  title: string;
  description: string;
  milestones: string[];
  icon: React.ReactNode;
}

const roadmapData: RoadmapPhase[] = [
  {
    phase: 'Phase 0',
    quarter: 'Q4 2025',
    status: 'in-progress',
    title: 'Beta Platform Development',
    description: 'Transform proof-of-concept into production-ready MVP with pilot customers',
    icon: <Clock className="h-5 w-5" />,
    milestones: [
      'Series 0 funding completion ($75K)',
      'Production SaaS development from POC',
      'Core features: AFS Tracking, Fleet management and real-time maintenance',
      '3 pilot customers launching January/February 2026'
    ]
  },
  {
    phase: 'Phase 1',
    quarter: 'Q1 2026',
    status: 'planned',
    title: 'Platform Foundation',
    description: 'Series Seed fundraising and full-scale product development',
    icon: <Map className="h-5 w-5" />,
    milestones: [
      'Series Seed funding ($750K)',
      'Gather validation data from pilot customers',
      'Product soak and hardening',
      'Ramp up full-scale development'
    ]
  },
  {
    phase: 'Phase 2',
    quarter: 'Q2 2026',
    status: 'planned',
    title: 'Market Expansion',
    description: 'Scale operations and expand market presence',
    icon: <TrendingUp className="h-5 w-5" />,
    milestones: [
      'Enhanced analytics and reporting',
      'Marketing automation deployment',
      'Strategic partnerships establishment',
      'Customer base expansion (500+ users)'
    ]
  },
  {
    phase: 'Phase 3',
    quarter: 'Q3 2026',
    status: 'planned',
    title: 'Product Enhancement',
    description: 'Advanced features and service offerings',
    icon: <Rocket className="h-5 w-5" />,
    milestones: [
      'AI-powered recommendations',
      'Advanced integration capabilities',
      'Enhanced feature set',
      'Premium tier introduction'
    ]
  },
  {
    phase: 'Phase 4',
    quarter: 'Q4 2026',
    status: 'planned',
    title: 'Strategic Growth',
    description: 'Market leadership and revenue optimization',
    icon: <Target className="h-5 w-5" />,
    milestones: [
      'Enterprise solutions rollout',
      'International expansion preparation',
      'Series A funding round',
      'Revenue milestone: $1M ARR'
    ]
  }
];

const getStatusColor = (status: RoadmapPhase['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'planned':
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: RoadmapPhase['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'planned':
      return <Map className="h-4 w-4" />;
  }
};

export function PortalInvestRoadmap() {
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
          <div className="p-3 bg-blue-100 rounded-lg">
            <Map className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Roadmap</h1>
            <p className="text-gray-600">Strategic milestones and growth trajectory</p>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="text-blue-900">2025-2026 Strategic Vision</CardTitle>
          <CardDescription className="text-blue-700">
            Our roadmap outlines key phases of growth, from beta platform development through market leadership.
            Each phase builds upon previous achievements to drive sustainable growth and market expansion.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Roadmap Timeline */}
      <div className="space-y-6">
        {roadmapData.map((phase, index) => (
          <Card
            key={phase.phase}
            className={`hover:shadow-lg transition-all ${
              phase.status === 'in-progress' ? 'ring-2 ring-blue-300' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Phase Number */}
                  <div className={`p-3 rounded-lg ${
                    phase.status === 'completed' ? 'bg-green-100' :
                    phase.status === 'in-progress' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {phase.icon}
                  </div>

                  {/* Phase Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{phase.title}</h3>
                      <Badge className={getStatusColor(phase.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(phase.status)}
                          {phase.status.replace('-', ' ')}
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{phase.phase}</span>
                      <span>•</span>
                      <span>{phase.quarter}</span>
                    </div>
                    <p className="text-gray-700 mb-4">{phase.description}</p>

                    {/* Milestones */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Milestones:</h4>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {phase.milestones.map((milestone, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              phase.status === 'completed' ? 'text-green-600' :
                              phase.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            {milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Success Metrics Card */}
      <Card className="mt-8 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-900">Success Metrics & KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-purple-900 mb-1">1,000+</div>
              <div className="text-sm text-purple-700">Target Users by Q4</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-900 mb-1">$1M</div>
              <div className="text-sm text-purple-700">Annual Recurring Revenue</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-900 mb-1">95%</div>
              <div className="text-sm text-purple-700">Customer Retention Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
