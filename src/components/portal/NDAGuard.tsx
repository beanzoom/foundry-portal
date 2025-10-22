import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ndaService } from '@/services/nda.service';
import { NDAModal } from '@/components/portal/NDAModal';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface NDAGuardProps {
  children: React.ReactNode;
}

export function NDAGuard({ children }: NDAGuardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    const checkNDAStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setLoading(false);
          return;
        }

        setUserProfile({
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || ''
        });

        // Check NDA agreement
        const agreed = await ndaService.checkUserAgreement(user.id);
        setHasAgreed(agreed);

        if (!agreed) {
          setShowModal(true);
        }
      } catch (err) {
        console.error('Error checking NDA status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkNDAStatus();
  }, [user]);

  const handleNDAAgree = async (agreedText: string, typedName: string) => {
    if (!user || !userProfile) return;

    const result = await ndaService.saveAgreement(
      user.id,
      agreedText,
      typedName,
      `${userProfile.first_name} ${userProfile.last_name}`
    );

    if (result.success) {
      setHasAgreed(true);
      setShowModal(false);
      toast({
        title: "NDA Agreement Saved",
        description: "Thank you for agreeing to the NDA. You can now access the portal.",
      });
    } else {
      throw new Error(result.error || 'Failed to save agreement');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth?portal=true" replace />;
  }

  if (showModal && userProfile) {
    return (
      <NDAModal
        open={showModal}
        userFirstName={userProfile.first_name}
        userLastName={userProfile.last_name}
        onAgree={handleNDAAgree}
      />
    );
  }

  if (!hasAgreed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">NDA Agreement Required</h2>
          <p className="text-gray-600">Please refresh the page to view the NDA agreement.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}