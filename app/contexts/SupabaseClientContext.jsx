import { createContext, useContext, useState } from 'react';
import { createSupabaseClient } from '@lib/supabaseClient';

const SupabaseClientContext = createContext(null);

export const SupabaseClientProvider = ({ children }) => {
  const [client, setClient] = useState(createSupabaseClient());

  const refreshClient = () => {
    setClient(createSupabaseClient());
  };

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
