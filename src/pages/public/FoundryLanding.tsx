import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Lightbulb,
  Shield,
  TrendingUp,
  CheckCircle,
  Calendar,
  Lock,
  Users,
  Heart,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/public/PublicLayout';

// Default foundry referral code
const DEFAULT_FOUNDRY_REFERRAL_CODE = 'FOUNDRY';

export function FoundryLanding() {
  const navigate = useNavigate();
  const FOUNDRY_REFERRAL_CODE = import.meta.env.VITE_FOUNDRY_REFERRAL_CODE || DEFAULT_FOUNDRY_REFERRAL_CODE;

  const handleJoinFoundry = () => {
    // Capture campaign parameter from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const campaign = urlParams.get('campaign');

    // Navigate to portal auth with referral code
    let authUrl = `/auth?ref=${FOUNDRY_REFERRAL_CODE}`;
    if (campaign) {
      authUrl += `&campaign=${encodeURIComponent(campaign)}`;
    }

    // Use React Router navigation since we're in the portal app
    navigate(authUrl);
  };

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
        {/* Hero Section with Integrated Logo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-20"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative max-w-7xl mx-auto px-4 py-8 sm:py-10 lg:py-12 sm:px-6 lg:px-8"
          >
            <div className="text-center">
              {/* Logo and Company Name on White Background */}
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-2xl px-6 sm:px-8 lg:px-10 py-4 sm:py-5 shadow-2xl flex flex-col sm:flex-row items-center gap-3 sm:gap-4 lg:gap-6">
                  <img
                    src="/logo-transparent.png"
                    alt="FleetDRMS Logo"
                    className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
                  />
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold italic bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
                    FleetDRMS
                  </h2>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs sm:text-sm px-3 sm:px-4 py-1">
                  <Lock className="w-3 h-3 mr-1" />
                  Invite Only
                </Badge>
                <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs sm:text-sm px-3 sm:px-4 py-1">
                  Limited Spots Available
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4 px-4">
                DSP Foundry Portal
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-purple-100 max-w-3xl mx-auto px-4">
                An exclusive community where DSP owners collaborate with industry-leading technology experts
                to revolutionize the way the DSP industry operates
              </p>
            </div>
          </motion.div>
        </div>

        {/* Introduction Section */}
        <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6 text-center"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              The FleetDRMS Foundry is not just another software solution. We're building something revolutionary—
              a comprehensive platform designed <span className="font-semibold text-purple-700">with</span> the DSP
              community, not just <span className="font-semibold">for</span> it.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              As a Foundry member, you'll have a direct voice in shaping the features, integrations, and priorities
              that will define the future of DSP operations technology. This is your opportunity to ensure the tools
              you use every day are built around your real-world needs—not assumptions made in a boardroom.
            </p>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 mt-8">
              <div className="flex items-start space-x-3">
                <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-gray-700 font-medium mb-2">
                    <span className="text-purple-700 font-bold">Why Invite-Only?</span>
                  </p>
                  <p className="text-gray-600 text-sm">
                    We're seeking passionate DSP owners who are ready to actively participate in shaping this platform.
                    The Foundry isn't about collecting users—it's about building a committed community of innovators
                    who will help us create something truly transformative.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Mission Content */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Core Mission Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
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
            className="mb-12"
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
            className="bg-white rounded-lg shadow-lg p-8 mb-12"
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
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How We're Different
            </h2>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
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
                <Target className="w-10 h-10 text-indigo-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Proof Through Partnership</h3>
                <p className="text-gray-600">
                  We have a fully functional proof of concept ready to demonstrate. As a Foundry member,
                  you'll access live demonstrations, test prototype features, and see your suggestions
                  become reality.
                </p>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
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
            className="bg-gray-50 rounded-lg p-8 mb-12"
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
        </div>

        {/* Call to Action Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8"
        >
          <Card className="p-10 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-purple-100" />
            <h2 className="text-3xl font-bold mb-4">
              Ready to Join the Revolution?
            </h2>
            <p className="text-lg mb-8 text-purple-100 max-w-2xl mx-auto">
              Join the FleetDRMS Foundry and be part of shaping the future of DSP operations.
              Get exclusive early access, direct founder support, and help build the platform
              that will transform our industry.
            </p>
            <Button
              size="lg"
              onClick={handleJoinFoundry}
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 font-semibold shadow-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Join the Foundry
            </Button>
            <p className="text-sm mt-6 text-purple-200">
              Free to join. No commitment required. Be part of something bigger.
            </p>
          </Card>
        </motion.div>

        {/* Final Quote */}
        <div className="max-w-4xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
          <div className="p-6 bg-purple-50 rounded-lg border-l-4 border-purple-600">
            <p className="text-gray-700 italic text-center">
              "While a SaaS product is the end result, we're creating something larger than just a
              software product to hand to the marketplace. We're building something with which we
              intend to change the industry - and this can only be done properly with the help of
              the DSP Community. This is our mission."
            </p>
            <p className="text-gray-600 mt-4 font-semibold text-center">- FleetDRMS Foundry Team</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
