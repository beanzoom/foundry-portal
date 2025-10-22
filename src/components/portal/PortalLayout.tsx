import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalRole } from '@/hooks/usePortalRole';
import {
  Home,
  Megaphone,
  ClipboardList,
  Calendar,
  CheckCircle,
  Mail,
  User,
  UserPlus,
  Bell,
  Menu,
  X,
  Calculator,
  Shield,
  LogOut,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { AdvisoryNotifications } from '@/components/portal/updates/AdvisoryNotifications';
import { CompulsoryUpdateModal } from '@/components/portal/updates/CompulsoryUpdateModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/usePortalUpdates';
import { useAvailableSurveysCount } from '@/hooks/usePortalSurveys';
import { useUpcomingEventsCount } from '@/hooks/usePortalEvents';
import { NDAModal } from '@/components/portal/NDAModal';
import { MembershipAgreementModal } from '@/components/portal/MembershipAgreementModal';
import { ndaService } from '@/services/nda.service';
import { membershipAgreementService } from '@/services/membership-agreement.service';
import { toast } from '@/hooks/use-toast';
import { PortalFooter } from '@/components/portal/PortalFooter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PortalLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  badge?: number;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { portalUser } = usePortal();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notificationCount = useUnreadCount();
  const { data: availableSurveysCount = 0 } = useAvailableSurveysCount();
  const { data: upcomingEventsCount = 0 } = useUpcomingEventsCount();
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileCheckLoading, setProfileCheckLoading] = useState(true);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [ndaCheckComplete, setNdaCheckComplete] = useState(false);
  const [membershipCheckComplete, setMembershipCheckComplete] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  
  // Check if we're on subdomain to determine path prefix
  const isSubdomain = window.location.hostname === 'portal.localhost' || 
                     window.location.hostname.startsWith('portal.');
  const pathPrefix = isSubdomain ? '' : '/portal';

  // Check if user is admin/investor using centralized role checking
  const { isAdmin, isInvestor } = usePortalRole();

  // Check profile completion and legal documents agreement status
  useEffect(() => {
    const checkProfileAndLegalDocs = async () => {
      if (!user) {
        setProfileCheckLoading(false);
        setNdaCheckComplete(true);
        setMembershipCheckComplete(true);
        return;
      }

      try {
        // Get profile data
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_complete, first_name, last_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking profile:', error);
        } else {
          setProfileComplete(profile?.profile_complete || false);
          setUserProfile({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || ''
          });

          // Check legal documents only if profile is complete
          if (profile?.profile_complete) {
            // Check NDA agreement
            const hasAgreedToNDA = await ndaService.checkUserAgreement(user.id);
            setNdaCheckComplete(true);
            
            if (!hasAgreedToNDA) {
              setShowNDAModal(true);
            } else {
              // Only check Membership Agreement if NDA is complete
              const hasAgreedToMembership = await membershipAgreementService.checkUserAgreement(user.id);
              setMembershipCheckComplete(true);
              
              if (!hasAgreedToMembership) {
                setShowMembershipModal(true);
              }
            }
          }
        }
      } catch (err) {
        console.error('Profile/Legal docs check error:', err);
      } finally {
        setProfileCheckLoading(false);
        if (!showNDAModal) setNdaCheckComplete(true);
        if (!showMembershipModal) setMembershipCheckComplete(true);
      }
    };

    checkProfileAndLegalDocs();
  }, [user]);

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      route: `${pathPrefix}/dashboard`
    },
    {
      id: 'updates',
      label: 'Updates',
      icon: <Megaphone className="w-5 h-5" />,
      route: `${pathPrefix}/updates`,
      badge: notificationCount
    },
    {
      id: 'surveys',
      label: 'Surveys',
      icon: <ClipboardList className="w-5 h-5" />,
      route: `${pathPrefix}/surveys`,
      badge: availableSurveysCount
    },
    {
      id: 'events',
      label: 'Events',
      icon: <Calendar className="w-5 h-5" />,
      route: `${pathPrefix}/events`,
      badge: upcomingEventsCount
    },
    {
      id: 'solutions',
      label: 'Current Solutions',
      icon: <CheckCircle className="w-5 h-5" />,
      route: `${pathPrefix}/solutions`
    },
    {
      id: 'referrals',
      label: 'Referrals',
      icon: <UserPlus className="w-5 h-5" />,
      route: `${pathPrefix}/referrals`
    },
    {
      id: 'calculators',
      label: 'Calculators',
      icon: <Calculator className="w-5 h-5" />,
      route: `${pathPrefix}/calculators`
    },
    {
      id: 'mission',
      label: 'Our Mission',
      icon: <Target className="w-5 h-5" />,
      route: `${pathPrefix}/mission`
    }
  ];

  // Add Invest link for investors and admins only (NOT portal_members)
  if (isInvestor) {
    navigationItems.push({
      id: 'invest',
      label: 'Invest',
      icon: <TrendingUp className="w-5 h-5" />,
      route: `${pathPrefix}/invest`
    });
  }

  // Add Contact link after Invest
  navigationItems.push({
    id: 'contact',
    label: 'Contact',
    icon: <Mail className="w-5 h-5" />,
    route: `${pathPrefix}/contact`
  });

  // Add admin link for admin users
  if (isAdmin) {
    navigationItems.push({
      id: 'admin',
      label: 'Admin',
      icon: <Shield className="w-5 h-5" />,
      route: `${pathPrefix}/admin/dashboard`
    });
  }

  const isActiveRoute = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Use window.location to force a full page reload after sign out
      // This ensures all auth contexts are cleared and reset
      const signOutPath = isSubdomain ? '/' : '/portal';
      window.location.href = signOutPath;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 via-purple-800 to-purple-800 text-white z-50 border-b border-purple-700/30 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between h-full">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center gap-4 px-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-purple-700/50 rounded transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="text-xl font-semibold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              FleetDRMS DSP Foundry Portal
            </div>
          </div>

          {/* Right side with gray background - Logo, Notifications and User */}
          <div className="flex items-center h-full" style={{ backgroundColor: '#eae9ee' }}>
            {/* Logo */}
            <div className="flex items-center h-full px-4">
              <img 
                src="/logo-transparent.png" 
                alt="Company Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>

            {/* Notification Bell with Updates */}
            <div className="px-2">
              <AdvisoryNotifications />
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2 px-4">
              <div className="hidden sm:block text-sm text-right">
                <div className="font-medium text-gray-800">{portalUser?.name || 'User'}</div>
                <div className="text-xs text-gray-600">{portalUser?.companyName}</div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-300 rounded transition-colors">
                    <User className="w-5 h-5 text-gray-700" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{portalUser?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{portalUser?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={`${pathPrefix}/profile`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar and Content */}
      <div className="flex flex-1 pt-16 relative">
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 z-40",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4">
            {/* Logo in Sidebar */}
            <div className="flex justify-center mb-6 pb-4 border-b border-gray-200">
              <img 
                src="/logo-transparent.png" 
                alt="Company Logo" 
                className="h-32 w-auto object-contain"
              />
            </div>
            
            <ul className="space-y-1">
              {navigationItems.map(item => (
                <li key={item.id}>
                  <Link
                    to={item.route}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActiveRoute(item.route)
                        ? "bg-blue-50 text-blue-600 border-l-3 border-blue-600 font-semibold"
                        : item.id === 'invest'
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 font-semibold border border-green-200"
                        : item.id === 'contact'
                        ? "bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200"
                        : item.id === 'mission'
                        ? "text-purple-700 hover:bg-purple-50 italic"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.icon}
                    <span className={cn("flex-1", item.id === 'mission' && "font-medium")}>{item.label}</span>
                    {item.id === 'invest' && (
                      <Badge className="ml-auto bg-green-600 text-white">NEW</Badge>
                    )}
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Profile link at bottom */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <Link
                to={`${pathPrefix}/profile`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActiveRoute(`${pathPrefix}/profile`)
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-60 flex flex-col">
          <div className="flex-1 p-6">
            {children}
          </div>
          {/* Footer positioned at the bottom of main content */}
          <PortalFooter />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* NDA Modal - Must be agreed to before accessing portal */}
      {ndaCheckComplete && showNDAModal && userProfile && (
        <NDAModal
          open={showNDAModal}
          userFirstName={userProfile.first_name}
          userLastName={userProfile.last_name}
          onAgree={async (agreedText, typedName) => {
            if (!user) return;

            const result = await ndaService.saveAgreement(
              user.id,
              agreedText,
              typedName,
              `${userProfile.first_name} ${userProfile.last_name}`
            );

            if (result.success) {
              setShowNDAModal(false);
              toast({
                title: "NDA Agreement Saved",
                description: "Thank you for agreeing to the NDA. Please review the Membership Agreement.",
              });
              
              // Now check and show Membership Agreement
              const hasAgreedToMembership = await membershipAgreementService.checkUserAgreement(user.id);
              if (!hasAgreedToMembership) {
                setShowMembershipModal(true);
              }
              setMembershipCheckComplete(true);
            } else {
              throw new Error(result.error || 'Failed to save agreement');
            }
          }}
        />
      )}

      {/* Membership Agreement Modal - Must be agreed to after NDA */}
      {membershipCheckComplete && showMembershipModal && userProfile && (
        <MembershipAgreementModal
          open={showMembershipModal}
          userFirstName={userProfile.first_name}
          userLastName={userProfile.last_name}
          onAgree={async (agreedText, typedName) => {
            if (!user) return;

            const result = await membershipAgreementService.saveAgreement(
              user.id,
              agreedText,
              typedName,
              `${userProfile.first_name} ${userProfile.last_name}`
            );

            if (result.success) {
              setShowMembershipModal(false);
              toast({
                title: "Membership Agreement Saved",
                description: "Thank you for agreeing to the Membership Agreement. You can now access the portal.",
              });
            } else {
              throw new Error(result.error || 'Failed to save membership agreement');
            }
          }}
        />
      )}

      {/* Compulsory updates - only show if profile is complete, both agreements signed, and we're not on the onboarding page */}
      {!profileCheckLoading && profileComplete && !showNDAModal && !showMembershipModal && location.pathname !== '/portal/onboarding' && (
        <CompulsoryUpdateModal />
      )}
    </div>
  );
}

