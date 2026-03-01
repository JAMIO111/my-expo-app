import { Stack } from 'expo-router';
import { View } from 'react-native';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import CompareTeamStats from '@components/CompareTeamStats';

const CompareStats = () => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="mt-16 flex-1">
        <CompareTeamStats />
      </View>
    </>
  );
};

export default CompareStats;
