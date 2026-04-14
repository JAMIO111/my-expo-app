import { useRouter, Slot } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';

export default function LoginLayout() {
  const { user, loading, roles, setCurrentRole } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth state to load{
    if (user) {
      console.log('User is authenticated, redirecting to (main)');
      router.replace('/(main)');
    }
  }, [user, loading]);

  if (loading) {
    console.log('Loading auth state...');
    return <LoadingScreen />; // or splash screen
  }

  return <Slot />; // login page
}
