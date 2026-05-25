import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SettingsItem from '@components/SettingsItem';
import { supabase } from '@/lib/supabase';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import Toast from 'react-native-toast-message';
import EditableSettingsItem from '@components/EditableSettingsItem';

const TeamDetails = () => {
  const { player, loading: playerLoading, refetch, currentRole } = useUser(); // Assume refreshUser reloads user data
  const [teamName, setTeamName] = useState(currentRole?.team?.name || '');
  const [teamDisplayName, setTeamDisplayName] = useState(currentRole?.team?.display_name || '');
  const [abbreviation, setAbbreviation] = useState(currentRole?.team?.abbreviation || '');
  const [address, setAddress] = useState(currentRole?.team?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  console.log('PersonalDetails:', player, currentRole);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('log_and_update_changes', {
        table_name: 'Teams',
        target_id: currentRole?.team?.id,
        updates: {
          name: teamName,
          display_name: teamDisplayName,
        },
        user_id: player?.auth_id,
      });
      if (error) {
        throw error;
      }
      Toast.show({
        type: 'success',
        text1: 'Team details updated successfully',
      });
      refetch(); // Refresh user data after successful update
    } catch (error) {
      console.error('Error updating team details:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update team details',
        text2: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!player) {
      setHasChanges(false);
      return;
    }

    const requiredFieldsFilled = teamName.trim() !== '' && teamDisplayName.trim() !== '';

    const changed =
      teamName !== currentRole?.team?.name || teamDisplayName !== currentRole?.team?.display_name;

    setHasChanges(requiredFieldsFilled && changed);
  }, [teamName, teamDisplayName, currentRole]);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon="checkmark-outline"
                title="Team Details"
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <SettingsItem routerPath="/settings/TeamCrest" title="Team Crest" />
          <SettingsItem
            routerPath="/settings/TeamCoverImage"
            title="Team Cover Image"
            lastItem={true}
          />
        </MenuContainer>
        <MenuContainer>
          <EditableSettingsItem
            title="Team Name"
            value={teamName}
            onChangeText={setTeamName}
            placeholder="Enter your team name"
          />
          <EditableSettingsItem
            title="Display Name"
            value={teamDisplayName}
            onChangeText={setTeamDisplayName}
            placeholder="Enter your display name"
          />
          <SettingsItem
            routerPath="/settings/Abbreviation"
            title="Abbreviation"
            text={abbreviation}
          />
          <SettingsItem
            routerPath="/settings/Address"
            title="Address"
            text={
              [address.line_1, address.line_2, address.city, address.county, address.postcode]
                .filter(Boolean)
                .join(', ') || 'No Address'
            }
            lastItem={true}
          />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default TeamDetails;
