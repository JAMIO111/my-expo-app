import { StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import BasicPaywall from '@components/BasicPaywall';

const index = () => {
  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand-dark">
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
        <BasicPaywall />
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
