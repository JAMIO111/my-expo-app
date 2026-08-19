import {
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import EditableSettingsItem from '@components/EditableSettingsItem';
import { supabase } from '@/lib/supabase';
import IonIcons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors'; // Adjust the import path as necessary
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import ImageUploader from '@components/ImageUploader';
import useCompressAndUploadImage from '@hooks/useCompressAndUploadImage';

const PersonalDetailsComponent = () => {
  const queryClient = useQueryClient();
  const uploaderRef = useRef();
  const { player, loading: playerLoading, refetch, user } = useUser(); // Assume refreshUser reloads user data
  const [imageUri, setImageUri] = useState(player?.avatar_url || null);
  const [firstName, setFirstName] = useState(player?.first_name || '');
  const [surname, setSurname] = useState(player?.surname || '');
  const [nickname, setNickname] = useState(player?.nickname || '');
  const [dob, setDob] = useState(player?.dob ? new Date(player.dob) : new Date());
  const [gender, setGender] = useState(player?.gender || '');
  const [showDatePicker, setShowDatePicker] = useState(false); // inline for iOS
  const [showGenderPicker, setShowGenderPicker] = useState(false); // inline for iOS
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light; // Adjust based on your theme

  const { uploadToSupabase, uploading } = useCompressAndUploadImage();

  const handleSaveProfile = async (selectedUri) => {
    const previousImage = imageUri;

    setImageUri(selectedUri || null);

    if (!user) {
      setImageUri(previousImage);
      throw new Error('User not authenticated');
    }

    const folderPath = `${user.id}/`;

    try {
      // =========================
      // REMOVE AVATAR
      // =========================
      if (!selectedUri) {
        const { error: dbError } = await supabase
          .from('Players')
          .update({ avatar_url: null })
          .eq('auth_id', user.id);

        if (dbError) {
          throw dbError;
        }

        const { data: existingFiles, error: listError } = await supabase.storage
          .from('avatars')
          .list(folderPath, { limit: 100 });

        if (listError) {
          throw listError;
        }

        if (existingFiles?.length) {
          const filePaths = existingFiles.map((file) => `${folderPath}${file.name}`);

          const { error: deleteError } = await supabase.storage.from('avatars').remove(filePaths);

          if (deleteError) {
            throw deleteError;
          }
        }

        Toast.show({
          type: 'success',
          text1: 'Avatar Removed',
          text2: 'Your avatar has been removed.',
          props: { colorScheme },
        });

        return;
      }

      // =========================
      // UPLOAD NEW AVATAR
      // =========================

      const avatarUrl = await uploadToSupabase(selectedUri, folderPath, 'avatars');

      if (!avatarUrl) {
        throw new Error('Upload returned no URL');
      }

      const { error: dbError } = await supabase
        .from('Players')
        .update({ avatar_url: avatarUrl })
        .eq('auth_id', user.id);

      if (dbError) {
        throw dbError;
      }

      // Delete old files AFTER successful upload + DB update
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(folderPath, { limit: 100 });

      if (existingFiles?.length) {
        const newFileName = avatarUrl.split('/').pop();

        const oldFiles = existingFiles
          .filter((file) => file.name !== newFileName)
          .map((file) => `${folderPath}${file.name}`);

        if (oldFiles.length) {
          await supabase.storage.from('avatars').remove(oldFiles);
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Avatar Updated',
        text2: 'Your avatar has been successfully updated.',
        props: { colorScheme },
      });
    } catch (error) {
      setImageUri(previousImage);
      throw error;
    }
  };

  console.log('PersonalDetails:', player);

  // ✅ Detect changes
  useEffect(() => {
    if (player) {
      setFirstName(player.first_name || '');
      setSurname(player.surname || '');
      setNickname(player.nickname || '');
      setDob(player.dob ? new Date(player.dob) : new Date());
      setGender(player.gender || '');
    }
  }, [player]);

  useEffect(() => {
    if (!player) {
      setHasChanges(false);
      return;
    }

    const requiredFieldsFilled =
      firstName.trim() !== '' &&
      surname.trim() !== '' &&
      nickname.trim() !== '' &&
      dob instanceof Date &&
      !isNaN(dob) &&
      gender !== '';

    const dobStr = dob.toISOString().split('T')[0] || '';
    const playerDobStr = player.dob || '';

    const changed =
      firstName !== player.first_name ||
      surname !== player.surname ||
      nickname !== player.nickname ||
      dobStr !== playerDobStr ||
      gender !== player.gender;

    setHasChanges(requiredFieldsFilled && changed);
  }, [firstName, surname, nickname, dob, gender, player]);

  const handleSave = async () => {
    if (!hasChanges || isSaving || !player) return;

    setIsSaving(true);

    try {
      const dobStr = dob.toISOString().split('T')[0];

      const { data, error } = await supabase.rpc('update_player_profile', {
        p_player_id: player.id,
        p_first_name: firstName !== player.first_name ? firstName : null,
        p_surname: surname !== player.surname ? surname : null,
        p_nickname: nickname !== player.nickname ? nickname : null,
        p_dob: dob !== player.dob ? dob : null,
        p_dob_changed: dobStr !== player.dob,
        p_gender: gender,
        p_gender_changed: gender !== player.gender,
      });

      if (error || !data?.success) {
        console.error('Failed to save changes:', error?.message || data?.error, data?.detail);

        const errorMessages = {
          PLAYER_NOT_FOUND: "We couldn't find your player profile.",
          NO_DOB_CHANGES_REMAINING:
            "You've used up your date of birth changes. Please contact your administrator if you need to update it.",
          NO_GENDER_CHANGES_REMAINING:
            "You've used up your gender changes. Please contact your administrator if you need to update it.",
          UNEXPECTED_ERROR: 'Something went wrong while updating your profile.',
        };

        const errorCode = data?.error;

        const message =
          errorMessages[errorCode] ?? 'Something went wrong while updating your profile.';

        Toast.show({
          type: 'error',
          text1: 'Update Failed',
          text2: message,
          props: { colorScheme },
        });

        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ['PlayerProfile', player.id],
      });

      await refetch();

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your personal details have been successfully updated.',
        props: { colorScheme },
      });
    } catch (error) {
      console.error('Unexpected error while saving profile:', error);

      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Something went wrong while updating your profile.',
        props: { colorScheme },
      });
    } finally {
      setIsSaving(false);
      setShowDatePicker(false);
      setShowGenderPicker(false);
    }
  };

  <View className="h-16 flex-row items-center justify-between bg-brand px-4">
    <Text className="font-michroma text-2xl font-bold text-white">Edit Profile</Text>
    <Pressable onPress={handleSave} disabled={!hasChanges || isSaving} hitSlop={10}>
      {isSaving ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Text className={`text-lg font-medium ${hasChanges ? 'text-white' : 'text-text-3'}`}>
          Save
        </Text>
      )}
    </Pressable>
  </View>;

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon="checkmark-outline"
                title="Edit Profile"
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 50,
        }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View className="mb-8 mt-5 items-center">
          <View className="relative mb-5 overflow-hidden rounded-2xl border-2 border-theme-gray-4">
            <ImageUploader
              ref={uploaderRef}
              initialUri={imageUri || player?.avatar_url}
              onImageChange={async (newUri) => {
                try {
                  await handleSaveProfile(newUri);
                  refetch(); // Refresh user data after successful upload
                } catch (error) {
                  Alert.alert('Upload Failed', error.message || 'Failed to update avatar');
                }
              }}
              aspectRatio={[1, 1]}
              borderRadius={12}
              editable={true}
              size={160}
            />
          </View>
          <Pressable onPress={() => uploaderRef.current?.openPicker()}>
            <Text className="rounded-xl border border-brand-light bg-brand px-8 py-2 font-saira text-lg text-white">
              Change Avatar
            </Text>
          </Pressable>
        </View>
        <MenuContainer>
          <EditableSettingsItem
            title="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter your first name"
          />
          <EditableSettingsItem
            title="Surname"
            value={surname}
            onChangeText={setSurname}
            placeholder="Enter your surname"
          />
          <EditableSettingsItem
            title="Nickname"
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter your nickname"
            lastItem={true}
          />
        </MenuContainer>

        <View className="w-full rounded-3xl bg-bg-grouped-2">
          <Pressable
            onPress={() => setShowGenderPicker((prev) => !prev)}
            className="flex-row items-center justify-between px-4 py-4">
            <Text className="text-lg font-medium text-text-1">Gender</Text>
            <View className="flex-1 flex-row items-center justify-end gap-3">
              <Text className="text-xl text-text-2">
                {gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Not Specified'}
              </Text>
              <IonIcons
                name={showGenderPicker ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={themeColors.icon}
              />
            </View>
          </Pressable>

          {showGenderPicker && (
            <View className="">
              <Pressable
                className={`flex-row items-center justify-between gap-4 p-4 ${gender === 'male' ? 'bg-theme-gray-5' : ''}`}
                onPress={() => {
                  setGender('male');
                  setShowGenderPicker(false);
                }}>
                <Text className="text-lg text-text-1">Male</Text>
                <Ionicons name="male" size={22} color="blue" />
              </Pressable>
              <Pressable
                className={`mt-2 flex-row items-center justify-between gap-4 p-4 ${gender === 'female' ? 'bg-theme-gray-5' : ''}`}
                onPress={() => {
                  setGender('female');
                  setShowGenderPicker(false);
                }}>
                <Text className="text-lg text-text-1">Female</Text>
                <Ionicons name="female" size={22} color="red" />
              </Pressable>
              <Pressable
                style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}
                className={`mt-2 flex-row items-center justify-between gap-4 p-4 ${gender === null ? 'bg-theme-gray-5' : ''}`}
                onPress={() => {
                  setGender(null);
                  setShowGenderPicker(false);
                }}>
                <Text className="text-lg text-text-1">Prefer Not to Say</Text>
                <Ionicons name="help-circle" size={22} color="gray" />
              </Pressable>
            </View>
          )}
        </View>
        <View className="mb-8 mt-2 flex-row items-center justify-between px-2">
          <Text className="flex-1 text-left text-xs text-text-2">
            Can only be changed up to 2 times.
          </Text>
          <Text
            className={`text-right text-xs ${player?.gender_changes_remaining <= 1 ? 'text-theme-red' : 'text-text-2'}`}>
            {player?.gender_changes_remaining} / 2 remaining
          </Text>
        </View>

        <View className="w-full rounded-3xl bg-bg-grouped-2">
          <Pressable
            onPress={() => setShowDatePicker((prev) => !prev)}
            className="flex-row items-center justify-between px-4 py-4">
            <Text className="text-lg font-medium text-text-1">Date of Birth</Text>
            <View className="flex-1 flex-row items-center justify-end gap-3">
              <Text className="text-xl text-text-2">{dob.toLocaleDateString('en-GB')}</Text>
              <IonIcons
                name={showDatePicker ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color={themeColors.icon}
              />
            </View>
          </Pressable>

          {showDatePicker && (
            <View className="px-4 pb-2">
              <DateTimePicker
                value={dob}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }

                  if (selectedDate) {
                    setDob(selectedDate);
                    if (Platform.OS === 'ios') {
                      // On iOS inline, close manually on selection
                    }
                  }
                }}
                maximumDate={new Date()}
              />
            </View>
          )}
        </View>
        <View className="mb-8 mt-2 flex-row items-center justify-between px-2">
          <Text className="flex-1 text-left text-xs text-text-2">
            Can only be changed up to 2 times.
          </Text>
          <Text
            className={`text-right text-xs ${player?.dob_changes_remaining <= 1 ? 'text-theme-red' : 'text-text-2'}`}>
            {player?.dob_changes_remaining} / 2 remaining
          </Text>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PersonalDetailsComponent;
