import { isDevelopmentEnvironment } from '@/utils/security/passwordGenerator';

export function useDevSession() {
  const getDevSession = () => {
    // Only allow dev sessions in development environment
    if (!isDevelopmentEnvironment()) {
      return null;
    }
    
    try {
      const devSession = localStorage.getItem('dev_session');
      if (!devSession) return null;
      
      const session = JSON.parse(devSession);
      
      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        localStorage.removeItem('dev_session');
        return null;
      }
      
      return session;
    } catch {
      return null;
    }
  };

  const clearDevSession = () => {
    localStorage.removeItem('dev_session');
  };

  const isDevAuthenticated = () => {
    return getDevSession() !== null;
  };

  return {
    getDevSession,
    clearDevSession,
    isDevAuthenticated,
  };
}