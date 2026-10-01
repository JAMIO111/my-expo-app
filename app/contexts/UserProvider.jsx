import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuthUserProfile } from '@hooks/useAuthUserProfile2';
import Purchases from 'react-native-purchases'; // ✅ added
import { syncPushToken } from '@/lib/pushNotifications';
import Toast from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [currentRole, setCurrentRole] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [session, setSession] = useState(null);

  // Single source of truth for the Supabase session — passed straight into
  // the query instead of having it subscribe to its own auth listener too.
  const { data, isLoading, isFetching, isError, refetch } = useAuthUserProfile(
    session,
    loadingAuth
  );

  const hasUser = !!session?.user;

  // ----------------------
  // Handle OAuth redirect
  // ----------------------
  const handleAuthRedirect = async (url) => {
    if (!url) return;

    console.log('[AUTH] Raw redirect:', url);

    const fragment = url.split('#')[1];
    if (!fragment) {
      console.log('[AUTH] No fragment found');
      return;
    }

    // Split each pair on the *first* '=' only -- fragment.split('=') would
    // truncate a token value that itself contains an '=' (e.g. base64
    // padding), since Object.fromEntries only keeps the first two pieces.
    // safeDecode falls back to the raw value instead of throwing on a
    // malformed sequence, since these tokens aren't expected to need
    // decoding in practice -- better to keep working than to start throwing
    // here when the previous version never decoded at all.
    const safeDecode = (value) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };
    const params = Object.fromEntries(
      fragment.split('&').map((part) => {
        const eq = part.indexOf('=');
        if (eq === -1) return [safeDecode(part), ''];
        return [safeDecode(part.slice(0, eq)), safeDecode(part.slice(eq + 1))];
      })
    );

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
        // ✅ Identify user in RC on any sign in or session restore.
        // Guard with isAnonymous so we don't call logIn redundantly if
        // the login/signup pages already did it directly.
        try {
          const isAnonymous = await Purchases.isAnonymous();
          if (isAnonymous) {
            await Purchases.logIn(session.user.id);
          }
        } catch (err) {
          console.error('[RC] logIn error:', err);
        }

        refetch();
      } else {
        // ✅ Sign out of RC when Supabase session ends (sign out, token expiry, etc.)
        try {
          const isAnonymous = await Purchases.isAnonymous();
          if (!isAnonymous) {
            await Purchases.logOut();
          }
        } catch (err) {
          console.error('[RC] logOut error:', err);
        }

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

  useEffect(() => {
    if (!data?.playerProfile) return;
    syncPushToken(data?.playerProfile?.id);
  }, [data?.playerProfile?.id]);

  // 1️⃣ Auto-select if only one role on first load
  useEffect(() => {
    if (!currentRole && data?.roles?.length === 1) {
      setCurrentRole(data.roles[0]);
    }
  }, [data?.roles, currentRole]);

  // 2️⃣ Update currentRole if the role object changed or disappeared
  useEffect(() => {
    if (!currentRole || !data?.roles) return;

    const updatedRole = data.roles.find((r) => r.id === currentRole?.id);

    if (updatedRole) {
      if (updatedRole !== currentRole) {
        setCurrentRole(updatedRole);
      }
    } else {
      setCurrentRole(data.roles[0] || null);
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

      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      console.log('[AUTH] Browser result:', result);

      if (result.type === 'success') {
        await handleAuthRedirect(result.url);
      }
    } catch (err) {
      console.error('[AUTH] OAuth failed:', err);
      Toast.show({
        type: 'error',
        text1: `Couldn't sign in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        text2: err.message,
      });
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
        fetching: isFetching,
        isError,
        refetch,
        signInWithProvider,
      }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default useUser;
