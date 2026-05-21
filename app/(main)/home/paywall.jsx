import React from 'react';
import BasicPaywall from '@components/BasicPaywall';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

const Paywall = () => {
  return (
    <>
      <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useTopInset={true} useBottomInset={false}>
                <CustomHeader title="Upgrade" showBack={true} />
              </SafeViewWrapper>
            ),
          }}
        />
        <View className="mt-16 flex-1">
          <BasicPaywall />
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default Paywall;
