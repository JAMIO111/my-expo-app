import { View, ScrollView, Pressable, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTeamProfile } from '@hooks/useTeamProfile';
import { useUser } from '@contexts/UserProvider';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { Circle, CircleCheck, CircleCheckBig, Loader } from 'lucide-react-native';
import MenuContainer from '@components/MenuContainer';
import EditableSettingsItem from '@components/EditableSettingsItem';
import SettingsItem from '@components/SettingsItem';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import BottomSheetModal from '@components/BottomSheetModal';
import { useDivisions } from '@hooks/useDivisions';
import CTAButton from '@components/CTAButton';

const ManageTeam = () => {
  const router = useRouter();
  const { teamId } = useLocalSearchParams();
  const { currentRole } = useUser();
  const [shouldGoBack, setShouldGoBack] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { data: teamProfile, isLoading, error } = useTeamProfile(teamId);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [teamName, setTeamName] = useState(teamProfile?.name);
  const [teamAbbreviation, setTeamAbbreviation] = useState(teamProfile?.abbreviation);
  const [teamDisplayName, setTeamDisplayName] = useState(teamProfile?.display_name);
  const [teamJoinCode, setTeamJoinCode] = useState(teamProfile?.code);
  const [tempDivision, setTempDivision] = useState(null);
  const { data: divisions } = useDivisions(currentRole?.district?.id);

  const transferableDivisions = divisions?.filter(
    (d) => d.id !== teamProfile?.division?.id && d.group_id === teamProfile?.division?.group_id
  );

  console.log('teamId from params:', teamId);
  console.log('Team Profile in Manage Team:', teamProfile);
  console.log('Divisions in Manage Team:', divisions);

  useEffect(() => {
    if (shouldGoBack) {
      setTimeout(() => {
        router.back();
      }, 100);
    }
  }, [shouldGoBack]);

  useEffect(() => {
    if (!teamProfile) return;
    setTeamName(teamProfile.name);
    setTeamAbbreviation(teamProfile.abbreviation);
    setTeamDisplayName(teamProfile.display_name);
    setTeamJoinCode(teamProfile.code);
  }, [teamProfile]);

  useEffect(() => {
    setTempDivision(null);
  }, [showModal]);

  const openConfirm = ({
    title,
    message,
    topButtonText = 'Cancel',
    bottomButtonText = 'Confirm',
    topButtonType = 'success',
    bottomButtonType = 'error',
    topButtonFn = () => {},
    bottomButtonFn = () => {},
  }) => {
    setConfirmConfig({
      title,
      message,
      topButtonText,
      bottomButtonText,
      topButtonType,
      bottomButtonType,
      topButtonFn,
      bottomButtonFn,
    });
    setModalVisible(true);
  };

  const handleRemoveTeam = () => {
    openConfirm({
      title: 'Remove from Competitions too?',
      message: `You are about to remove ${teamProfile?.name}'s membership from ${teamProfile?.division.name}? Would you also like to remove them from any active competitions?`,
      topButtonText: 'Remove from division only',
      bottomButtonText: 'Remove from all comps',
      topButtonType: 'default',
      bottomButtonType: 'error',
      topButtonFn: () => {
        removeFromDivision.mutate({
          teamId: teamProfile.id,
          activeSeasonId: currentRole?.activeSeason?.id,
          divisionId: teamProfile?.division?.id,
        });
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  const hasChanges =
    teamName !== teamProfile?.name ||
    teamAbbreviation !== teamProfile?.abbreviation ||
    teamDisplayName !== teamProfile?.display_name ||
    teamJoinCode !== teamProfile?.code;

  const handleChangeCode = (newCode) => {
    if (!/^\d*$/.test(newCode)) {
      Toast.show({
        type: 'info',
        text1: 'Join code must only contain numbers',
      });
      return;
    }

    if (newCode?.length > 6) {
      Toast.show({
        type: 'info',
        text1: 'Join code must be 6 characters or less',
      });
      return;
    }

    setTeamJoinCode(newCode);
  };

  const handleChangeAbbreviation = (newAbbreviation) => {
    if (!/^[A-Za-z]*$/.test(newAbbreviation)) {
      return;
    }

    if (newAbbreviation?.length > 3) {
      Toast.show({
        type: 'info',
        text1: 'Abbreviation must be 3 characters long',
      });
      return;
    }

    setTeamAbbreviation(newAbbreviation?.toUpperCase());
  };

  const saveChanges = async () => {
    if (teamAbbreviation.length !== 3) {
      Toast.show({
        type: 'info',
        text1: 'Abbreviation must be 3 characters long',
      });
      return;
    }
    if (!teamJoinCode?.length || teamJoinCode?.length !== 6) {
      Toast.show({
        type: 'info',
        text1: 'Join code must be 6 characters long',
      });
      return;
    }
    if (hasChanges) {
      try {
        setSaving(true);
        const { data, error } = await supabase.rpc('admin_update_team_details', {
          p_team_id: teamProfile.id,
          p_name: teamName,
          p_display_name: teamDisplayName,
          p_code: teamJoinCode,
          p_abbreviation: teamAbbreviation,
        });

        // Transport/RPC-level failure (network, permissions, RPC not found, etc.)
        if (error) {
          throw error;
        }

        // Business-logic failure returned by the function itself
        if (!data?.success) {
          Toast.show({
            type: 'error',
            text1: data?.message || 'Failed to save changes',
          });
          return;
        }

        await queryClient.invalidateQueries(['TeamProfile', teamProfile.id]);
        // Success
        Toast.show({
          type: 'success',
          text1: data.message || 'Team details updated',
        });
      } catch (err) {
        // Unexpected error: network drop, JSON parse issue, etc.
        console.error('saveChanges unexpected error:', err);
        Toast.show({
          type: 'error',
          text1: 'Something went wrong. Please try again.',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <>
      <SafeViewWrapper topColor="bg-brand" useBottomInset={false} bottomColor="bg-brand">
        <StatusBar style="light" />
        <View className="flex-1">
          <Stack.Screen
            options={{
              header: () => (
                <SafeViewWrapper useBottomInset={false}>
                  <CustomHeader
                    rightIcon={saving ? Loader : hasChanges ? CircleCheckBig : null}
                    onRightPress={saving ? null : saveChanges}
                    showBack={true}
                    title={teamProfile ? teamProfile.name : 'Team Name'}
                  />
                </SafeViewWrapper>
              ),
            }}
          />
          <ScrollView className="mt-16 flex-1 p-4">
            <MenuContainer
              title="Team Details"
              footer="As league admin you may edit any of the team details above by tapping on the respective fields. Save changes after by tapping the tick in the top right.">
              <EditableSettingsItem
                title="Team Name"
                value={teamName}
                icon="userPen"
                onChangeText={setTeamName}
                editable={!saving}
              />
              <EditableSettingsItem
                title="Display Name"
                icon="userPen"
                value={teamDisplayName}
                onChangeText={setTeamDisplayName}
                editable={!saving}
              />
              <EditableSettingsItem
                title="Abbreviation"
                icon="rectangleEllipsis"
                value={teamAbbreviation}
                onChangeText={handleChangeAbbreviation}
                editable={!saving}
                autoCapitalize="characters"
              />
              <EditableSettingsItem
                title="Join Code"
                icon="keySquare"
                value={teamJoinCode}
                onChangeText={handleChangeCode}
                keyboardType="numeric"
                editable={!saving}
              />
            </MenuContainer>

            <MenuContainer title="Team Image">
              <SettingsItem
                routerPath={`/my-leagues/${teamProfile?.id}/manage-crest`}
                title="Team Crest"
                icon="hexagon"
              />
              <SettingsItem
                routerPath={`/my-leagues/${teamProfile?.id}/manage-cover-image`}
                title="Team Cover Image"
                icon="image"
              />
            </MenuContainer>

            <MenuContainer title="Team Actions">
              <SettingsItem
                title="Transfer Division"
                icon="arrowLeftRight"
                callbackFn={() => setShowModal(true)}
              />
              <SettingsItem
                title="Remove Team from Division"
                icon="logout"
                iconColor="#ff0000"
                titleColor="text-[#ff0000]"
                callbackFn={() => handleRemoveTeam(currentRole?.activeSeason?.id)}
              />
            </MenuContainer>
            <MenuContainer title="More Details">
              <SettingsItem icon="bookKey" title="Team ID" text={teamProfile?.id} />
              <SettingsItem
                title="Established"
                icon="calendar"
                text={
                  teamProfile?.created_at
                    ? new Date(teamProfile?.created_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'
                }
              />
              <SettingsItem title="Division" icon="shield" text={teamProfile?.division?.name} />
              <SettingsItem
                title="Visibility"
                icon="eye"
                text={teamProfile?.private ? 'Private' : 'Public'}
              />
              <SettingsItem
                title="Recruitment Status"
                icon="binoculars"
                text={teamProfile?.is_recruiting ? 'Recruiting' : 'Closed'}
              />
            </MenuContainer>
          </ScrollView>
        </View>
      </SafeViewWrapper>
      <FloatingBottomSheet
        visible={modalVisible}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        topButtonText={confirmConfig?.topButtonText}
        bottomButtonText={confirmConfig?.bottomButtonText}
        topButtonType={confirmConfig?.topButtonType}
        bottomButtonType={confirmConfig?.bottomButtonType}
        topButtonFn={confirmConfig?.topButtonFn}
        bottomButtonFn={confirmConfig?.bottomButtonFn}
        onCancel={() => setModalVisible(false)}
      />
      <BottomSheetModal showModal={showModal} setShowModal={setShowModal} title="Transfer Division">
        <View className="flex-1 p-4 pb-16">
          <View className="flex-1">
            {transferableDivisions?.map((division) => (
              <Pressable
                className="mb-3 flex-row items-center justify-between rounded-3xl bg-bg-2 p-4"
                key={division?.id}
                onPress={() => setTempDivision(division)}>
                <View>
                  <Text
                    className={`font-tektur-medium text-2xl ${
                      tempDivision?.id === division?.id ? 'text-text-1' : 'text-text-2'
                    }`}>
                    {division.name}
                  </Text>
                  <Text className="font-tektur text-xl text-text-2">Tier {division?.tier}</Text>
                </View>
                {tempDivision?.id === division?.id ? (
                  <CircleCheck size={40} strokeWidth={1.5} />
                ) : (
                  <Circle size={40} strokeWidth={1.5} />
                )}
              </Pressable>
            ))}
          </View>
          <CTAButton
            text="Transfer"
            type="yellow"
            disabled={!tempDivision}
            onPress={() => handleTransferDivision(tempDivision?.id)}
          />
        </View>
      </BottomSheetModal>
    </>
  );
};

export default ManageTeam;
