import { Stack } from 'expo-router';
import { View } from 'react-native';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import CompareEntityStats from '@components/CompareEntityStats';

const CompareStats = () => {
  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper
              useTopInset={true}
              useBottomInset={false}
              bottomColor="bg-brand"
              topColor="bg-brand">
              <CustomHeader title="Compare Stats" rightIcon="bar-chart-2" />
            </SafeViewWrapper>
          ),
          headerShown: true,
        }}
      />

      <View style={{ marginTop: 115, flex: 1 }}>
        <CompareEntityStats />
      </View>
    </>
  );
};

export default CompareStats;
