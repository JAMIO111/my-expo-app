import { StyleSheet, Text, View, ScrollView, Pressable, useColorScheme, Alert } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import ImageUploader from '@components/ImageUploader';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetView, BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors';
import TeamLogo from '@components/TeamLogo';

const Account = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, player, roles, currentRole, setCurrentRole, isLoading } = useUser();
  const [tempRole, setTempRole] = useState(null);
  const router = useRouter();
  const [imageUri, setImageUri] = useState(player?.avatar_url || null);
  const uploaderRef = useRef();
  const bottomSheetRef = useRef(null);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined

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

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleSaveProfile = async (selectedUri) => {
    const previousImage = imageUri; // remember current
    setImageUri(selectedUri); // optimistically update UI

    if (!user) {
      setImageUri(previousImage); // revert
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const folderPath = `${user.id}/`;

    try {
      // Delete old files
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('avatars')
        .list(folderPath, { limit: 100 });

      if (listError) throw new Error(`Failed to list old avatars: ${listError.message}`);

      if (existingFiles?.length) {
        const filePaths = existingFiles.map((f) => `${folderPath}${f.name}`);
        const { error: deleteError } = await supabase.storage.from('avatars').remove(filePaths);
        if (deleteError) throw new Error(`Failed to delete old avatars: ${deleteError.message}`);
      }

      // Upload new image
      const avatarUrl = await uploadToSupabase(selectedUri, folderPath, 'avatars');
      if (!avatarUrl) throw new Error('Upload returned no URL');

      // Save to DB
      const { error } = await supabase
        .from('Players')
        .update({ avatar_url: avatarUrl })
        .eq('auth_id', user.id);

      if (error) throw new Error(error.message);

      Toast.show({
        type: 'success',
        text1: 'Avatar Updated',
        text2: 'Your avatar has been successfully updated.',
        props: { colorScheme },
      });
    } catch (err) {
      setImageUri(previousImage); // revert UI
      Alert.alert('Error', err.message || 'Failed to update avatar');
      throw err; // rethrow for logging
    }
  };

  const openSwitchRoleBottomSheet = () => {
    setTempRole(null);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const handleSwitchRole = (role) => {
    if (!role) {
      Alert.alert('Error', 'No role selected');
      return;
    }
    setCurrentRole(role);
    router.replace('/(main)/home');
    Toast.show({
      type: 'success',
      text1: 'Role Switched',
      text2: `Your are now logged in as a${role.type === 'admin' ? 'n' : ''} ${role.type} for ${role.type === 'admin' ? role.district.name : role.team.display_name}.`,
      props: { colorScheme },
    });
  };

  console.log('Player roles:', player?.roles);

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
              <View className="relative mb-5 overflow-hidden rounded-2xl border-2 border-text-1">
                <ImageUploader
                  ref={uploaderRef}
                  initialUri={imageUri || player?.avatar_url}
                  onImageChange={async (newUri, revert) => {
                    try {
                      await handleSaveProfile(newUri); // upload to Supabase
                    } catch (error) {
                      revert(); // restore old image if upload fails
                      Alert.alert('Upload Failed', error.message);
                    }
                  }}
                  aspectRatio={[1, 1]}
                  borderRadius={12}
                  editable={true}
                  size={160}
                />
              </View>
              <Pressable onPress={() => uploaderRef.current?.openPicker()}>
                <Text className="rounded-lg border border-brand-light bg-brand px-8 py-1 font-saira-semibold text-lg text-white">
                  Change Avatar
                </Text>
              </Pressable>
              <View className="mt-8 items-center gap-2">
                <Text
                  style={{ lineHeight: 40 }}
                  className="font-saira-semibold text-4xl text-text-1">
                  {player?.first_name} {player?.surname}
                </Text>
                <Text className="font-saira-medium text-3xl text-text-2">{player?.nickname}</Text>
              </View>
            </View>

            <MenuContainer>
              <SettingsItem
                routerPath="/settings/PersonalDetails"
                iconBGColor="gray"
                title="Personal Information"
                icon="id-card-outline"
              />
              <SettingsItem
                routerPath="/settings/SignInAndSecurity"
                iconBGColor="gray"
                title="Sign-In & Security"
                icon="key-outline"
              />
              <Pressable className="w-full" onPress={() => console.log('Switch Role')}>
                <SettingsItem
                  callbackFn={openSwitchRoleBottomSheet}
                  iconBGColor="gray"
                  title="Switch Role"
                  icon="shield-checkmark-outline"
                  lastItem
                />
              </Pressable>
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
      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['20%']}
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 80 }}
              className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
              <CTAButton
                text="Switch Role"
                type="brand"
                callbackFn={() => handleSwitchRole(tempRole)}
              />
            </View>
          </BottomSheetFooter>
        )}>
        {/* Fixed Header */}
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
            Select Role
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 200, paddingTop: 80, paddingHorizontal: 32 }}>
          {/* Your selectable items */}
          {roles
            ?.filter((r) => r.id !== currentRole?.id)
            .map((r, index) => (
              <Pressable
                className="mb-5 flex-row items-center justify-between"
                key={index}
                onPress={() => setTempRole(r)}>
                <View className="flex-row items-center gap-5">
                  {r.type === 'admin' ? (
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={40}
                      color={themeColors.primaryText}
                    />
                  ) : (
                    <TeamLogo
                      thickness={r.team?.crest?.thickness}
                      type={r.team?.crest?.type}
                      color1={r.team?.crest?.color1}
                      color2={r.team?.crest?.color2}
                      size={40}
                    />
                  )}
                  <View>
                    <Text
                      className={`font-saira text-2xl ${
                        tempRole?.id === r.id ? 'text-text-2' : 'text-text-2'
                      }`}>
                      {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                    </Text>
                    <Text className="font-saira text-2xl text-text-1">
                      {r.type === 'admin' ? r.district.name : r.team.display_name}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  size={32}
                  color={themeColors.primaryText}
                  name={tempRole?.id === r.id ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </SafeViewWrapper>
  );
};

export default Account;

const styles = StyleSheet.create({});
