import { View, ScrollView, RefreshControl, Text } from 'react-native';
import NavBar from '@components/NavBar2';
import { useState, useCallback, useRef } from 'react';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import TeamInviteCard from '@components/TeamInviteCard';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import MyTeamCard from '@components/MyTeamCard';
import { useUser } from '@contexts/UserProvider';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import Heading from '@components/Heading';
import { useTeamPlayerActions } from '@hooks/useTeamPlayerActions';
import AnimatedSearchBar from '@components/AnimatedSearchBar';
import SearchResultsOverlay from '@components/SearchResultsOverlay';

const Home = () => {
  const { client: supabase } = useSupabaseClient();
  const queryClient = useQueryClient();
  const { user, player, roles, currentRole } = useUser();
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playerInvitesAndRequests } = usePlayerInvitesAndRequests({ playerId: player.id });
  console.log('Player Invites and Requests:', playerInvitesAndRequests);

  const { leaveTeam, sendJoinRequest, revokeRequest } = useTeamPlayerActions();

  const joinTeam = async (invite) => {
    const { error } = await supabase
      .from('TeamPlayers')
      .update({ status: 'active', accepted_by: player.id, joined_at: new Date() })
      .eq('id', invite.id);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error joining team',
        text2: 'Please try again.',
      });
    } else {
      queryClient.invalidateQueries(['PlayerInvitesAndRequests', { playerId: player.id }]);
      Toast.show({
        type: 'success',
        text1: 'Successfully joined team',
        text2: `You are now a member of ${invite.team.display_name}.`,
      });
    }
  };

  const deleteInvite = async (invite) => {
    const { error } = await supabase.from('TeamPlayers').delete().eq('id', invite.id);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error declining invite',
        text2: 'Please try again.',
      });
    } else {
      queryClient.invalidateQueries(['PlayerInvitesAndRequests', { playerId: player.id }]);
      Toast.show({
        type: 'success',
        text1: 'Successfully declined invite',
        text2: 'The invite has been dismissed.',
      });
    }
  };

  const handleLeaveTeam = (role) => {
    openConfirm({
      title: 'Leave Team?',
      message: `Are you sure you want to leave ${role.team.display_name}? This action cannot be undone.`,
      topButtonText: 'Leave Team',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      bottomButtonFn: () => setModalVisible(false),
      topButtonFn: () => {
        console.log('Leaving team:', role.team.id);
        console.log('Player ID:', player.id);
        leaveTeam.mutate({ team: role?.team, player: player });
        setModalVisible(false);
      },
    });
  };

  const openConfirm = ({
    invite,
    title,
    message,
    topButtonText = 'Cancel',
    bottomButtonText = 'Confirm',
    topButtonType = 'success',
    bottomButtonType = 'error',
    topButtonFn = () => {},
    bottomButtonFn = () => {},
  }) => {
    setSelectedInvite(invite);
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

  const handleDecline = (invite) => {
    openConfirm({
      invite,
      title: 'Decline Invite?',
      message: `Are you sure you want to decline the invite from ${invite.team.display_name}?`,
      topButtonText: 'Decline Invite',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      bottomButtonFn: () => setModalVisible(false),
      topButtonFn: () => {
        deleteInvite(invite);
        setModalVisible(false);
      },
    });
  };

  const handleAccept = (invite) => {
    openConfirm({
      invite,
      title: 'Accept Invite?',
      message: `Do you want to accept the invite and join ${invite.team.display_name}?`,
      topButtonText: 'Join Team',
      bottomButtonText: 'Go Back',
      topButtonType: 'success',
      bottomButtonType: 'default',
      bottomButtonFn: () => setModalVisible(false),
      topButtonFn: () => {
        joinTeam(invite);
        setModalVisible(false);
      },
    });
  };

  const handleRevoke = (request) => {
    openConfirm({
      invite: request,
      title: 'Revoke Request?',
      message: `Are you sure you want to revoke the request to join ${request.team.display_name}?`,
      topButtonText: 'Revoke Request',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      bottomButtonFn: () => setModalVisible(false),
      topButtonFn: () => {
        revokeRequest.mutate(request.id);
        setModalVisible(false);
      },
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    queryClient
      .invalidateQueries(['PlayerInvitesAndRequests', { playerId: player.id }])
      .then(() => {
        return new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
      })
      .finally(() => {
        setRefreshing(false);
      });
  }, [queryClient, player.id]);

  return (
    <>
      <SafeViewWrapper useBottomInset={!searchActive} topColor="bg-brand" bottomColor="bg-brand">
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useTopInset={false} useBottomInset={false}>
                <CustomHeader
                  title="Explore Teams"
                  showBack={false}
                  rightIcon="clipboard-outline"
                />
                <AnimatedSearchBar
                  searchActive={searchActive}
                  setSearchActive={setSearchActive}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </SafeViewWrapper>
            ),
          }}
        />
        {searchActive ? (
          <View className="flex-1 items-center justify-center p-4">
            <SearchResultsOverlay
              searchQuery={searchQuery}
              sendJoinRequest={sendJoinRequest}
              onClose={() => {
                setSearchActive(false);
                setSearchQuery('');
                searchInputRef.current?.blur();
              }}
            />
          </View>
        ) : (
          <>
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#ccc']} // Android spinner color
                  tintColor="#ccc" // iOS spinner color
                />
              }
              style={{ marginTop: 67 }}
              className="flex-1 bg-bg-grouped-1 p-3 pt-5"
              contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              {playerInvitesAndRequests?.filter((invite) => invite.status === 'invited').length >
                0 && (
                <View className="mb-2 w-full">
                  <Heading text="Invites" />
                  {playerInvitesAndRequests
                    .filter((invite) => invite.status === 'invited')
                    .map((invite) => (
                      <TeamInviteCard
                        type="invite"
                        key={invite.id}
                        invite={invite}
                        onAccept={() => handleAccept(invite)}
                        onDecline={() => handleDecline(invite)}
                      />
                    ))}
                </View>
              )}

              {playerInvitesAndRequests?.filter((invite) => invite.status === 'requested').length >
                0 && (
                <View className="mb-2 w-full">
                  <Heading text="Requests" />
                  {playerInvitesAndRequests
                    .filter((invite) => invite.status === 'requested')
                    .map((invite) => (
                      <TeamInviteCard
                        type="request"
                        key={invite.id}
                        invite={invite}
                        onDecline={() => handleRevoke(invite)}
                      />
                    ))}
                </View>
              )}
              {roles?.filter((role) => role.type !== 'admin').length > 0 ? (
                <View className="w-full pb-16">
                  <Heading text="My Teams" />
                  <View className="w-full gap-3">
                    {roles
                      .filter((role) => role.type !== 'admin')
                      .map((role) => (
                        <MyTeamCard
                          key={role.id}
                          active={currentRole?.team?.id === role?.team?.id}
                          onPress={() => handleLeaveTeam(role)}
                          role={role}
                        />
                      ))}
                  </View>
                </View>
              ) : (
                <View
                  className="w-full items-center justify-center rounded-2xl border border-theme-gray-4
                 bg-bg-grouped-2 p-6">
                  <Text className="font-saira text-lg text-text-2">
                    You are not currently a member of any teams. Use the search bar above to find
                    and join teams.
                  </Text>
                </View>
              )}
            </ScrollView>
            <NavBar type="onboarding" />
          </>
        )}
      </SafeViewWrapper>

      {/* Floating Confirmation Modal */}
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

export default Home;
