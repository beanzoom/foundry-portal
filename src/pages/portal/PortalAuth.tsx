import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { usePortal } from '@/contexts/PortalContext';
import { TermsOfUseModal } from '@/components/auth/TermsOfUseModal';
import { createLogger } from '@/lib/logging';

const logger = createLogger('PortalAuth');

export function PortalAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { portalUser, isLoading: portalLoading } = usePortal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State - declare these early so they're available for useEffect
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [referralData, setReferralData] = useState<{
    referee_first_name: string;
    referee_last_name: string;
    referee_email: string;
    referrer_name: string;
    dsp_name: string;
  } | null>(null);

  const message = searchParams.get('message');
  const referralCode = searchParams.get('ref');
  const campaign = searchParams.get('campaign');
  const redirect = searchParams.get('redirect') || '/portal/dashboard';

  // Determine default tab based on referral code presence
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(referralCode ? 'signup' : 'signup'); // Default to signup
  
  // If user is on subdomain, adjust the redirect path
  const hostname = window.location.hostname;
  const isVercelPreview = hostname.includes('vercel.app');
  const isSubdomain = hostname === 'portal.localhost' ||
                     hostname.startsWith('portal.') ||
                     isVercelPreview;
  const adjustedRedirect = isSubdomain && redirect.startsWith('/portal')
    ? redirect.replace('/portal', '')
    : redirect;

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (!portalLoading && portalUser) {
        // Trust PortalContext - if portalUser exists, they're authenticated
        logger.debug('[PortalAuth] User already logged in, redirecting to:', adjustedRedirect);
        navigate(adjustedRedirect, { replace: true });
        return;
      }
      
      // If no portalUser but we're not loading, check if there's a session
      if (!portalLoading && !portalUser) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          logger.debug('[PortalAuth] Found active session, checking portal access for user:', session.user.id);
          
          // Check if this user has portal access
          const { data: systemRoles } = await supabase
            .from('system_user_assignments')
            .select('system_role')
            .eq('user_id', session.user.id)
            .eq('is_active', true);
          
          const isSystemAdmin = systemRoles?.some(r => 
            r.system_role === 'super_admin' || r.system_role === 'admin'
          );
          
          if (isSystemAdmin) {
            logger.debug('[PortalAuth] User is system admin, auto-redirecting to portal');
            navigate(adjustedRedirect, { replace: true });
          }
        }
      }
    };
    
    checkAuth();
  }, [portalUser, portalLoading, adjustedRedirect, navigate]);

  // Fetch referral data when referral code is present
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!referralCode) {
        logger.debug('[PortalAuth] No referral code in URL');
        return;
      }

      logger.debug('[PortalAuth] Fetching referral data for code:', referralCode);

      try {
        const { data, error } = await supabase.rpc('get_referral_by_code', {
          p_code: referralCode
        });

        logger.debug('[PortalAuth] RPC Response:', { data, error });

        if (error) {
          console.error('[PortalAuth] Error fetching referral:', error);
          toast({
            variant: 'destructive',
            title: 'Invalid Referral Code',
            description: 'The referral link appears to be invalid or expired.'
          });
          return;
        }

        if (data && data.length > 0) {
          const referral = data[0];
          logger.debug('[PortalAuth] Referral data found:', referral);

          setReferralData(referral);

          // Pre-populate sign-up form - do it here directly
          logger.debug('[PortalAuth] Pre-populating form with:', {
            firstName: referral.referee_first_name,
            lastName: referral.referee_last_name,
            email: referral.referee_email
          });

          setFirstName(referral.referee_first_name || '');
          setLastName(referral.referee_last_name || '');
          setSignUpEmail(referral.referee_email || '');

          toast({
            title: `Welcome!`,
            description: `${referral.referrer_name} invited you to join FleetDRMS Portal`,
          });
        } else {
          logger.debug('[PortalAuth] No referral data returned for code:', referralCode);
        }
      } catch (err) {
        console.error('[PortalAuth] Unexpected error fetching referral:', err);
      }
    };

    fetchReferralData();
  }, [referralCode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      logger.debug('[PortalAuth] Attempting sign in for:', signInEmail);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) {
        console.error('[PortalAuth] Sign in error:', error);
        // Provide more specific error messages
        if (error.message.includes('Database error')) {
          throw new Error('Database connection issue. Please try again in a moment.');
        }
        throw error;
      }

      if (data?.session) {
        // Check if user is a portal member
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, profile_complete')
          .eq('id', data.user.id)
          .single();

        // Check if user has portal access
        // First check profile role
        const profileRole = profile?.role?.toLowerCase().replace('-', '_'); // Normalize: super-admin -> super_admin
        const allowedRoles = ['superadmin', 'super_admin', 'admin', 'portal_admin', 'portal_member', 'portal_investor', 'investor'];
        let hasPortalAccess = allowedRoles.includes(profileRole) || allowedRoles.includes(profile?.role);
        
        // If not in profile, check system_user_assignments for system admins
        if (!hasPortalAccess) {
          logger.debug('[PortalAuth] Checking system_user_assignments for admin access...');
          const { data: systemRoles } = await supabase
            .from('system_user_assignments')
            .select('system_role')
            .eq('user_id', data.user.id)
            .eq('is_active', true);
          
          if (systemRoles && systemRoles.length > 0) {
            hasPortalAccess = systemRoles.some(r => 
              r.system_role === 'super_admin' || r.system_role === 'admin'
            );
            if (hasPortalAccess) {
              logger.debug('[PortalAuth] System admin access granted');
            }
          }
        }
        
        // If still no access, check portal_memberships
        if (!hasPortalAccess) {
          const { data: portalMembership } = await supabase
            .from('portal_memberships')
            .select('portal_role')
            .eq('user_id', data.user.id)
            .eq('is_active', true)
            .single();
          
          if (portalMembership) {
            hasPortalAccess = true;
            logger.debug('[PortalAuth] Portal membership found:', portalMembership.portal_role);
          }
        }
        
        if (!hasPortalAccess) {
          logger.debug('[PortalAuth] User does not have portal access. Role:', profile?.role);
          // DO NOT SIGN OUT - just show error
          setError('You do not have access to the portal. Portal access is limited to portal members, investors, and administrators.');
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Redirecting to your portal...",
        });

        // Redirect based on profile completion
        if (profile?.profile_complete) {
          logger.debug('[PortalAuth] Navigating to:', adjustedRedirect);
          navigate(adjustedRedirect);
        } else {
          const onboardingPath = isSubdomain ? '/onboarding' : '/portal/onboarding';
          logger.debug('[PortalAuth] Profile incomplete, navigating to:', onboardingPath);
          navigate(onboardingPath);
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('You must accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: 'portal_member',
            referral_code: referralCode || null,
            referral_data: referralData || null,
            profile_complete: false,
            registration_source: 'portal'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user account');

      // Ensure profile has portal_member role
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            role: 'portal_member',
            profile_complete: false,
            terms_accepted_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      } else {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: signUpEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'portal_member',
            profile_complete: false,
            terms_accepted_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      // Add to portal_memberships
      const { error: membershipError } = await supabase
        .from('portal_memberships')
        .insert({
          user_id: authData.user.id,
          member_type: 'dsp_owner',
          status: 'active',
          onboarding_completed: false
        });

      if (membershipError) {
        console.error('Portal membership error:', membershipError);
      }

      // Record referral conversion if using a referral code
      if (referralCode) {
        try {
          logger.debug('[PortalAuth] Recording referral conversion for code:', referralCode, 'campaign:', campaign);
          const { error: conversionError } = await supabase.rpc('record_referral_conversion', {
            p_referral_code: referralCode,
            p_user_id: authData.user.id,
            p_metadata: {
              email: signUpEmail,
              first_name: firstName,
              last_name: lastName,
              registered_at: new Date().toISOString(),
              source: 'portal_auth',
              campaign: campaign || undefined // Include campaign if present
            }
          });

          if (conversionError) {
            console.error('[PortalAuth] Error recording conversion:', conversionError);
            // Don't block signup if conversion recording fails
          } else {
            logger.debug('[PortalAuth] Referral conversion recorded successfully');
          }
        } catch (err) {
          console.error('[PortalAuth] Unexpected error recording conversion:', err);
          // Don't block signup if conversion recording fails
        }
      }

      toast({
        title: "Account created!",
        description: "Signing you in...",
      });

      // Auto sign in the user after signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (signInError) {
        console.error('Auto sign-in error:', signInError);
        // If auto sign-in fails, switch to sign in tab
        setActiveTab('signin');
        setSignInEmail(signUpEmail);
        toast({
          title: "Account created!",
          description: "Please sign in with your credentials.",
        });
      } else if (signInData?.session) {
        // Successfully signed in
        logger.debug('[PortalAuth] Sign up successful, session established:', signInData.session.user.id);
        
        // Wait a moment for the profile to be created via database trigger/RLS
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify the profile exists before redirecting
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, profile_complete')
          .eq('id', signInData.session.user.id)
          .single();
        
        logger.debug('[PortalAuth] Profile check after signup:', profile);
        
        toast({
          title: "Welcome to DSP Foundry Portal!",
          description: "Let's set up your profile.",
        });
        
        // Use window.location to force a full reload, ensuring all contexts are refreshed
        // Add a small additional delay to ensure everything is ready
        setTimeout(() => {
          const redirectPath = isSubdomain ? '/onboarding' : '/portal/onboarding';
          logger.debug('[PortalAuth] Redirecting new user to onboarding:', redirectPath);
          // Use replace to ensure we don't create a back button issue
          window.location.replace(redirectPath);
        }, 500);
        return;
      }
      
      // Clear sign up form
      setSignUpEmail('');
      setSignUpPassword('');
      setFirstName('');
      setLastName('');
      setTermsAccepted(false);
      
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  logger.debug('[PortalAuth] Rendering state:', {
    portalLoading,
    portalUser: portalUser?.id,
    activeTab,
    error,
    message
  });

  // Show loading while checking if user is already logged in
  if (portalLoading) {
    logger.debug('[PortalAuth] Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  logger.debug('[PortalAuth] Rendering main auth form');
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Portal Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DSP Foundry Portal</h1>
          <p className="text-purple-100">Access your business dashboard</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-2xl">
          {message && (
            <Alert className="m-4 mb-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {referralData && activeTab === 'signup' && (
            <div className="px-6 pt-6">
              <Alert className="bg-purple-50 border-purple-200">
                <AlertDescription className="text-purple-800 text-center">
                  <strong>{referralData.referrer_name}</strong> invited you to join FleetDRMS Portal
                  {referralData.dsp_name && ` for ${referralData.dsp_name}`}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                {activeTab === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === 'signup' ? (
                  <>Join the FleetDRMS Portal community</>
                ) : (
                  <>Sign in to access your dashboard</>
                )}
              </CardDescription>
            </CardHeader>

            {/* Sign In Tab */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signup')}
                      className="text-purple-600 hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </div>
                </CardContent>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                      disabled={loading}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="text-purple-600 hover:underline"
                      >
                        Terms of Use & Privacy Policy
                      </button>
                    </Label>
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={loading || !termsAccepted}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('signin')}
                      className="text-purple-600 hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

      </div>

      {/* Terms of Use Modal */}
      <TermsOfUseModal 
        open={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
}