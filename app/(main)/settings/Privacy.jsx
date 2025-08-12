import { StyleSheet, View, ScrollView, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';

const Privacy = () => {
  const { client: supabase } = useSupabaseClient();
  const colorScheme = useColorScheme();
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const { player, currentRole, isLoading } = useUser();
  const router = useRouter();
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Privacy" />
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
                routerPath="settings/PersonalPrivacy"
                iconBGColor="green"
                title="Personal Info"
                icon="person-outline"
              />
              <SettingsItem
                routerPath="settings/PlayerManagement"
                iconBGColor="blue"
                title="Visibility"
                icon="search-outline"
              />
              <SettingsItem
                routerPath="settings/ActivityPrivacy"
                iconBGColor="red"
                title="Activity"
                icon="pulse-outline"
                lastItem={true}
              />
            </MenuContainer>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Privacy;

const styles = StyleSheet.create({});
