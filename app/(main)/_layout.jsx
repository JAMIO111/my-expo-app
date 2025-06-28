import { StyleSheet, Text, View } from 'react-native';
import '../../global.css'; // Ensure global styles are imported
import { Slot } from 'expo-router';
import NavBar from '../../components/NavBar';
import { UserProvider } from 'contexts/UserProvider';

const _layout = () => {
  return (
    <UserProvider>
      <View className="bg-brand flex-1">
        <View className="flex-1 bg-white">
          <Slot />
          <NavBar />
        </View>
      </View>
    </UserProvider>
  );
};

export default _layout;

const styles = StyleSheet.create({});
