import { StyleSheet, Text, View } from 'react-native';
import PremiumPaywall from '@components/PremiumPaywall';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const index = () => {
  return (
    <SafeViewWrapper bottomColor="bg-brand-dark" topColor="bg-brand-dark">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                backgroundColor="bg-brand-dark"
                title=""
                rightIcon="clipboard-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1">
        <PremiumPaywall />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
