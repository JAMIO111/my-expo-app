import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import { useRouter } from 'expo-router';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAuthUserProfile();
  const [currentRole, setCurrentRole] = useState(null);
  const { client: supabase } = useSupabaseClient();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Ensure latest profile data
        await refetch();

        const isNewUser = session.user.created_at === session.user.last_sign_in_at;

        router.replace(isNewUser ? '/(main)/onboarding/name' : '/(main)');
      }

      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
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
        loading: isLoading,
        isError,
        refetch,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
