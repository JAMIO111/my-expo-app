import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { Stack, usePathname } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import CustomHeader from '@components/CustomHeader';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useTeamProfile } from '@hooks/useTeamProfile';
import ImageUploader from '@components/ImageUploader';
import TeamLogo from '@components/TeamLogo';
import { useUser } from '@contexts/UserProvider';
import { useTeamPlayerActions } from '@hooks/useTeamPlayerActions';
import FloatingBottomSheet from '@components/FloatingBottomSheet';

const ManageTeam = () => {
  const { currentRole } = useUser();
  const [shouldGoBack, setShouldGoBack] = useState(false);
  const { removeFromDivision } = useTeamPlayerActions(teamId, {
    removeFromDivision: {
      onSuccess: () => {
        setShouldGoBack(true);
      },
    },
  });
  const pathname = usePathname();
  console.log('Current Pathname:', pathname);
  const router = useRouter();
  const { teamId } = useLocalSearchParams();
  const [editMode, setEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const { data: teamProfile, isLoading, error } = useTeamProfile(teamId);
  console.log('teamId from params:', teamId);
  console.log('Team Profile in Manage Team:', teamProfile);

  useEffect(() => {
    if (shouldGoBack) {
      setTimeout(() => {
        router.back();
      }, 100);
    }
  }, [shouldGoBack]);

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
      title: 'Remove team from division?',
      message: `Are you sure you want to remove ${teamProfile?.name} from ${teamProfile?.division.name}? ${currentRole?.activeSeason ? `As the ${currentRole?.activeSeason?.name} season is still ongoing, this will also result in all remaining fixtures being changed to a bye.` : ''}`,
      topButtonText: 'Remove Team',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
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

  return (
    <>
      <SafeViewWrapper topColor="bg-brand" useBottomInset={false} bottomColor="bg-brand">
        <StatusBar style="light" backgroundColor="#000" />
        <View className="flex-1">
          <Stack.Screen
            options={{
              header: () => (
                <SafeViewWrapper useBottomInset={false}>
                  <CustomHeader
                    rightIcon={editMode ? 'checkmark-outline' : 'pencil-outline'}
                    onRightPress={() => setEditMode(!editMode)}
                    showBack={true}
                    iconSize={editMode ? 28 : 22}
                    title={teamProfile ? teamProfile.name : 'Team Name'}
                  />
                </SafeViewWrapper>
              ),
            }}
          />
          <ScrollView className="mt-16 flex-1 bg-brand p-4">
            <ImageUploader
              aspectRatio={[16, 9]}
              initialUri={teamProfile ? teamProfile?.cover_image_url : null}
            />
            <View className="mt-4 flex-row gap-5 rounded-3xl bg-bg-1 p-6">
              <TeamLogo
                size={100}
                type={teamProfile?.crest.type}
                color1={teamProfile?.crest.color1}
                color2={teamProfile?.crest.color2}
                thickness={teamProfile?.crest.thickness}
              />
              <View className="flex-1 items-center justify-center rounded-2xl bg-bg-2 p-3">
                {!editMode ? (
                  <Text style={{ fontSize: 44 }} className="font-saira-semibold text-text-2">
                    {teamProfile?.abbreviation}
                  </Text>
                ) : (
                  <TextInput
                    editable={editMode}
                    keyboardType="default"
                    placeholder="Enter abbreviation"
                    placeholderTextColor="#9CA3AF"
                    value={teamProfile?.abbreviation}
                    maxLength={3}
                    returnKeyType="done"
                    autoCapitalize="characters"
                    style={{ fontSize: 44 }}
                    className="font-saira-semibold text-text-2"
                  />
                )}
              </View>
            </View>
            <View className="mt-4 gap-2 rounded-3xl bg-bg-1 p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-saira-medium text-xl text-text-2">Team Name</Text>
                <Text className="font-saira-semibold text-xl text-text-1">{teamProfile?.name}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-saira-medium text-xl text-text-2">Display Name</Text>
                <Text className="font-saira-semibold text-xl text-text-1">
                  {teamProfile?.display_name}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-saira-medium text-xl text-text-2">Established</Text>
                <Text className="font-saira-semibold text-xl text-text-1">
                  {teamProfile?.created_at
                    ? new Date(teamProfile?.created_at).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="font-saira-medium text-xl text-text-2">Join Code</Text>
                <Text className="font-saira-semibold text-xl text-text-1">{teamProfile?.code}</Text>
              </View>
            </View>

            <View className="mt-4 gap-4 rounded-3xl">
              <CTAButton
                type="yellow"
                text="Manage Roster"
                callbackFn={() => router.push(`/team/${teamId}`)}
              />
              <CTAButton
                type="yellow"
                text="Transfer Division"
                callbackFn={() => router.push(`/team/${teamId}`)}
              />
              <CTAButton
                type="error"
                text="Remove from Division"
                callbackFn={() => handleRemoveTeam(currentRole?.activeSeason?.id)}
              />
            </View>
            <Text className="text-md my-6 text-center font-saira text-text-on-brand">
              {`ID: ${teamProfile?.id}`}
            </Text>
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
    </>
  );
};

export default ManageTeam;
