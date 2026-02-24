import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import RNIap, {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'react-native-iap';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';

WebBrowser.maybeCompleteAuthSession();

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const { data, isLoading, isError, refetch } = useAuthUserProfile();

  const [currentRole, setCurrentRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [session, setSession] = useState(null);

  const hasUser = !!session?.user;

  // ----------------------
  // Handle OAuth redirect
  // ----------------------
  const handleAuthRedirect = async (url) => {
    if (!url) return;

    console.log('[AUTH] Raw redirect:', url);

    // Extract fragment after #
    const fragment = url.split('#')[1];
    if (!fragment) {
      console.log('[AUTH] No fragment found');
      return;
    }

    const params = Object.fromEntries(fragment.split('&').map((part) => part.split('=')));

    console.log('[AUTH] Parsed fragment:', params);

    if (!params.access_token) {
      console.log('[AUTH] No access token inside fragment');
      return;
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    console.log('[AUTH] setSession result:', data, error);
  };

  // ----------------------
  // Auth state listener
  // ----------------------
  useEffect(() => {
    console.log('[AUTH] Subscribing to auth state');

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AUTH LISTENER] Event:', event);
      console.log('[AUTH LISTENER] User:', session?.user?.email);

      setSession(session);
      setLoadingAuth(false);

      if (session?.user) {
        await refetch();
      } else {
        setCurrentRole(null);
      }
    });

    // initial session restore
    supabase.auth.getSession().then(({ data }) => {
      console.log('[AUTH INIT] Existing session:', data.session?.user?.email);
      setSession(data.session);
      setLoadingAuth(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ----------------------
  // IAP
  // ----------------------
  useEffect(() => {
    let purchaseUpdateListenerRef;
    let purchaseErrorListenerRef;

    const initIAP = async () => {
      await initConnection();

      purchaseUpdateListenerRef = purchaseUpdatedListener(async (purchase) => {
        try {
          console.log('Purchase update', purchase);
          await finishTransaction(purchase, false);
        } catch (err) {
          console.warn(err);
        }
      });

      purchaseErrorListenerRef = purchaseErrorListener((error) => {
        console.warn('Purchase error', error);
      });
    };

    initIAP();

    return () => {
      purchaseUpdateListenerRef?.remove();
      purchaseErrorListenerRef?.remove();
    };
  }, []);

  // ----------------------
  // Auto select role
  // ----------------------
  useEffect(() => {
    if (data?.roles?.length === 1 && !currentRole) {
      setCurrentRole(data.roles[0]);
    }
  }, [data?.roles, currentRole]);

  // ----------------------
  // OAuth login
  // ----------------------
  const signInWithProvider = async (provider) => {
    try {
      const redirectUri = Linking.createURL('auth');

      console.log('[AUTH] Starting OAuth:', provider);
      console.log('[AUTH] Redirect URI:', redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.log('[AUTH] OAuth error:', error);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      console.log('[AUTH] Browser result:', result);

      if (result.type === 'success') {
        await handleAuthRedirect(result.url);
      }
    } catch (err) {
      console.error('[AUTH] OAuth crash:', err);
    }
  };

  return (
    <UserContext.Provider
      value={{
        session,
        user: session?.user || null,
        player: data?.playerProfile || null,
        roles: data?.roles || [],
        currentRole,
        setCurrentRole,
        loading: loadingAuth || (hasUser && isLoading),
        isError,
        refetch,
        signInWithProvider,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
