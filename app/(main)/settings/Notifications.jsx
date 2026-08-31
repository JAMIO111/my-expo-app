import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const Notifications = () => {
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Notifications" />
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
              <SwitchSettingsItem
                title="Match Reminders"
                defaultValue={true}
                setValue={() => {}}
                icon="alarmClockCheck"
              />
              <SwitchSettingsItem
                title="Results"
                defaultValue={true}
                setValue={() => {}}
                icon="clipboardClock"
              />
              <SwitchSettingsItem
                title="Join Requests"
                defaultValue={true}
                setValue={() => {}}
                icon="userRoundPlus"
              />
              <SwitchSettingsItem
                title="News and Updates"
                defaultValue={true}
                setValue={() => {}}
                icon="messagesSquare"
                lastItem={true}
              />
            </MenuContainer>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Notifications;

const styles = StyleSheet.create({});
