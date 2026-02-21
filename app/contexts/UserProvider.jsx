import { createContext, useContext, useState, useEffect } from 'react';
import RNIap, {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'react-native-iap';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { data, isLoading, isError, refetch } = useAuthUserProfile();
  const [currentRole, setCurrentRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;

      if (!url) return;

      // This is the missing step that triggers SIGNED_IN
      const { error } = await supabase.auth.exchangeCodeForSession(url);

      if (error) {
        console.log('OAuth exchange error:', error);
      }
    };

    // app already opened via link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // app opened while running
    const sub = Linking.addEventListener('url', handleDeepLink);

    return () => sub.remove();
  }, []);

  useEffect(() => {
    let purchaseUpdateListener;
    let purchaseErrorListener;

    const initIAP = async () => {
      await initConnection();

      purchaseUpdateListener = purchaseUpdatedListener(async (purchase) => {
        try {
          console.log('Purchase update', purchase);

          // optional: send receipt to server for validation
          await finishTransaction(purchase, false); // false for subscriptions
        } catch (err) {
          console.warn(err);
        }
      });

      purchaseErrorListener = purchaseErrorListener((error) => {
        console.warn('Purchase error', error);
      });
    };

    initIAP();

    return () => {
      purchaseUpdateListener?.remove();
      purchaseErrorListener?.remove();
    };
  }, []);

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
