import { useState } from 'react';
import { TermsOfUseModal } from '@/components/auth/TermsOfUseModal';

export function PortalFooter() {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="w-full border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
            {/* Copyright - Centered on desktop to avoid sidebar */}
            <div className="flex-1 text-center lg:text-center">
              <span>© {currentYear} FleetDRMS, Inc.</span>
              <span className="hidden sm:inline text-gray-400 mx-1">•</span>
              <span className="hidden sm:inline">All rights reserved</span>
            </div>
            
            {/* Links - Right aligned */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTermsModal(true)}
                className="hover:text-purple-600 transition-colors"
              >
                Terms & Privacy
              </button>
              <span className="text-gray-400">•</span>
              <a 
                href="mailto:support@fleetdrms.com" 
                className="hover:text-purple-600 transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms Modal */}
      <TermsOfUseModal 
        open={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </>
  );
}