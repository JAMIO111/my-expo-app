import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const ExistingOrNewAddress = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Existing or New Venue" />
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
                routerPath="/settings/Addresses"
                routerParams={{ mode: 'link', role: 'player' }}
                title="Link Existing Venue"
                icon="mapPinHouse"
              />
              <SettingsItem
                routerPath="/settings/ManageAddress"
                routerParams={{ mode: 'add', role: 'player' }}
                title="Create New Venue"
                icon="housePlus"
              />
            </MenuContainer>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default ExistingOrNewAddress;

const styles = StyleSheet.create({});
