import { View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot } from 'expo-router';
import { UserProvider } from '@contexts/UserProvider';
import { AdminProvider } from '@contexts/AdminContext';

const _layout = () => {
  return (
    <UserProvider>
      <AdminProvider>
        <View className={`flex-1`}>
          <Slot />
        </View>
      </AdminProvider>
    </UserProvider>
  );
};

export default _layout;
