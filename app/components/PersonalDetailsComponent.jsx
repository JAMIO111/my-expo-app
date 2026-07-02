import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
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

const PersonalDetailsComponent = () => {
  const queryClient = useQueryClient();
  const { player, loading: playerLoading, refetch } = useUser(); // Assume refreshUser reloads user data
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
      gender.trim() !== '';

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

    const dobStr = dob.toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('update_player_profile', {
      p_player_id: player.id,
      p_first_name: firstName !== player.first_name ? firstName : null,
      p_surname: surname !== player.surname ? surname : null,
      p_nickname: nickname !== player.nickname ? nickname : null,
      p_dob: dobStr !== player.dob ? dobStr : null,
      p_gender: gender !== player.gender ? gender : null,
    });

    if (error || !data?.success) {
      console.error('Failed to save changes:', error?.message || data?.error, data?.detail);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Something went wrong while updating your profile.',
        props: { colorScheme },
      });
    } else {
      await queryClient.invalidateQueries({ queryKey: ['PlayerProfile', player.id] });
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your personal details have been successfully updated.',
        props: { colorScheme },
      });
    }

    setIsSaving(false);
  };

  <View className="h-16 flex-row items-center justify-between bg-brand px-4">
    <Text className="font-michroma text-2xl font-bold text-white">Personal Details</Text>
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
                title="Personal Details"
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
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

        <View className="mb-8 w-full rounded-2xl bg-bg-grouped-2 shadow-sm">
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
            <View className="gap-2 px-4 pb-2">
              <Pressable
                className="flex-row items-center justify-between gap-4 border-t border-theme-gray-3 pt-4"
                onPress={() => {
                  setGender('male');
                  setShowGenderPicker(false);
                }}>
                <Text className="text-lg text-text-1">Male</Text>
                <Ionicons name="male" size={22} color="blue" />
              </Pressable>
              <Pressable
                className="mt-2 flex-row items-center justify-between gap-4 border-t border-theme-gray-3 pt-4"
                onPress={() => {
                  setGender('female');
                  setShowGenderPicker(false);
                }}>
                <Text className="text-lg text-text-1">Female</Text>
                <Ionicons name="female" size={22} color="red" />
              </Pressable>
              <Pressable
                className="mt-2 flex-row items-center justify-between gap-4 border-t border-theme-gray-3 py-4"
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

        <View className="w-full rounded-2xl bg-bg-grouped-2 shadow-sm">
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
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PersonalDetailsComponent;
