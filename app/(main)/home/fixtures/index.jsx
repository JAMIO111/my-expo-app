import FixtureList from '@components/FixturesList';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { Stack } from 'expo-router';
import { View } from 'react-native';

const Fixtures = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Fixtures" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-brand-dark">
        <FixtureList />
      </View>
    </SafeViewWrapper>
  );
};

export default Fixtures;
