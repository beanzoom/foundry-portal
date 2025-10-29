import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content - No separate header, pages control their own hero */}
      <main className="flex-1">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} FleetDRMS. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Building the future of DSP operations through revolutionary collaboration
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
