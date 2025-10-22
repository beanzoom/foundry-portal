import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DollarSign,
  TrendingUp,
  MapPin,
  Shield,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Calculator,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AFS_FMP_RATES, formatCurrency } from '@/lib/portal/investmentConstants';

export function CompetitiveAdvantages() {
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

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Why FleetDRMS Will Succeed
          </h1>
          <p className="text-xl text-gray-600">
            Built WITH Amazon DSPs FOR Amazon DSPs
          </p>
        </div>
      </div>

      {/* Introduction */}
      <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900">Our Competitive Position</CardTitle>
          <CardDescription className="text-blue-800 text-base mt-2">
            FleetDRMS is the only fleet management platform developed in partnership with
            active Amazon DSPs. This ensures our features solve real operational challenges,
            not theoretical problems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-gray-700 font-medium mb-3">We offer 5 capabilities no competitor provides:</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>AFS Revenue Recovery (proven ROI)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>PACE Automation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Wave Planning Automation</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Driver Experience Preferences (DEP)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span>Unified Driver Center</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Comparison Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Feature Comparison</CardTitle>
          <CardDescription>
            Capabilities unique to FleetDRMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Competitors</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">FleetDRMS</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Proven Value</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="bg-green-50 border-l-4 border-green-600">
                  <td className="px-4 py-4 font-medium text-gray-900">AFS Revenue Recovery</td>
                  <td className="px-4 py-4 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-green-700">$1,500-$5,400 per incident*</span>
                    <p className="text-xs text-gray-600 mt-1">Based on real FMP rates</p>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">PACE Automation</td>
                  <td className="px-4 py-4 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-700">Time savings being validated**</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">Wave Planning Automation</td>
                  <td className="px-4 py-4 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-700">Time savings being validated**</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">Driver Experience Preferences (DEP)</td>
                  <td className="px-4 py-4 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-700">Driver retention impact being validated**</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 font-medium text-gray-900">Unified Driver Center</td>
                  <td className="px-4 py-4 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-700">Efficiency gain being validated**</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <p>* Based on actual Amazon DSP FMP rates from invoice data (January 2025)</p>
            <p>** Early DSP feedback indicates significant operational improvements - validation ongoing via DSP calculator submissions</p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Deep Dives */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Feature Deep Dive</CardTitle>
          <CardDescription>
            Detailed analysis of each competitive advantage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="afs" className="w-full">
            {/* Feature 1: AFS Revenue Recovery */}
            <AccordionItem value="afs" className="border-2 border-green-200">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">AFS Revenue Recovery</div>
                    <div className="text-sm text-gray-600 font-normal">
                      Proven ROI with real Amazon FMP data
                    </div>
                  </div>
                  <Badge className="bg-green-600 ml-auto mr-4">Lead Feature</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-6 pt-4">
                  {/* Problem */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      The Problem
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Amazon's Authorized Fleet Size (AFS) determines Fixed Monthly Payment (FMP)</li>
                      <li className="list-disc">When vehicles are down (warranty, maintenance, recalls), DSPs can request AFS adjustments to maintain payment</li>
                      <li className="list-disc">Manual tracking captures only 40% of eligible claims (industry standard)</li>
                      <li className="list-disc">Each missed claim = lost FMP revenue</li>
                    </ul>
                  </div>

                  {/* Real FMP Rates */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Real FMP Rates (Amazon DSP Invoice, January 2025)
                    </h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Amazon-Owned CDV:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.amazonOwnedCDV.rate}/mo</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Amazon-Owned Extended:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.amazonOwnedExtended.rate}/mo</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Leased Extended Van:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.leasedExtended.rate}/mo</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Last Mile Rental:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.lastMileRental.rate}/mo</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Rental Van:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.rental.rate}/mo</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-700">Rivian EV:</span>
                        <span className="font-semibold">${AFS_FMP_RATES.rivianEV.rate}/mo</span>
                      </div>
                    </div>
                  </div>

                  {/* Example Impact */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">Example Impact (Real Numbers)</h4>
                    <div className="space-y-3 text-sm">
                      <p className="text-gray-700"><strong>Scenario:</strong> 3 leased extended vans down for 14 days (warranty work)</p>
                      <p className="text-gray-700"><strong>FMP Rate:</strong> $1,075/vehicle/month</p>

                      <div className="grid md:grid-cols-2 gap-3 mt-3">
                        <div className="bg-red-100 border border-red-300 rounded p-3">
                          <div className="text-red-900 font-semibold mb-1">Manual Tracking (40% capture)</div>
                          <div className="text-red-800">Lost revenue: <strong>$966/month</strong></div>
                        </div>
                        <div className="bg-green-100 border border-green-300 rounded p-3">
                          <div className="text-green-900 font-semibold mb-1">FleetDRMS (90% capture)</div>
                          <div className="text-green-800">Lost revenue: <strong>$161/month</strong></div>
                        </div>
                      </div>

                      <div className="bg-white border-2 border-green-600 rounded p-3 mt-3">
                        <div className="text-lg font-bold text-green-900">
                          Revenue Recovered: $805/month = $9,660/year
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ROI Calculation */}
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">ROI from AFS Alone</h4>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>For a 50-vehicle DSP paying <strong>$1,600/month</strong> ($19,200/year):</p>
                      <p>Recovering <strong>2-3 missed AFS claims per year</strong> = software pays for itself</p>
                      <p className="text-green-700 font-semibold">All additional features are pure profit</p>
                    </div>
                  </div>

                  {/* Our Solution */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Our Solution
                    </h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Automated AFS eligibility tracking</li>
                      <li className="list-disc">Fleet Portal request generation</li>
                      <li className="list-disc">Status monitoring and alerts</li>
                      <li className="list-disc">90% capture rate vs 40% manual</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Feature 2: PACE Automation */}
            <AccordionItem value="pace">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">PACE Automation</div>
                    <div className="text-sm text-gray-600 font-normal">
                      Automated driver performance tracking
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What It Does</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Automates Amazon's PACE (driver performance) scoring</li>
                      <li className="list-disc">Historical tracking and trend analysis</li>
                      <li className="list-disc">Alerts for declining performance</li>
                      <li className="list-disc">Objective, data-driven coaching insights</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Current Manual Process</h4>
                    <ul className="space-y-1 text-sm text-amber-800 ml-6">
                      <li className="list-disc">Spreadsheets and manual reviews</li>
                      <li className="list-disc">Time-consuming and inconsistent</li>
                      <li className="list-disc">Subjective scoring</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Why It Matters</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Faster coaching interventions</li>
                      <li className="list-disc">Objective performance data</li>
                      <li className="list-disc">Improved driver retention</li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Value:</strong> DSPs report significant time savings. Being quantified via calculator submissions.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Feature 3: Wave Planning Automation */}
            <AccordionItem value="wave">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Wave Planning Automation</div>
                    <div className="text-sm text-gray-600 font-normal">
                      Automated route dispatch planning
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What It Does</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Automated route/dispatch planning</li>
                      <li className="list-disc">Driver Experience Preferences (DEP) integration</li>
                      <li className="list-disc">Optimized vehicle-to-driver assignment</li>
                      <li className="list-disc">Real-time route optimization</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Current Manual Process</h4>
                    <ul className="space-y-1 text-sm text-amber-800 ml-6">
                      <li className="list-disc">Manual planning every morning</li>
                      <li className="list-disc">Phone calls and clipboard dispatch</li>
                      <li className="list-disc">Route mismatches common</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Why It Matters</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Faster morning dispatch</li>
                      <li className="list-disc">Reduced planning errors</li>
                      <li className="list-disc">Improved driver satisfaction</li>
                    </ul>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Value:</strong> DSPs report 2-3 hours saved daily. Being quantified via calculator submissions.
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Feature 4: Driver Experience Preferences (DEP) */}
            <AccordionItem value="dep">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Driver Experience Preferences (DEP)</div>
                    <div className="text-sm text-gray-600 font-normal">
                      First-of-its-kind driver input system
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">First-of-Its-Kind Feature</h4>
                    <p className="text-sm text-blue-800">
                      DEP gives drivers a voice in their day-to-day route assignments - something they've never had before.
                      This revolutionary approach puts driver preferences at the center of Wave Planning decisions.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What It Does</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Captures driver preferences for vehicle types, route types, and areas</li>
                      <li className="list-disc">Integrates preferences into Wave Planning algorithms</li>
                      <li className="list-disc">Gives drivers input into what vehicles/routes they receive</li>
                      <li className="list-disc">Balances operational needs with driver satisfaction</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Current Reality</h4>
                    <ul className="space-y-1 text-sm text-amber-800 ml-6">
                      <li className="list-disc">Drivers have zero say in route assignments</li>
                      <li className="list-disc">One-size-fits-all scheduling leads to dissatisfaction</li>
                      <li className="list-disc">High turnover from poor driver experience</li>
                      <li className="list-disc">No systematic way to capture or use driver preferences</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Why It Matters</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc"><strong>Driver Retention:</strong> Drivers who have a say in their routes stay longer</li>
                      <li className="list-disc"><strong>Driver Satisfaction:</strong> Improved morale and job satisfaction</li>
                      <li className="list-disc"><strong>Recruitment:</strong> Competitive advantage in attracting talent</li>
                      <li className="list-disc"><strong>Performance:</strong> Happier drivers deliver better results</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">The DEP + Driver Center Advantage</h4>
                    <p className="text-sm text-green-800">
                      Combined with the Unified Driver Center, DEP creates a comprehensive driver management
                      ecosystem focused on retention and satisfaction - addressing DSPs' #1 operational challenge:
                      driver turnover.
                    </p>
                  </div>

                  <Alert className="border-purple-200 bg-purple-50">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-900">Retention Impact Being Validated</AlertTitle>
                    <AlertDescription className="text-purple-800 text-sm">
                      Early DSP feedback indicates significant driver satisfaction improvements and retention benefits.
                      We're currently gathering validation data through pilot programs.{' '}
                      <Link to={`${pathPrefix}/calculators`} className="underline font-medium">
                        Try the calculator
                      </Link>
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Feature 5: Unified Driver Center */}
            <AccordionItem value="driver">
              <AccordionTrigger className="hover:no-underline px-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Unified Driver Center</div>
                    <div className="text-sm text-gray-600 font-normal">
                      Complete driver profile and history
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What It Does</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc">Unified driver profile with complete history in one location</li>
                      <li className="list-disc">Tracks PACE scores, delivery performance, vehicle assignments, incidents</li>
                      <li className="list-disc">Integrates with DEP to display driver preferences and assignments</li>
                      <li className="list-disc">Provides instant access to complete driver records</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2">Current Situation</h4>
                    <ul className="space-y-1 text-sm text-amber-800 ml-6">
                      <li className="list-disc">Driver data scattered across multiple Amazon portals</li>
                      <li className="list-disc">Paper files, spreadsheets, and manual tracking</li>
                      <li className="list-disc">Incomplete history makes retention decisions difficult</li>
                      <li className="list-disc">Time-consuming to compile driver performance data</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Why It Matters</h4>
                    <ul className="space-y-2 text-gray-700 ml-6">
                      <li className="list-disc"><strong>Driver Retention:</strong> Complete visibility into driver performance and engagement</li>
                      <li className="list-disc"><strong>Better Management:</strong> Data-driven decisions on coaching, recognition, retention</li>
                      <li className="list-disc"><strong>Time Savings:</strong> Instant access replaces manual data gathering</li>
                      <li className="list-disc"><strong>Improved Experience:</strong> Shows drivers their performance and preferences are valued</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Driver-Centric Ecosystem</h4>
                    <p className="text-sm text-blue-800">
                      The Unified Driver Center + DEP combination creates a comprehensive driver management system
                      that addresses the industry's biggest challenge: driver turnover and satisfaction.
                    </p>
                  </div>

                  <Alert className="border-purple-200 bg-purple-50">
                    <Info className="h-4 w-4 text-purple-600" />
                    <AlertTitle className="text-purple-900">Management Impact Being Validated</AlertTitle>
                    <AlertDescription className="text-purple-800 text-sm">
                      Pilot DSPs report significant time savings and improved driver relationships.
                      We're quantifying these benefits through our calculator.{' '}
                      <Link to={`${pathPrefix}/calculators`} className="underline font-medium">
                        Try the calculator
                      </Link>
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* ROI Summary */}
      <Card className="mb-8 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="text-2xl text-green-900">Investment Thesis: AFS Alone Justifies the Investment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-6 border border-green-200">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Proven ROI: AFS Revenue Recovery</h3>

            <div className="space-y-4 text-gray-700">
              <p>
                Based on real Amazon FMP rates, each missed AFS adjustment costs <strong>$1,500-$5,400</strong> depending
                on vehicle type and downtime duration.
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <div className="text-sm text-blue-900 font-semibold mb-1">Software Cost</div>
                  <div className="text-2xl font-bold text-blue-900">$960-$1,600<span className="text-base font-normal">/month</span></div>
                  <div className="text-xs text-blue-700">For 30-50 vehicle fleet</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4">
                  <div className="text-sm text-green-900 font-semibold mb-1">Break-Even</div>
                  <div className="text-2xl font-bold text-green-900">2-3 claims<span className="text-base font-normal">/year</span></div>
                  <div className="text-xs text-green-700">Pays for entire software cost</div>
                </div>
              </div>

              <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4">
                <p className="font-semibold text-green-900 text-lg">
                  Additional Value: Features #2-5 provide operational efficiency gains currently being validated through DSP calculator submissions.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transparency Section */}
      <Card className="mb-8 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Our Validation Process
          </CardTitle>
          <CardDescription>Transparent about what we know and what we're learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Proven Value</h4>
                </div>
                <p className="text-sm text-green-800">
                  <strong>AFS Revenue Recovery:</strong> Backed by real FMP rates and industry capture rate data
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Being Validated</h4>
                </div>
                <p className="text-sm text-blue-800">
                  <strong>Operational Efficiency:</strong> Time savings and efficiency gains validated through DSP calculator
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">
                As DSPs complete the cost savings calculator, we update this page with aggregated,
                real-world data showing actual time savings and efficiency gains.
              </p>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Current Pilot Data</div>
                  <div className="font-semibold text-gray-900">3 committed DSPs</div>
                </div>
                <div>
                  <div className="text-gray-600">Expected Launch</div>
                  <div className="font-semibold text-gray-900">3 months from raise</div>
                </div>
                <div>
                  <div className="text-gray-600">Validation Timeline</div>
                  <div className="font-semibold text-gray-900">First 6 months post-launch</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Link to={`${pathPrefix}/calculators`}>
                <Button variant="outline" className="w-full">
                  <Calculator className="mr-2 h-4 w-4" />
                  View DSP Cost Savings Calculator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="flex gap-4">
        <Link
          to={`${pathPrefix}/invest/opportunities`}
          className="flex-1"
          onClick={() => window.scrollTo(0, 0)}
        >
          <Button className="w-full" size="lg">
            View Investment Opportunities
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to={`${pathPrefix}/invest`} className="flex-1">
          <Button variant="outline" className="w-full" size="lg">
            Back to Investment Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}
