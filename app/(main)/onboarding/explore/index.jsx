import { Text, View, ScrollView } from 'react-native';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';

const Home = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <ScrollView
        className="flex-1 bg-brand"
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-white">Welcome to the Home Screen</Text>
      </ScrollView>
      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default Home;
