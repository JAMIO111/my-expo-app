import { StyleSheet, View, ScrollView, useColorScheme, Text } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const Boring = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Boring (Legal) Stuff" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View className="flex-1 justify-between">
          {/* Top Content */}
          <View>
            <MenuContainer>
              <SettingsItem
                link="https://www.break-room.uk/privacy"
                iconBGColor="grey"
                title="Privacy Policy"
                icon="link"
              />
              <SettingsItem
                link="https://www.break-room.uk/terms"
                iconBGColor="grey"
                title="Terms of Service"
                icon="link"
              />
              <SettingsItem
                link="https://www.break-room.uk/delete-account"
                iconBGColor="grey"
                title="How to Delete Account"
                icon="link"
                lastItem={true}
              />
            </MenuContainer>
            <View className="items-center justify-center">
              <Text className="font-saira text-lg text-text-2">App Version: 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Boring;
