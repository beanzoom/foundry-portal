import { Toaster } from "@/components/ui/toaster"
import { PortalProvider } from './contexts/PortalContext'
import { PortalRoutes } from './pages/portal/PortalRoutes'

function App() {
  return (
    <PortalProvider>
      <Toaster />
      <PortalRoutes />
    </PortalProvider>
  );
}

export default App;
