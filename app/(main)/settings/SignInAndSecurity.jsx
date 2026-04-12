import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import FloatingBottomSheet from '@components/FloatingBottomSheet';

const SignInAndSecurity = () => {
  const { user, player, loading } = useUser();
  const [deleteAccountModal, SetDeleteAccountModal] = useState(false);
  console.log('User data in SignInAndSecurity:', user);

  const provider = user?.raw_app_meta_data?.provider || 'Unknown';
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <View className="h-16 flex-row items-center justify-center bg-brand">
                <Text className="font-michroma text-2xl font-bold text-white">
                  Sign-In & Security
                </Text>
              </View>
            </SafeViewWrapper>
          ),
        }}
      />
      <>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          className="mt-16 flex-1 bg-bg-grouped-1 p-5">
          <MenuContainer>
            <SettingsItem disabled title="Auth Provider" text={provider} />
            <SettingsItem disabled title="Email" text={user.email} />
            <SettingsItem disabled title="Auth ID" text={user.id} />
            <SettingsItem disabled lastItem title="Player ID" text={player.id} />
          </MenuContainer>
          <MenuContainer>
            <SettingsItem disabled lastItem title="Email" text={user.email} />
          </MenuContainer>
          <View className="mb-8 w-full">
            <CTAButton
              text="Change Password"
              type="yellow"
              onPress={() => console.log('Change Password pressed')}
            />
          </View>

          <View className="w-full">
            <CTAButton
              text="Delete Account"
              type="error"
              callbackFn={() => SetDeleteAccountModal(true)}
            />
          </View>
        </ScrollView>
        <FloatingBottomSheet
          visible={deleteAccountModal}
          title={'Are you sure you want to delete your account?'}
          message={
            'You will lose access to you account and all of your stats and history will be deleted.'
          }
          topButtonText={'Cancel'}
          bottomButtonText={'Delete Account'}
          topButtonType={'default'}
          bottomButtonType={'error'}
          topButtonFn={() => SetDeleteAccountModal(false)}
          bottomButtonFn={() =>
            supabase.rpc('delete_user_data').then(() => {
              supabase.auth.signOut();
            })
          }
          onCancel={() => SetDeleteAccountModal(false)}
        />
      </>
    </SafeViewWrapper>
  );
};

export default SignInAndSecurity;

const styles = StyleSheet.create({});
