import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot, usePathname } from 'expo-router';
import NavBar from '@components/NavBar';
import { UserProvider } from '@contexts/UserProvider';

const _layout = () => {
  const pathname = usePathname();
  const allowedPaths = ['/home', '/teams', '/results', 'fixtures', '/settings'];
  const normalizedPath =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  const showNavBar = allowedPaths.includes(normalizedPath);

  return (
    <UserProvider>
      <Slot />
    </UserProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
