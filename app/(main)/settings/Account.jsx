import { StyleSheet, Text, View, ScrollView, Image, Pressable, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import IonIcons from '@expo/vector-icons/Ionicons';

const Account = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { player, isLoading } = useUser();
  const router = useRouter();

  const initials = player
    ? `${player?.first_name?.charAt(0) ?? ''}${player?.surname?.charAt(0) ?? ''}`
    : '';

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);

    if (error) {
      console.error('Error signing out:', error.message);
      Toast.show({
        type: 'error',
        text1: 'Sign Out Failed',
        text2: error.message,
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Signed Out',
        text2: 'You have successfully signed out.',
      });
      router.replace('/login');
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Account" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View className="flex-1 justify-between">
          {/* Profile section */}
          <View>
            <View className="mb-8 mt-5 items-center">
              <Pressable className="relative" onPress={() => console.log('Profile Pic pressed')}>
                {!isLoading && player?.avatar_url ? (
                  <Image
                    source={{ uri: player.avatar_url }}
                    className="h-40 w-40 rounded-xl border-2 border-brand"
                    style={{ resizeMode: 'cover' }}
                  />
                ) : (
                  <View className="h-40 w-40 items-center justify-center rounded-xl border-2 border-brand bg-brand-light">
                    <Text className="text-5xl font-bold text-white">{initials}</Text>
                  </View>
                )}
                <View className="absolute right-0 top-0 rounded-full bg-white p-1 shadow">
                  <IonIcons name="pencil-outline" size={24} color={'black'} />
                </View>
              </Pressable>
              <View className="items-center gap-2">
                <Text className="mt-4 text-4xl font-bold text-text-1">
                  {player?.first_name} {player?.surname}
                </Text>
                <Text className="text-xl text-text-2">{player?.nickname}</Text>
              </View>
            </View>

            <MenuContainer>
              <SettingsItem
                routerPath="PersonalDetails"
                iconBGColor="gray"
                title="Personal Information"
                icon="id-card-outline"
              />
              <SettingsItem
                routerPath="/settings/SignInAndSecurity"
                iconBGColor="gray"
                title="Sign-In & Security"
                icon="key-outline"
                lastItem
              />
            </MenuContainer>
          </View>

          {/* Sign Out button */}
          <View className="my-10">
            <CTAButton
              type="error"
              text={isSigningOut ? 'Signing Out...' : 'Sign Out'}
              callbackFn={handleSignOut}
              disabled={isSigningOut}
            />
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Account;

const styles = StyleSheet.create({});
