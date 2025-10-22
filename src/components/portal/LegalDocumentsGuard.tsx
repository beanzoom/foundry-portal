import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ndaService } from '@/services/nda.service';
import { membershipAgreementService } from '@/services/membership-agreement.service';
import { NDAModal } from '@/components/portal/NDAModal';
import { MembershipAgreementModal } from '@/components/portal/MembershipAgreementModal';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface LegalDocumentsGuardProps {
  children: React.ReactNode;
}

export function LegalDocumentsGuard({ children }: LegalDocumentsGuardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAgreedToNDA, setHasAgreedToNDA] = useState(false);
  const [hasAgreedToMembership, setHasAgreedToMembership] = useState(false);
  const [showNDAModal, setShowNDAModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);

  useEffect(() => {
    const checkLegalDocumentsStatus = async () => {
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
        const ndaAgreed = await ndaService.checkUserAgreement(user.id);
        setHasAgreedToNDA(ndaAgreed);

        // Check Membership Agreement
        const membershipAgreed = await membershipAgreementService.checkUserAgreement(user.id);
        setHasAgreedToMembership(membershipAgreed);

        // Show appropriate modal based on what's missing
        if (!ndaAgreed) {
          setShowNDAModal(true);
        } else if (!membershipAgreed) {
          setShowMembershipModal(true);
        }
      } catch (err) {
        console.error('Error checking legal documents status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkLegalDocumentsStatus();
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
      setHasAgreedToNDA(true);
      setShowNDAModal(false);
      toast({
        title: "NDA Agreement Saved",
        description: "Thank you for agreeing to the NDA. Please review the Membership Agreement.",
      });
      
      // Now show Membership Agreement
      setShowMembershipModal(true);
    } else {
      throw new Error(result.error || 'Failed to save NDA agreement');
    }
  };

  const handleMembershipAgree = async (agreedText: string, typedName: string) => {
    if (!user || !userProfile) return;

    const result = await membershipAgreementService.saveAgreement(
      user.id,
      agreedText,
      typedName,
      `${userProfile.first_name} ${userProfile.last_name}`
    );

    if (result.success) {
      setHasAgreedToMembership(true);
      setShowMembershipModal(false);
      toast({
        title: "Membership Agreement Saved",
        description: "Thank you for agreeing to the Membership Agreement. You can now access the portal.",
      });
    } else {
      throw new Error(result.error || 'Failed to save Membership Agreement');
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

  // Show NDA Modal if needed
  if (showNDAModal && userProfile) {
    return (
      <NDAModal
        open={showNDAModal}
        userFirstName={userProfile.first_name}
        userLastName={userProfile.last_name}
        onAgree={handleNDAAgree}
      />
    );
  }

  // Show Membership Agreement Modal if needed
  if (showMembershipModal && userProfile) {
    return (
      <MembershipAgreementModal
        open={showMembershipModal}
        userFirstName={userProfile.first_name}
        userLastName={userProfile.last_name}
        onAgree={handleMembershipAgree}
      />
    );
  }

  // If either document is not agreed to and modals aren't showing, show error
  if (!hasAgreedToNDA || !hasAgreedToMembership) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Legal Documents Required</h2>
          <p className="text-gray-600">Please refresh the page to view the required legal documents.</p>
        </div>
      </div>
    );
  }

  // Both documents agreed to, allow access
  return <>{children}</>;
}