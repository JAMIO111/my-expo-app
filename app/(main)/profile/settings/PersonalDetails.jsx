import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import EditableSettingsItem from '@components/EditableSettingsItem';
import supabase from '@lib/supabaseClient';
import IonIcons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors'; // Adjust the import path as necessary
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary

const PersonalDetails = () => {
  const queryClient = useQueryClient();
  const { player, loading: playerLoading, refetch } = useUser(); // Assume refreshUser reloads user data
  const [firstName, setFirstName] = useState(player?.first_name || '');
  const [surname, setSurname] = useState(player?.surname || '');
  const [nickname, setNickname] = useState(player?.nickname || '');
  const [dob, setDob] = useState(player?.dob ? new Date(player.dob) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); // inline for iOS
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light; // Adjust based on your theme

  const navigation = useNavigation();

  console.log('PersonalDetails:', player);

  // ✅ Detect changes
  useEffect(() => {
    const requiredFieldsFilled =
      firstName.trim() !== '' &&
      surname.trim() !== '' &&
      nickname.trim() !== '' &&
      dob instanceof Date &&
      !isNaN(dob);

    const changed =
      firstName !== player?.first_name ||
      surname !== player?.surname ||
      nickname !== player?.nickname ||
      dob.toISOString().split('T')[0] !== player?.dob;

    setHasChanges(requiredFieldsFilled && changed);
  }, [firstName, surname, nickname, dob, player]);

  // ✅ Save handler
  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    const updates = {};

    if (firstName !== player?.first_name) updates.first_name = firstName;
    if (surname !== player?.surname) updates.surname = surname;
    if (nickname !== player?.nickname) updates.nickname = nickname;
    if (dob.toISOString().split('T')[0] !== player?.dob) {
      updates.dob = dob.toISOString().split('T')[0]; // store as 'YYYY-MM-DD'
    }

    const { error } = await supabase.from('Players').update(updates).eq('id', player.id);

    if (error) {
      console.error('Failed to save changes:', error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ['TeamPlayers', player?.team_id] });
      await queryClient.invalidateQueries({ queryKey: ['PlayerProfile', player?.id] });
      await refetch(); // Refresh user data
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

        <View className="w-full rounded-2xl bg-bg-grouped-2">
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

export default PersonalDetails;
