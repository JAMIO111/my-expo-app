import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SettingsItem from '@components/SettingsItem';
import supabase from '@lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary

const TeamDetails = () => {
  const queryClient = useQueryClient();
  const { player, loading: playerLoading, refetch, currentRole } = useUser(); // Assume refreshUser reloads user data
  const [teamName, setTeamName] = useState(currentRole?.team?.name || '');
  const [teamDisplayName, setTeamDisplayName] = useState(currentRole?.team?.display_name || '');
  const [abbreviation, setAbbreviation] = useState(currentRole?.team?.abbreviation || '');
  const [address, setAddress] = useState(currentRole?.team?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  console.log('PersonalDetails:', player, currentRole);

  // ✅ Detect changes
  useEffect(() => {
    setTeamName(currentRole?.team?.name || '');
    setTeamDisplayName(currentRole?.team?.display_name || '');
    setAbbreviation(currentRole?.team?.abbreviation || '');
    setAddress(currentRole?.team?.address || '');
  }, [teamName, teamDisplayName, abbreviation, player, currentRole]);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Team Info" />
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
            routerPath="/settings/DisplayName"
            title="Display Name"
            text={teamDisplayName}
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

        <MenuContainer>
          <SettingsItem routerPath="/settings/TeamCrest" title="Team Crest" />
          <SettingsItem routerPath="/settings/TeamCoverImage" title="Cover Image" lastItem={true} />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default TeamDetails;
