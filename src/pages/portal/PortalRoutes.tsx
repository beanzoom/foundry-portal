import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { usePortal } from '@/contexts/PortalContext';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { portalRoute } from '@/lib/portal/navigation';
import { PortalAuthGuard } from '@/components/portal/PortalAuthGuard';
import { isAdminRole, isInvestorRole, type PortalRole } from '@/lib/portal/roles';
import { PortalDashboard } from '@/pages/portal/PortalDashboard';
import { PortalProfile } from '@/pages/portal/PortalProfile';
import { PortalProfileEdit } from '@/pages/portal/PortalProfileEdit';
import { PortalOnboarding } from '@/pages/portal/PortalOnboarding';
import { PortalSurveys } from '@/pages/portal/PortalSurveys';
import { PortalSurveyTake } from '@/pages/portal/PortalSurveyTake';
import { PortalEvents } from '@/pages/portal/PortalEvents';
import { EventDetail } from '@/components/portal/events/EventDetail';
import { EventsAdminDashboard } from '@/components/portal/admin/events/EventsAdminDashboard';
import { EventForm } from '@/components/portal/admin/events/EventForm';
import { PortalUpdates } from '@/pages/portal/PortalUpdates';
import { PortalReferrals } from '@/pages/portal/PortalReferrals';
import { PortalContact } from '@/pages/portal/PortalContact';
import { PortalCalculators } from '@/pages/portal/PortalCalculators';
import PortalSolutions from '@/pages/portal/solutions/PortalSolutions';
import Mission from '@/pages/portal/Mission';
import { PortalInvest } from '@/pages/portal/PortalInvest';
import { PortalInvestRoadmap } from '@/pages/portal/invest/PortalInvestRoadmap';
import { PortalInvestOpportunities } from '@/pages/portal/invest/PortalInvestOpportunities';
import { CompetitiveAdvantages } from '@/pages/portal/invest/CompetitiveAdvantages';
import { MarketOpportunityCalculator } from '@/pages/portal/invest/calculators/MarketOpportunityCalculator';
import { GrowthProjectionsCalculator } from '@/pages/portal/invest/calculators/GrowthProjectionsCalculator';
import { PortalRegisterRedirect } from '@/pages/portal/PortalRegisterRedirect';
import { PortalAuth } from '@/pages/portal/PortalAuth';
import { PortalTerms } from '@/pages/portal/PortalTerms';
import { PortalUnauthorized } from '@/pages/portal/PortalUnauthorized';
import { FoundryLanding } from '@/pages/public/FoundryLanding';

// Admin Layout and pages
import { AdminLayout } from '@/components/portal/admin/AdminLayout';
import { PortalAdminDashboard } from '@/pages/portal/admin/PortalAdminDashboard';
import { PortalAdminUsersNew } from '@/pages/portal/admin/PortalAdminUsersNew';
import { PortalAdminContent } from '@/pages/portal/admin/PortalAdminContent';
import { PortalAdminSurveys } from '@/pages/portal/admin/PortalAdminSurveys';
import { PortalAdminSurveyBuilder } from '@/pages/portal/admin/PortalAdminSurveyBuilder';
import { PortalAdminSurveyResults } from '@/pages/portal/admin/PortalAdminSurveyResults';
import { PortalAdminEventCreator } from '@/pages/portal/admin/PortalAdminEventCreator';
import { PortalAdminUpdates } from '@/pages/portal/admin/PortalAdminUpdates';
import { PortalAdminSolutionsEditor } from '@/pages/portal/admin/PortalAdminSolutionsEditor';
import { PortalAdminAnalytics } from '@/pages/portal/admin/PortalAdminAnalytics';
import { PortalAdminContacts } from '@/pages/portal/admin/PortalAdminContacts';
import { DSPDetailView } from '@/components/portal/admin/contacts/DSPDetailView';
import { PortalAdminContactSubmissions } from '@/pages/portal/admin/PortalAdminContactSubmissions';
import { TestEmail } from '@/pages/portal/admin/TestEmail';
import TestEdgeFunction from '@/pages/portal/admin/test-edge-function';
import { SettingsLayout } from '@/pages/portal/admin/settings/SettingsLayout';
import { GeneralSettings } from '@/pages/portal/admin/settings/GeneralSettings';
import { EmailSettings } from '@/pages/portal/admin/settings/EmailSettings';
import { EmailTemplates } from '@/pages/portal/admin/settings/EmailTemplates';
import { EmailLogs } from '@/pages/portal/admin/settings/EmailLogs';
import { UserSettings } from '@/pages/portal/admin/settings/UserSettings';
import { SecuritySettings } from '@/pages/portal/admin/settings/SecuritySettings';
import { DatabaseSettings } from '@/pages/portal/admin/settings/DatabaseSettings';
import { NotificationSettings } from '@/pages/portal/admin/settings/NotificationSettings';
import { NotificationCenter } from '@/pages/portal/admin/settings/NotificationCenter';
import { EmailTesting } from '@/pages/portal/admin/settings/EmailTesting';
import { EmailProcessingDashboard } from '@/pages/portal/admin/settings/EmailProcessingDashboard';
import { RolePermissions } from '@/pages/portal/admin/settings/RolePermissions';
import { CalculatorSubmissions } from '@/pages/portal/admin/reports/CalculatorSubmissions';
import { PortalAdminReferrals } from '@/pages/portal/admin/referrals/PortalAdminReferrals';
import { DocDashboard, DocViewer } from '@/pages/portal/admin/docs';
import { TestLogging } from '@/pages/portal/admin/TestLogging';
import { SimpleTest } from '@/pages/portal/admin/SimpleTest';
import { DeveloperSettings } from '@/pages/portal/admin/settings/DeveloperSettings';
import { MarketingSettings } from '@/pages/portal/admin/settings/MarketingSettings';

// Communications components
import { CommunicationsDashboard, EmailTemplates as CommunicationsTemplates, NotificationRules, RecipientLists } from '@/pages/portal/admin/communications';
import EmailQueue from '@/pages/portal/admin/communications/EmailQueue';

interface PortalProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  requireTerms?: boolean;
  adminOnly?: boolean;
  investorOnly?: boolean;
}

function PortalProtectedRoute({
  children,
  requireProfile = true,
  requireTerms = true,
  adminOnly = false,
  investorOnly = false
}: PortalProtectedRouteProps) {
  const { portalUser, isLoading } = usePortal();


  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!portalUser) {
    // Check if we're on subdomain or path-based
    const isSubdomain = window.location.hostname === 'portal.localhost' ||
                       window.location.hostname.startsWith('portal.');
    const authPath = isSubdomain ? "/" : "/portal";
    return <Navigate to={authPath} replace />;
  }

  // Check admin access using centralized role checking
  if (adminOnly && !isAdminRole(portalUser.role as PortalRole)) {
    return <Navigate to={portalRoute('/unauthorized')} />;
  }

  // Check investor access (investor, admin, super_admin only - NOT portal_member)
  if (investorOnly && !isInvestorRole(portalUser.role as PortalRole)) {
    return <Navigate to={portalRoute('/unauthorized')} />;
  }

  // Check terms acceptance (skip for portal_member as they agreed during registration)
  if (requireTerms && !portalUser.agreedToTerms && portalUser.role !== 'portal_member') {
    return <Navigate to={portalRoute('/terms')} />;
  }

  // Check profile completion - redirect to onboarding for new users
  if (requireProfile && !portalUser.profileComplete) {
    // For portal members, use onboarding wizard
    if (portalUser.role === 'portal_member') {
      return <Navigate to={portalRoute('/onboarding')} />;
    }
    // For other roles (like admins), go to profile edit
    return <Navigate to={portalRoute('/profile/edit')} />;
  }

  return <>{children}</>;
}

export function PortalRoutes() {
  const { isPortal, portalUser, isLoading } = usePortal();
  
  // VERSION MARKER - Update this when making changes to verify deployment
  
  // Check if we're on subdomain or path-based portal (NOT other subdomains like foundry)
  // Also treat Vercel preview URLs as portal subdomains
  const hostname = window.location.hostname;
  const isVercelPreview = hostname.includes('vercel.app');
  const isSubdomain = hostname === 'portal.localhost' ||
                     (hostname.startsWith('portal.') && !hostname.startsWith('foundry.')) ||
                     isVercelPreview;
  
  // IMPORTANT: Consider this a portal route if:
  // 1. We're on the portal subdomain, OR
  // 2. The path starts with /portal
  const isPortalRoute = isSubdomain || window.location.pathname.startsWith('/portal');

  // Check if we need to redirect to portal subdomain (for production)
  const urlParams = new URLSearchParams(window.location.search);
  const shouldRedirectToPortal = urlParams.get('redirect') === 'portal';
  

  // If we're on main domain with redirect=portal and user is authenticated, redirect to portal subdomain
  if (shouldRedirectToPortal && !isSubdomain && portalUser && !isLoading) {
    const portalUrl = `https://portal.fleetdrms.com${window.location.pathname.replace('/portal', '')}?from=bridge`;
    window.location.href = portalUrl;
    return null;
  }

  // For non-subdomain: Only render if we're on a /portal path
  // For subdomain: Always render (we handle all routes)
  if (!isSubdomain && !window.location.pathname.startsWith('/portal')) {
    return null;
  }

  // Show loading state only if we're definitely on a portal route
  // This prevents showing loading while RootRedirect might be trying to redirect
  if (isLoading && isPortalRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }
  
  // If no portal user and we're on a portal route, show auth
  if (isPortalRoute && !isLoading && !portalUser) {
    // For subdomain, show auth page directly instead of redirecting
    // This avoids potential redirect loops
    if (isSubdomain) {
      return <PortalAuth />;
    }
    // For path-based portal routes, don't redirect if already at /portal
    // Just let the routes below handle showing the auth page
    // This prevents infinite redirect loops
  }

  // If on subdomain, render routes at root level (no /portal prefix)
  if (isSubdomain) {
    return (
      <Routes>
        {/* Root path - shows auth for non-users, dashboard for users */}
        <Route path="/" element={
          isLoading ? (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : portalUser ? (
            <Navigate to="/dashboard" />
          ) : (
            <PortalAuth />
          )
        } />
        
        {/* Foundry landing page - public marketing page */}
        <Route path="/foundry" element={<FoundryLanding />} />

        {/* Auth page handles both sign-in and sign-up */}
        <Route path="/auth" element={<PortalAuth />} />
        {/* Register redirects to auth preserving query params for referrals */}
        <Route path="/register" element={<PortalRegisterRedirect />} />
        
        {/* Onboarding and terms - no need for full protection */}
        <Route path="/onboarding" element={
          <PortalAuthGuard requireOnboarding={false}>
            <PortalLayout>
              <PortalOnboarding />
            </PortalLayout>
          </PortalAuthGuard>
        } />
        
        <Route path="/terms" element={<PortalTerms />} />
        <Route path="/privacy" element={<PortalTerms />} />
        <Route path="/unauthorized" element={<PortalUnauthorized />} />
        
        {/* Profile edit - requires auth but not complete profile */}
        <Route path="/profile/edit" element={
          <PortalAuthGuard requireOnboarding={false}>
            <PortalLayout>
              <PortalProfileEdit />
            </PortalLayout>
          </PortalAuthGuard>
        } />
        
        {/* All protected routes wrapped in layout */}
        <Route element={
          <PortalAuthGuard>
            <PortalLayout><Outlet /></PortalLayout>
          </PortalAuthGuard>
        }>
          {/* Dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <PortalProtectedRoute>
                <PortalDashboard />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Profile */}
          <Route 
            path="/profile" 
            element={
              <PortalProtectedRoute>
                <PortalProfile />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Surveys */}
          <Route 
            path="/surveys" 
            element={
              <PortalProtectedRoute>
                <PortalSurveys />
              </PortalProtectedRoute>
            } 
          />
          
          <Route 
            path="/surveys/:surveyId" 
            element={
              <PortalProtectedRoute>
                <PortalSurveyTake />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Events */}
          <Route 
            path="/events" 
            element={
              <PortalProtectedRoute>
                <PortalEvents />
              </PortalProtectedRoute>
            } 
          />
          
          <Route 
            path="/events/:id" 
            element={
              <PortalProtectedRoute>
                <EventDetail />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Updates */}
          <Route 
            path="/updates" 
            element={
              <PortalProtectedRoute>
                <PortalUpdates />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Solutions */}
          <Route 
            path="/solutions" 
            element={
              <PortalProtectedRoute>
                <PortalSolutions />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Referrals */}
          <Route 
            path="/referrals" 
            element={
              <PortalProtectedRoute>
                <PortalReferrals />
              </PortalProtectedRoute>
            } 
          />
          
          {/* Contact */}
          <Route
            path="/contact"
            element={
              <PortalProtectedRoute>
                <PortalContact />
              </PortalProtectedRoute>
            }
          />

          {/* Mission */}
          <Route
            path="/mission"
            element={
              <PortalProtectedRoute>
                <Mission />
              </PortalProtectedRoute>
            }
          />
          
          {/* Calculators */}
          <Route
            path="/calculators"
            element={
              <PortalProtectedRoute>
                <PortalCalculators />
              </PortalProtectedRoute>
            }
          />

          {/* Solutions Showcase */}
          <Route
            path="solutions"
            element={<PortalSolutions />}
          />

          {/* Invest routes - Investor only (NOT portal_member) */}
          <Route
            path="/invest"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <PortalInvest />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/invest/roadmap"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <PortalInvestRoadmap />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/invest/opportunities"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <PortalInvestOpportunities />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/invest/competitive-advantages"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <CompetitiveAdvantages />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/invest/calculators/market-opportunity"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <MarketOpportunityCalculator />
              </PortalProtectedRoute>
            }
          />
          <Route
            path="/invest/calculators/growth-projections"
            element={
              <PortalProtectedRoute investorOnly={true}>
                <GrowthProjectionsCalculator />
              </PortalProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route path="admin" element={
            <PortalProtectedRoute adminOnly={true}>
              <AdminLayout><Outlet /></AdminLayout>
            </PortalProtectedRoute>
          }>
            <Route index element={<PortalAdminDashboard />} />
            <Route path="dashboard" element={<PortalAdminDashboard />} />
            <Route path="users" element={<PortalAdminUsersNew />} />
            <Route path="content" element={<PortalAdminContent />} />
            <Route path="surveys" element={<PortalAdminSurveys />} />
            <Route path="surveys/new" element={<PortalAdminSurveyBuilder />} />
            <Route path="surveys/:surveyId/edit" element={<PortalAdminSurveyBuilder />} />
            <Route path="surveys/:surveyId/results" element={<PortalAdminSurveyResults />} />
            <Route path="events" element={<EventsAdminDashboard />} />
            <Route path="events/new" element={<EventForm />} />
            <Route path="events/:id/edit" element={<EventForm />} />
            <Route path="referrals" element={<PortalAdminReferrals />} />
            <Route path="updates" element={<PortalAdminUpdates />} />
            <Route path="solutions" element={<PortalAdminSolutionsEditor />} />
            <Route path="analytics" element={<PortalAdminAnalytics />} />

            {/* Communications Routes - standalone with Settings layout wrapper */}
            <Route path="communications" element={<SettingsLayout />}>
              <Route index element={<CommunicationsDashboard />} />
              <Route path="templates" element={<CommunicationsTemplates />} />
              <Route path="rules" element={<NotificationRules />} />
              <Route path="recipient-lists" element={<RecipientLists />} />
              <Route path="activity" element={<EmailLogs />} />
              <Route path="queue" element={<EmailQueue />} />
              <Route path="testing" element={<TestEmail />} />
            </Route>

            {/* Settings with nested routes */}
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<GeneralSettings />} />

              {/* Marketing Settings */}
              <Route path="marketing" element={<MarketingSettings />} />

              {/* Communications Routes - nested within Settings */}
              <Route path="communications" element={<CommunicationsDashboard />} />
              <Route path="communications/templates" element={<CommunicationsTemplates />} />
              <Route path="communications/rules" element={<NotificationRules />} />
              <Route path="communications/recipient-lists" element={<RecipientLists />} />
              <Route path="communications/activity" element={<EmailLogs />} />
              <Route path="communications/queue" element={<EmailQueue />} />
              <Route path="communications/testing" element={<TestEmail />} />

              <Route path="email" element={<EmailSettings />} />
              <Route path="email/templates" element={<EmailTemplates />} />
              <Route path="email/logs" element={<EmailLogs />} />
              <Route path="email/testing" element={<EmailTesting />} />
              <Route path="email/processing" element={<EmailProcessingDashboard />} />
              <Route path="users" element={<UserSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="permissions" element={<RolePermissions />} />
              <Route path="database" element={<DatabaseSettings />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="developer" element={<DeveloperSettings />} />
            </Route>
            <Route path="contact-submissions" element={<PortalAdminContactSubmissions />} />
            <Route path="test-email" element={<TestEmail />} />
            <Route path="test-edge-function" element={<TestEdgeFunction />} />
            <Route path="test-logging" element={<SimpleTest />} />
            {/* Reports */}
            <Route path="reports/calculator-submissions" element={<CalculatorSubmissions />} />
            {/* Contacts with nested routes */}
            <Route path="contacts">
              <Route index element={<PortalAdminContacts />} />
              <Route path="analytics" element={<PortalAdminContacts />} />
              <Route path="activity" element={<PortalAdminContacts />} />
              <Route path="organization" element={<PortalAdminContacts />} />
              <Route path="organization/overview" element={<PortalAdminContacts />} />
              <Route path="organization/contacts" element={<PortalAdminContacts />} />
              <Route path="organization/markets" element={<PortalAdminContacts />} />
              <Route path="organization/stations" element={<PortalAdminContacts />} />
              <Route path="organization/dsps" element={<PortalAdminContacts />} />
              <Route path="organization/regions" element={<PortalAdminContacts />} />
              <Route path="organization/dsps/:dspId" element={<DSPDetailView />} />
            </Route>
            {/* Documentation routes */}
            <Route path="docs">
              <Route index element={<DocDashboard />} />
              <Route path=":docId" element={<DocViewer />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    );
  }
  
  // Path-based routing - we're already inside /portal/* so use relative paths

  return (
    <Routes>
      {/* Root portal path - shows auth page (dashboard redirect handled by auth on success) */}
      <Route index element={<PortalAuth />} />
      <Route path="" element={<PortalAuth />} />
      
      {/* Auth page handles both sign-in and sign-up */}
      <Route path="auth" element={<PortalAuth />} />
      {/* Register redirects to auth preserving query params for referrals */}
      <Route path="register" element={<PortalRegisterRedirect />} />
      
      {/* Onboarding page - requires auth but not profile completion, wrapped in layout */}
      <Route path="onboarding" element={
        <PortalAuthGuard requireOnboarding={false}>
          <PortalLayout>
            <PortalOnboarding />
          </PortalLayout>
        </PortalAuthGuard>
      } />
      
      {/* Privacy policy (reusing terms component) */}
      <Route path="privacy" element={<PortalTerms />} />
      
      {/* Unauthorized page - no layout */}
      <Route path="unauthorized" element={<PortalUnauthorized />} />
      
      {/* Profile edit page - requires auth but not profile completion, wrapped in layout */}
      <Route path="profile/edit" element={
        <PortalAuthGuard requireOnboarding={false}>
          <PortalLayout>
            <PortalProfileEdit />
          </PortalLayout>
        </PortalAuthGuard>
      } />
      
      {/* All other routes wrapped in layout and auth guard */}
      <Route element={
        <PortalAuthGuard>
          <PortalLayout><Outlet /></PortalLayout>
        </PortalAuthGuard>
      }>
        {/* Terms acceptance (requires auth but not profile) */}
        <Route 
          path="terms" 
          element={
            <PortalProtectedRoute requireProfile={false} requireTerms={false}>
              <PortalTerms />
            </PortalProtectedRoute>
          } 
        />
        
        {/* Protected portal routes - renamed from home to dashboard */}
        <Route 
          path="dashboard" 
          element={
            <PortalProtectedRoute>
              <PortalDashboard />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="profile" 
          element={
            <PortalProtectedRoute>
              <PortalProfile />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="surveys" 
          element={
            <PortalProtectedRoute>
              <PortalSurveys />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="surveys/:surveyId" 
          element={
            <PortalProtectedRoute>
              <PortalSurveyTake />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="events" 
          element={
            <PortalProtectedRoute>
              <PortalEvents />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="events/:id" 
          element={
            <PortalProtectedRoute>
              <EventDetail />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="updates" 
          element={
            <PortalProtectedRoute>
              <PortalUpdates />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="solutions" 
          element={
            <PortalProtectedRoute>
              <PortalSolutions />
            </PortalProtectedRoute>
          } 
        />
        
        <Route 
          path="referrals" 
          element={
            <PortalProtectedRoute>
              <PortalReferrals />
            </PortalProtectedRoute>
          } 
        />
        
        <Route
          path="contact"
          element={
            <PortalProtectedRoute>
              <PortalContact />
            </PortalProtectedRoute>
          }
        />

        <Route
          path="mission"
          element={
            <PortalProtectedRoute>
              <Mission />
            </PortalProtectedRoute>
          }
        />
        
        <Route
          path="calculators"
          element={
            <PortalProtectedRoute>
              <PortalCalculators />
            </PortalProtectedRoute>
          }
        />

        {/* Invest routes - Investor only (NOT portal_member) */}
        <Route
          path="invest"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <PortalInvest />
            </PortalProtectedRoute>
          }
        />
        <Route
          path="invest/roadmap"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <PortalInvestRoadmap />
            </PortalProtectedRoute>
          }
        />
        <Route
          path="invest/opportunities"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <PortalInvestOpportunities />
            </PortalProtectedRoute>
          }
        />
        <Route
          path="invest/competitive-advantages"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <CompetitiveAdvantages />
            </PortalProtectedRoute>
          }
        />
        <Route
          path="invest/calculators/market-opportunity"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <MarketOpportunityCalculator />
            </PortalProtectedRoute>
          }
        />
        <Route
          path="invest/calculators/growth-projections"
          element={
            <PortalProtectedRoute investorOnly={true}>
              <GrowthProjectionsCalculator />
            </PortalProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="admin" element={
          <PortalProtectedRoute adminOnly={true}>
            <AdminLayout><Outlet /></AdminLayout>
          </PortalProtectedRoute>
        }>
          <Route index element={<PortalAdminDashboard />} />
          <Route path="dashboard" element={<PortalAdminDashboard />} />
          <Route path="users" element={<PortalAdminUsersNew />} />
          <Route path="content" element={<PortalAdminContent />} />
          <Route path="surveys" element={<PortalAdminSurveys />} />
          <Route path="surveys/new" element={<PortalAdminSurveyBuilder />} />
          <Route path="surveys/:surveyId/edit" element={<PortalAdminSurveyBuilder />} />
          <Route path="surveys/:surveyId/results" element={<PortalAdminSurveyResults />} />
          <Route path="events" element={<EventsAdminDashboard />} />
          <Route path="events/new" element={<EventForm />} />
          <Route path="events/:id/edit" element={<EventForm />} />
          <Route path="referrals" element={<PortalAdminReferrals />} />
          <Route path="updates" element={<PortalAdminUpdates />} />
          <Route path="solutions" element={<PortalAdminSolutionsEditor />} />
          <Route path="analytics" element={<PortalAdminAnalytics />} />

          {/* Communications Routes - standalone with Settings layout wrapper */}
          <Route path="communications" element={<SettingsLayout />}>
            <Route index element={<CommunicationsDashboard />} />
            <Route path="templates" element={<CommunicationsTemplates />} />
            <Route path="rules" element={<NotificationRules />} />
            <Route path="recipient-lists" element={<RecipientLists />} />
            <Route path="activity" element={<EmailLogs />} />
            <Route path="queue" element={<EmailQueue />} />
            <Route path="testing" element={<TestEmail />} />
          </Route>

          {/* Settings with nested routes */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<GeneralSettings />} />

            {/* Marketing Settings */}
            <Route path="marketing" element={<MarketingSettings />} />

            {/* Communications Routes - nested within Settings */}
            <Route path="communications" element={<CommunicationsDashboard />} />
            <Route path="communications/templates" element={<CommunicationsTemplates />} />
            <Route path="communications/rules" element={<NotificationRules />} />
            <Route path="communications/recipient-lists" element={<RecipientLists />} />
            <Route path="communications/activity" element={<EmailLogs />} />
            <Route path="communications/queue" element={<EmailQueue />} />
            <Route path="communications/testing" element={<TestEmail />} />

            <Route path="email" element={<EmailSettings />} />
            <Route path="email/templates" element={<EmailTemplates />} />
            <Route path="email/logs" element={<EmailLogs />} />
            <Route path="email/testing" element={<EmailTesting />} />
            <Route path="email/processing" element={<EmailProcessingDashboard />} />
            <Route path="users" element={<UserSettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="permissions" element={<RolePermissions />} />
            <Route path="database" element={<DatabaseSettings />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="developer" element={<DeveloperSettings />} />
          </Route>
          <Route path="contact-submissions" element={<PortalAdminContactSubmissions />} />
          <Route path="test-email" element={<TestEmail />} />
          <Route path="test-edge-function" element={<TestEdgeFunction />} />
          <Route path="test-logging" element={<SimpleTest />} />
          {/* Reports */}
          <Route path="reports/calculator-submissions" element={<CalculatorSubmissions />} />
          {/* Contacts with nested routes */}
          <Route path="contacts">
            <Route index element={<PortalAdminContacts />} />
            <Route path="analytics" element={<PortalAdminContacts />} />
            <Route path="activity" element={<PortalAdminContacts />} />
            <Route path="organization" element={<PortalAdminContacts />} />
            <Route path="organization/overview" element={<PortalAdminContacts />} />
            <Route path="organization/contacts" element={<PortalAdminContacts />} />
            <Route path="organization/markets" element={<PortalAdminContacts />} />
            <Route path="organization/stations" element={<PortalAdminContacts />} />
            <Route path="organization/dsps" element={<PortalAdminContacts />} />
            <Route path="organization/regions" element={<PortalAdminContacts />} />
            <Route path="organization/dsps/:dspId" element={<DSPDetailView />} />
          </Route>
          {/* Documentation routes */}
          <Route path="docs">
            <Route index element={<DocDashboard />} />
            <Route path=":docId" element={<DocViewer />} />
          </Route>
        </Route>

      </Route>
      
      {/* Default redirects - outside layout */}
      <Route path="home" element={<Navigate to={portalRoute('/dashboard')} />} />
      {/* Don't redirect root "/" to portal - let main app handle it */}
    </Routes>
  );
}