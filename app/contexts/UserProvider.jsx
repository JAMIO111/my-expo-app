import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';
import { supabase } from '@/lib/supabase';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { data, isLoading, isError, refetch } = useAuthUserProfile();
  const [currentRole, setCurrentRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoadingAuth(true);

      if (session?.user) {
        await refetch(); // fetch profile & roles
      } else {
        // signed out
        setCurrentRole(null);
      }

      setLoadingAuth(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // Set the default role if there's only one and nothing has been selected yet
  useEffect(() => {
    if (data?.roles?.length === 1 && !currentRole) {
      setCurrentRole(data.roles[0]);
    }
  }, [data?.roles, currentRole]);

  return (
    <UserContext.Provider
      value={{
        user: data?.user || null,
        player: data?.playerProfile || null,
        roles: data?.roles || [],
        currentRole,
        setCurrentRole,
        loading: isLoading || loadingAuth,
        isError,
        refetch,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
