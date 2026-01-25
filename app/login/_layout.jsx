import { Slot, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useUser } from '@contexts/UserProvider';
import { View, Text } from 'react-native';
import LoadingSpinner from '../components/LoadingSplash';

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
        router.replace('/login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return <LoadingSpinner />; // or splash screen
  }

  return <Slot />; // login page
}
