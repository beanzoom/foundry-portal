import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Target,
  Users,
  Rocket,
  Lightbulb,
  Shield,
  TrendingUp,
  Award,
  Heart,
  Building,
  Globe,
  CheckCircle,
  ArrowRight,
  Star,
  UserPlus
} from 'lucide-react';

const Mission = () => {
  const [activeTab, setActiveTab] = useState('mission');
  const navigate = useNavigate();

  // Check if we're on subdomain to determine path prefix
  const isSubdomain = window.location.hostname === 'portal.localhost' ||
                     window.location.hostname.startsWith('portal.');
  const pathPrefix = isSubdomain ? '' : '/portal';

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8"
        >
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Our Mission
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Building the future of DSP operations through revolutionary collaboration
            </p>
          </div>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="mission" className="text-lg">
              <Target className="w-4 h-4 mr-2" />
              Our Mission
            </TabsTrigger>
            <TabsTrigger value="team" className="text-lg">
              <Users className="w-4 h-4 mr-2" />
              The All-Star Team
            </TabsTrigger>
          </TabsList>

          {/* Mission Content */}
          <TabsContent value="mission" className="space-y-12">
            {/* Core Mission Statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-8 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
                  <p className="text-lg text-gray-700 font-semibold max-w-4xl mx-auto">
                    We are building something larger than just a software product to hand to the marketplace.
                    We're building something with which we intend to change the industry - and this can only
                    be done properly with the help of the DSP Community.
                  </p>
                </div>
                <p className="text-gray-600 text-center max-w-3xl mx-auto">
                  The FleetDRMS Foundry Portal exists to bring DSP owners together with an industry-leading
                  technology team to create a one-of-a-kind solution that will revolutionize the way the
                  DSP Industry does business.
                </p>
              </Card>
            </motion.div>

            {/* The Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  The Vision: Creating WITH You, Not FOR You
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  We're not rounding up customers. We're not handing a product TO the DSP community -
                  we're creating something WITH the DSP community.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <Lightbulb className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Product Features</h3>
                  <p className="text-gray-600 text-sm">Functionality designed based on your real needs</p>
                </Card>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Key Integrations</h3>
                  <p className="text-gray-600 text-sm">Connect with the tools you already use</p>
                </Card>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <Shield className="w-8 h-8 text-purple-600 mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Development Priorities</h3>
                  <p className="text-gray-600 text-sm">Focus on what matters most to your operations</p>
                </Card>
              </div>
            </motion.div>

            {/* Why the Foundry Exists */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-lg shadow-lg p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                Why the Foundry Exists
              </h2>
              <p className="text-gray-600 mb-8 text-center max-w-3xl mx-auto">
                The DSP industry faces unique challenges that generic fleet management solutions simply cannot address:
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Fragmented Systems",
                    description: "DSPs juggle dozens of disconnected tools, wasting time and losing critical data between systems"
                  },
                  {
                    title: "Industry-Specific Needs",
                    description: "Cookie-cutter solutions ignore the unique operational requirements of delivery service partners"
                  },
                  {
                    title: "Lack of Community Voice",
                    description: "Software is typically developed in isolation, without input from the people who use it daily"
                  },
                  {
                    title: "Missing Integration",
                    description: "Critical business processes remain manual because existing solutions don't talk to each other"
                  },
                  {
                    title: "Cost vs. Value Imbalance",
                    description: "DSPs pay for features they don't need while missing capabilities they desperately require"
                  }
                ].map((gap, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">{gap.title}:</span>
                      <span className="text-gray-600 ml-2">{gap.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* How We're Different */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                How We're Different
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-white">
                  <Users className="w-10 h-10 text-purple-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Community-Driven Development</h3>
                  <p className="text-gray-600">
                    The Foundry Portal is your direct line to shaping the future of DSP technology.
                    Through surveys, feedback sessions, and collaborative workshops, your real-world
                    experience drives our development roadmap.
                  </p>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white">
                  <Award className="w-10 h-10 text-indigo-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Proof Through Partnership</h3>
                  <p className="text-gray-600">
                    We have a fully functional proof of concept ready to demonstrate. As a Foundry member,
                    you'll access live demonstrations, test prototype features, and see your suggestions
                    become reality.
                  </p>
                </Card>
              </div>

              <Card className="mt-8 p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center mb-4">
                  <Heart className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">No Barriers to Entry</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  There is no charge for becoming a Foundry member. We only ask that our members:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Share our vision of creating a comprehensive solution together
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Commit to being part of the solution-building process
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Contribute insights and feedback to guide development
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                    Help us understand the true needs of DSP operations
                  </li>
                </ul>
              </Card>
            </motion.div>

            {/* Our Commitment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-50 rounded-lg p-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                Our Commitment to You
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  "Listen First, Build Second",
                  "Maintain Transparency",
                  "Prioritize Community Input",
                  "Deliver Real Value",
                  "Foster Collaboration",
                  "Respect Your Time"
                ].map((commitment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge className="bg-purple-600 text-white">{index + 1}</Badge>
                    <span className="text-gray-700 font-medium">{commitment}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* The Road Ahead */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                The Road Ahead
              </h2>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Rocket className="w-6 h-6 text-purple-600 mr-2" />
                    Current Status
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Fully functional proof of concept completed
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Production team identified and ready
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Market strategy team conducting due diligence
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      Foundry Portal launched for collaboration
                    </li>
                  </ul>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 mr-2" />
                    Immediate Opportunities
                  </h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start">
                      <ArrowRight className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Foundry Membership:</strong> Join now at no cost
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Early Access:</strong> Test and influence new features
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Equity Partnership:</strong> Investment opportunities Oct 1-15
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ArrowRight className="w-4 h-4 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Advisory Roles:</strong> Guide strategic decisions
                      </div>
                    </li>
                  </ul>
                </Card>
              </div>

              {/* Call to Action */}
              <Card className="p-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Join the Revolution</h3>
                  <p className="text-lg mb-6 text-purple-100">
                    This is more than software development - it's a movement to transform how the DSP industry operates.
                    When DSP owners and technology experts unite with a shared vision, we don't just fill gaps -
                    we eliminate them entirely.
                  </p>
                  <p className="text-xl font-bold mb-6">
                    We're not building a product. We're building a partnership.
                    We're building a community. We're building the future of DSP operations.
                  </p>
                  <div className="space-y-3">
                    <p className="text-lg text-purple-100 font-semibold">
                      Welcome! You're in the Right Place to Make a Difference
                    </p>
                    <p className="text-md text-purple-200 max-w-2xl mx-auto">
                      As a Foundry member, you have the power to shape the technology that will
                      transform our industry. Your voice matters. Your experience counts.
                      Together, we're creating the change we want to see.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Quote */}
              <div className="mt-8 p-6 bg-purple-50 rounded-lg border-l-4 border-purple-600">
                <p className="text-gray-700 italic">
                  "While a SaaS product is the end result, we're creating something larger than just a
                  software product to hand to the marketplace. We're building something with which we
                  intend to change the industry - and this can only be done properly with the help of
                  the DSP Community. This is our mission."
                </p>
                <p className="text-gray-600 mt-2 font-semibold">- FleetDRMS Foundry Team</p>
              </div>
            </motion.div>
          </TabsContent>

          {/* Team Content */}
          <TabsContent value="team" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  The FleetDRMS All-Star Team
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Meet the passionate professionals dedicated to revolutionizing the DSP industry through
                  innovative technology and collaborative partnership.
                </p>
              </div>

              {/* Team Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Placeholder team members - replace with actual team */}
                {[
                  {
                    name: "Leadership Team",
                    role: "Visionary Leaders",
                    description: "Driving innovation with decades of combined industry experience"
                  },
                  {
                    name: "Technology Team",
                    role: "Engineering Excellence",
                    description: "Building scalable, reliable solutions that transform operations"
                  },
                  {
                    name: "Product Team",
                    role: "User-Focused Design",
                    description: "Creating intuitive experiences that simplify complex workflows"
                  },
                  {
                    name: "Customer Success",
                    role: "Partnership Champions",
                    description: "Ensuring every Foundry member achieves their goals"
                  },
                  {
                    name: "Market Strategy",
                    role: "Industry Experts",
                    description: "Understanding and addressing real-world DSP challenges"
                  },
                  {
                    name: "Community Team",
                    role: "Engagement Specialists",
                    description: "Fostering collaboration and gathering valuable feedback"
                  }
                ].map((team, index) => (
                  <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 mx-auto">
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{team.name}</h3>
                    <p className="text-purple-600 text-center mb-3">{team.role}</p>
                    <p className="text-gray-600 text-center text-sm">{team.description}</p>
                  </Card>
                ))}
              </div>

              {/* Team Values */}
              <Card className="mt-12 p-8 bg-gradient-to-br from-purple-50 to-indigo-50">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Team Values</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <Building className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900">Innovation</h4>
                    <p className="text-sm text-gray-600">Pushing boundaries daily</p>
                  </div>
                  <div className="text-center">
                    <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900">Partnership</h4>
                    <p className="text-sm text-gray-600">Success through collaboration</p>
                  </div>
                  <div className="text-center">
                    <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900">Impact</h4>
                    <p className="text-sm text-gray-600">Transforming the industry</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900">Excellence</h4>
                    <p className="text-sm text-gray-600">Quality in everything</p>
                  </div>
                </div>
              </Card>

              {/* Welcome to the Foundry CTA */}
              <Card className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Welcome to the Foundry!</h3>
                  <p className="text-lg mb-6 text-indigo-100">
                    You're already part of something revolutionary. Now help us grow our community
                    of innovators by inviting colleagues who share our vision for transforming the
                    DSP industry. Every new member strengthens our collective voice and accelerates
                    our mission.
                  </p>
                  <Button
                    size="lg"
                    className="bg-white text-indigo-600 hover:bg-gray-100"
                    onClick={() => navigate(`${pathPrefix}/referrals`)}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Invite Your Colleagues
                  </Button>
                  <p className="text-sm mt-4 text-indigo-200">
                    Earn rewards and recognition for each successful referral
                  </p>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Mission;