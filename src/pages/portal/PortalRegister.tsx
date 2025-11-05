import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function PortalRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }


    setLoading(true);
    
    console.log('[PortalRegister] Starting registration for:', formData.email);

    try {
      // Create user account with portal_member role
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'portal_member', // Default role for portal registrations
            profile_complete: false, // Flag to track if they've completed onboarding (using profile_complete to match database)
            registration_source: 'portal'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // IMPORTANT: Ensure the profile gets the portal_member role
        // First, check if profile exists (it should be auto-created by trigger)
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', authData.user.id)
          .single();

        if (existingProfile) {
          // Update existing profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'portal_member', // CRITICAL: Set portal_member role
              profile_complete: false
            })
            .eq('id', authData.user.id);

          if (profileError) {
            console.error('Error updating profile role:', profileError);
            throw profileError;
          }
        } else {
          // Create profile if it doesn't exist
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              role: 'portal_member', // CRITICAL: Set portal_member role
              profile_complete: false
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw profileError;
          }
        }
        
        console.log('[PortalRegister] Profile role set to portal_member for user:', authData.user.id);

        // Add to portal_memberships table
        const { error: membershipError } = await supabase
          .from('portal_memberships')
          .insert({
            user_id: authData.user.id,
            portal_role: 'dsp_owner',
            status: 'active',
            is_active: true
          });

        if (membershipError) {
          console.error('Portal membership error:', membershipError);
          // Don't throw - this is not critical for initial registration
          // User can still access portal and complete profile
        }

        // Add to user_acquisition_details for tracking
        const { error: acquisitionError } = await supabase
          .from('user_acquisition_details')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'portal_member',
            acquisition_source: 'portal_registration',
            referral_status: 'pending'
          });

        if (acquisitionError) {
          console.error('User acquisition tracking error:', acquisitionError);
          // Don't throw - this is just for analytics
        }

        setRegistrationSuccess(true);

        toast({
          title: "Registration successful!",
          description: "You can now sign in to your account.",
        });

        // Redirect to auth page after 2 seconds
        setTimeout(() => {
          navigate('/auth?portal=true&message=Registration successful! Please sign in to continue');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to DSP Foundry!</h2>
              <p className="text-gray-600">
                Your account has been created for <strong>{formData.email}</strong>.
              </p>
              <p className="text-sm text-gray-500">
                You can now sign in and complete your profile to access exclusive DSP resources and tools.
              </p>
              <div className="pt-4">
                <Link to="/auth?portal=true">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-purple-100 p-3 rounded-full">
              <User className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Join the DSP Foundry Portal</CardTitle>
          <CardDescription>
            Create your account to access exclusive DSP resources and tools
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className="pl-10"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className="pl-10"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  className="pl-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/auth?portal=true" className="text-purple-600 hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}