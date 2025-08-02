import { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseClient } from '@lib/supabaseClient';

const SupabaseClientContext = createContext(null);

export const SupabaseClientProvider = ({ children }) => {
  const [client, setClient] = useState(null);

  // Create client on mount
  useEffect(() => {
    (async () => {
      const supabase = await createSupabaseClient();
      setClient(supabase);
    })();
  }, []);

  const refreshClient = async () => {
    const newClient = await createSupabaseClient();
    setClient(newClient);
  };

  if (!client) return null; // or a loading screen

  return (
    <SupabaseClientContext.Provider value={{ client, refreshClient }}>
      {children}
    </SupabaseClientContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const context = useContext(SupabaseClientContext);
  if (!context) throw new Error('useSupabaseClient must be used within SupabaseClientProvider');
  return context;
};
