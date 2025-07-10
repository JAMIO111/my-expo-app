import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot, usePathname } from 'expo-router';
import { UserProvider } from '@contexts/UserProvider';

const _layout = () => {
  const pathname = usePathname();
  const allowedPaths = ['/home', '/teams', '/results', 'fixtures', '/settings'];
  const normalizedPath =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  const showNavBar = allowedPaths.includes(normalizedPath);

  return (
    <UserProvider>
      <View className={`flex-1`}>
        <Slot />
      </View>
    </UserProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
