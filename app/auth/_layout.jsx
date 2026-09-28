import { useRouter, useSegments, Slot } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '@components/LoadingScreen';

export default function LoginLayout() {
  const { user, loading, roles, setCurrentRole } = useUser();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return; // Wait for auth state to load

    // reset-password.jsx calls setSession() with the recovery link's
    // tokens, which fully authenticates the user (Supabase's recovery
    // session is a real, valid one -- that's what lets updateUser() work
    // there). Without this check, this effect fired the instant that
    // happened and redirected straight into (main) before the user ever
    // saw the new-password form.
    const isResettingPassword = segments.includes('reset-password');

    if (user && !isResettingPassword) {
      console.log('User is authenticated, redirecting to (main)');
      router.replace('/(main)');
    }
  }, [user, loading, segments]);

  if (loading) {
    console.log('Loading auth state...');
    return <LoadingScreen />; // or splash screen
  }

  return <Slot />; // login page
}
