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
        const { data: profile } = await refetch();

        console.log('User Provider User profile:', profile.playerProfile);
        if (!profile?.playerProfile) {
          // no profile row yet
          router.replace('/(main)/onboarding/(profile-onboarding)/name');
          return;
        }

        const step = profile.playerProfile.onboarding;

        if (step === 0) {
          router.replace('/(main)/onboarding/(profile-onboarding)/name');
        } else if (step === 1) {
          router.replace('/(main)/onboarding/(entity-onboarding)/admin-or-player');
        } else if (step === 2) {
          router.replace('/(main)/onboarding/(entity-onboarding)/create-or-join-team');
        } else {
          router.replace('/(main)');
        }
      } else if (event === 'SIGNED_OUT') {
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
