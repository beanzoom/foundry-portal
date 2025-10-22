import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { configureLogger } from './lib/logging.ts';
import { ErrorBoundary } from './components/ErrorBoundary';

// Add global error handler to catch startup errors
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  document.body.innerHTML = `<div style="padding: 20px; font-family: monospace;">
    <h1>Error loading application</h1>
    <pre>${e.error?.message || e.message}</pre>
    <pre>${e.error?.stack || ''}</pre>
  </div>`;
});

console.log('Portal app starting...');
console.log('Environment:', import.meta.env.MODE);
console.log('Supabase URL configured:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('Hostname:', window.location.hostname);
console.log('Pathname:', window.location.pathname);

// Temporary test: add visible text to body to verify JS is executing
const testDiv = document.createElement('div');
testDiv.style.cssText = 'position: fixed; top: 0; left: 0; background: red; color: white; padding: 20px; z-index: 9999;';
testDiv.textContent = `JS LOADED - Hostname: ${window.location.hostname}, Path: ${window.location.pathname}`;
document.body.appendChild(testDiv);

// Configure the logger
configureLogger({
  enabled: import.meta.env.MODE === 'development',
  level: 'debug',
  groupCollapsed: false
});

// Create a client with better caching and retry configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 60 minutes
      retry: 1,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchInterval: false,
      retryDelay: 1000,
      refetchIntervalInBackground: false,
      networkMode: 'online'
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
