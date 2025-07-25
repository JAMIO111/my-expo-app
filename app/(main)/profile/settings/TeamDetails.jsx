import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SettingsItem from '@components/SettingsItem';
import supabase from '@lib/supabaseClient';
import IonIcons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors'; // Adjust the import path as necessary
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary

const TeamDetails = () => {
  const queryClient = useQueryClient();
  const { player, loading: playerLoading, refetch } = useUser(); // Assume refreshUser reloads user data
  const [teamName, setTeamName] = useState(player?.team?.name || '');
  const [teamDisplayName, setTeamDisplayName] = useState(player?.team?.display_name || '');
  const [abbreviation, setAbbreviation] = useState(player?.team?.abbreviation || '');
  const [address, setAddress] = useState(player?.team?.address || '');
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
      teamName.trim() !== '' && teamDisplayName.trim() !== '' && abbreviation.trim() !== '';

    const changed =
      teamName !== player?.team?.name ||
      teamDisplayName !== player?.team?.display_name ||
      abbreviation !== player?.team?.abbreviation;

    setHasChanges(requiredFieldsFilled && changed);
  }, [teamName, teamDisplayName, abbreviation, player]);

  // ✅ Save handler
  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    const updates = {};

    if (teamName !== player?.team?.name) updates.team_name = teamName;
    if (teamDisplayName !== player?.team?.display_name) updates.team_display_name = teamDisplayName;
    if (abbreviation !== player?.team?.abbreviation) updates.abbreviation = abbreviation;

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
          <SettingsItem routerPath="/settings/team-name" title="Team Name" text={teamName} />
          <SettingsItem
            routerPath="/settings/display-name"
            title="Display Name"
            text={teamDisplayName}
          />
          <SettingsItem
            routerPath="/settings/abbreviation"
            title="Abbreviation"
            text={abbreviation}
          />
          <SettingsItem
            title="Address"
            text={`${address.line_1}, ${address.line_2}, ${address.city}, ${address.county} ${address.postcode}`}
            lastItem={true}
          />
        </MenuContainer>

        <MenuContainer>
          <SettingsItem routerPath="/settings/TeamCrest" title="Team Crest" />
          <SettingsItem routerPath="/settings/CoverImage" title="Cover Image" lastItem={true} />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default TeamDetails;
