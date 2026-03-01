import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '@components/LoadingScreen';

export default function LoginLayout() {
  const { user, loading, roles, setCurrentRole } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (roles.length === 1) {
        console.log('Auto-selecting role:', roles[0]);
        setCurrentRole(roles[0]);
        router.replace('/(main)/home');
      } else if (roles.length > 1) {
        console.log('Multiple roles found:', roles);
        router.replace('/role-select');
      } else {
        console.warn('User has no assigned roles');
      }
    }
  }, [user, roles, loading]);

  if (loading) {
    console.log('Loading auth state...');
    return <LoadingScreen />; // or splash screen
  }

  return <Slot />; // login page
}
