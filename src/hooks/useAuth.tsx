
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logging";

const logger = createLogger('useAuth');

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function getUser() {
      try {
        logger.debug('[useAuth] Fetching user...');
        
        // First try to get the session (more reliable than getUser)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          logger.debug('[useAuth] Error getting session:', sessionError.message);
          throw sessionError;
        }
        
        if (session?.user) {
          logger.debug('[useAuth] Session found, user:', session.user.id, session.user.email);
          setState({
            user: session.user,
            isLoading: false,
            error: null
          });
        } else {
          // No session, try getUser as fallback
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) {
            logger.debug('[useAuth] Error from getUser:', error.message);
            throw error;
          }
          
          logger.debug('[useAuth] User fetched via getUser:', user?.id, user?.email);
          setState({
            user,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        // Check if it's just a missing session (expected when not logged in)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('session missing') || errorMessage.includes('Auth session missing')) {
          logger.debug('[useAuth] No auth session available');
        } else {
          logger.error('[useAuth] Error fetching user:', error);
        }
        setState({
          user: null,
          isLoading: false,
          error: error as Error
        });
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('[useAuth] Auth state changed:', event, session?.user?.id);
      setState({
        user: session?.user ?? null,
        isLoading: false,
        error: null
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
