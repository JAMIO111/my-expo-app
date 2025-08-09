import { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseClient } from '@lib/supabaseClient';

const SupabaseClientContext = createContext(null);

export const SupabaseClientProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = await createSupabaseClient();

      // Wait for the session to restore from storage
      // You can listen to auth state change event to detect when done
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setClient(supabase);
      setSessionRestored(true);

      // Optional: Listen for future auth state changes to update session status
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSessionRestored(true);
        }
        if (event === 'SIGNED_OUT') {
          setSessionRestored(false);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    })();
  }, []);

  const refreshClient = async () => {
    setSessionRestored(false);
    const newClient = await createSupabaseClient();
    setClient(newClient);
    setSessionRestored(true);
  };

  if (!client) return null; // or loading spinner
  if (!sessionRestored) return null; // or loading spinner while session restores

  return (
    <SupabaseClientContext.Provider value={{ client, refreshClient, sessionRestored }}>
      {children}
    </SupabaseClientContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const context = useContext(SupabaseClientContext);
  if (!context) throw new Error('useSupabaseClient must be used within SupabaseClientProvider');
  return context;
};
