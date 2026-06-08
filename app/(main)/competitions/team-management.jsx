import { View, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useChildTeams } from '@hooks/useChildTeams';
import { Ionicons } from '@expo/vector-icons';
import Heading from '@components/Heading';
import CTAButton from '@components/CTAButton';
import ChildTeamCard from '@components/ChildTeamCard';
import BottomSheetModal from '@components/BottomSheetModal';
import { useState } from 'react';
import ManageCompTeam from '@components/ManageCompTeam';
import TeamInviteCard from '@components/TeamInviteCard2';
import { useChildTeamInvites } from '@hooks/useChildTeamInvites';
import { useAcceptTeamInvite } from '@hooks/useAcceptTeamInvite';
import { useDeclineTeamInvite } from '@hooks/useDeclineTeamInvite';

const TeamManagement = () => {
  const [teamManagerVisible, setTeamManagerVisible] = useState(false);
  const [managerType, setManagerType] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { currentRole, player } = useUser();
  const { data: invites } = useChildTeamInvites(player?.id, currentRole?.team.id);

  const { mutate: acceptInvite, isPending: isAccepting } = useAcceptTeamInvite();
  const { mutate: declineInvite, isPending: isDeclining } = useDeclineTeamInvite();
  console.log('invites:', invites);

  const childTeams = currentRole?.compTeams;

  console.log('Child Teams:', childTeams);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title={`Manage Teams`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{
            display: 'flex',
            flexGrow: 1,
            gap: 10,
            paddingVertical: 20,
            paddingBottom: 120, // 👈 key fix
          }}
          className="mt-16 flex-1 bg-bg-2 px-4">
          {invites?.length > 0 && (
            <>
              <Heading text="My Invites" />
              {invites.map((invite) => (
                <TeamInviteCard
                  key={invite.id}
                  invite={invite}
                  isAccepting={isAccepting}
                  onAccept={() =>
                    acceptInvite(
                      { inviteId: invite.id, playerId: player.id },
                      {
                        onError: (err) => {
                          const messages = {
                            INVITE_NOT_FOUND: 'This invite is no longer valid.',
                          };
                          Alert.alert(
                            'Could not accept invite',
                            messages[err.message] ?? err.message
                          );
                        },
                      }
                    )
                  }
                  onDecline={() =>
                    declineInvite(
                      { inviteId: invite.id, playerId: player.id },
                      {
                        onError: (err) => {
                          const messages = {
                            INVITE_NOT_FOUND: 'This invite is no longer valid.',
                          };
                          Alert.alert(
                            'Could not decline invite',
                            messages[err.message] ?? err.message
                          );
                        },
                      }
                    )
                  }
                />
              ))}
            </>
          )}
          <Heading text="My Teams" />
          <View className="gap-3">
            {childTeams?.length > 0 ? (
              childTeams.map((team) => (
                <ChildTeamCard
                  onPress={() => {
                    setManagerType('edit');
                    setSelectedTeam(team);
                    setTeamManagerVisible(true);
                  }}
                  onPlayerPress={(player) => {
                    setManagerType('edit');
                    setSelectedTeam(team);
                    setTeamManagerVisible(true);
                  }}
                  key={team.id}
                  team={team}
                />
              ))
            ) : (
              <View className="flex-1 items-center justify-center gap-2 rounded-2xl bg-bg-1 py-8 shadow-sm">
                <Ionicons name="people-circle-outline" size={64} color="#888" />
                <Text className="font-saira-medium text-text-2">No teams available</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="p-6">
          <View
            style={{ borderRadius: 30 }}
            className="border border-theme-gray-3 bg-bg-1/80 p-4 shadow-md backdrop-blur-lg">
            <CTAButton
              text="Create New Team"
              callbackFn={() => {
                setManagerType('create');
                setTeamManagerVisible(true);
              }}
              icon={<Ionicons name="add" size={24} color="#000" />}
              type="yellow"
            />
          </View>
        </View>
        <BottomSheetModal
          showModal={teamManagerVisible}
          setShowModal={setTeamManagerVisible}
          title={managerType === 'create' ? 'Create New Team' : 'Edit Team'}>
          <ManageCompTeam
            type={managerType}
            team={managerType === 'edit' ? selectedTeam : null}
            closeModal={() => setTeamManagerVisible(false)}
          />
        </BottomSheetModal>
      </SafeViewWrapper>
    </>
  );
};

export default TeamManagement;
