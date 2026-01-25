import { View, ScrollView, RefreshControl, Text } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';

import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import NavBar from '@components/NavBar2';
import Heading from '@components/Heading';
import TeamInviteCard from '@components/TeamInviteCard';
import MyTeamCard from '@components/MyTeamCard';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import AnimatedSearchBar from '@components/AnimatedSearchBar';
import SearchResultsOverlay from '@components/SearchResultsOverlay';

import { useUser } from '@contexts/UserProvider';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import { useTeamPlayerActions } from '@hooks/useTeamPlayerActions';
import Toast from 'react-native-toast-message';

const Home = () => {
  const { client: supabase } = useSupabaseClient();
  const queryClient = useQueryClient();
  const { user, player, roles, currentRole } = useUser();
  const { leaveTeam, sendJoinRequest, revokeRequest } = useTeamPlayerActions();
  const { acceptInvite } = useTeamPlayerActions(currentRole?.team?.id, {});
  const { data: playerInvitesAndRequests } = usePlayerInvitesAndRequests({ playerId: player.id });

  const [confirmConfig, setConfirmConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    queryClient
      .invalidateQueries(['PlayerInvitesAndRequests', { playerId: player.id }])
      .finally(() => setRefreshing(false));
  }, [queryClient, player.id]);

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

  // Invite / request handlers
  const handleAccept = (invite) => {
    openConfirm({
      title: 'Accept Invite?',
      message: `Do you want to accept the invite and join ${invite.team.display_name}?`,
      topButtonText: 'Join Team',
      bottomButtonText: 'Go Back',
      topButtonType: 'success',
      bottomButtonType: 'default',
      topButtonFn: async () => {
        console.log(invite);
        await acceptInvite.mutateAsync(invite);
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  const handleDecline = (invite) => {
    openConfirm({
      title: 'Decline Invite?',
      message: `Are you sure you want to decline the invite from ${invite.team.display_name}?`,
      topButtonText: 'Decline Invite',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      topButtonFn: async () => {
        await supabase.from('TeamPlayers').delete().eq('id', invite.id);
        queryClient.invalidateQueries(['PlayerInvitesAndRequests', { playerId: player.id }]);
        setModalVisible(false);
        Toast.show({ type: 'success', text1: 'Invite declined' });
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  const handleLeaveTeam = (role) => {
    openConfirm({
      title: 'Leave Team?',
      message: `Are you sure you want to leave ${role.team.display_name}? This cannot be undone.`,
      topButtonText: 'Leave Team',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      topButtonFn: () => {
        leaveTeam.mutate({ team: role.team, player });
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  const handleRevoke = (request) => {
    openConfirm({
      title: 'Revoke Request?',
      message: `Are you sure you want to revoke the request to join ${request.team.display_name}?`,
      topButtonText: 'Revoke Request',
      bottomButtonText: 'Cancel',
      topButtonType: 'error',
      bottomButtonType: 'default',
      topButtonFn: () => {
        revokeRequest.mutate(request.id);
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

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
                  onDebouncedChange={setSearchQuery}
                />
              </SafeViewWrapper>
            ),
          }}
        />

        {/* Search Overlay */}
        <SearchResultsOverlay
          searchActive={searchActive}
          searchQuery={searchQuery}
          sendJoinRequest={sendJoinRequest}
        />

        {/* Main content */}
        {!searchActive && (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ccc"
                colors={['#ccc']}
              />
            }
            style={{ marginTop: 67 }}
            className="flex-1 bg-bg-grouped-1 p-3 pt-5"
            contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}>
            {playerInvitesAndRequests?.filter((i) => i.status === 'invited').length > 0 && (
              <View className="mb-2 w-full">
                <Heading text="Invites" />
                {playerInvitesAndRequests
                  .filter((i) => i.status === 'invited')
                  .map((invite) => (
                    <TeamInviteCard
                      key={invite.id}
                      type="invite"
                      invite={invite}
                      onAccept={() => handleAccept(invite)}
                      onDecline={() => handleDecline(invite)}
                    />
                  ))}
              </View>
            )}

            {playerInvitesAndRequests?.filter(
              (i) =>
                i.status === 'pending_both' ||
                i.status === 'pending_captain' ||
                i.status === 'pending_admin' ||
                i.status === 'requested'
            ).length > 0 && (
              <View className="mb-2 w-full">
                <Heading text="Requests" />
                {playerInvitesAndRequests
                  .filter(
                    (i) =>
                      i.status === 'pending_both' ||
                      i.status === 'pending_captain' ||
                      i.status === 'pending_admin' ||
                      i.status === 'requested'
                  )
                  .map((request) => (
                    <TeamInviteCard
                      key={request.id}
                      type="request"
                      invite={request}
                      onDecline={() => handleRevoke(request)}
                    />
                  ))}
              </View>
            )}

            {roles?.filter((r) => r.type !== 'admin').length === 0 &&
            playerInvitesAndRequests?.filter(
              (i) =>
                i.status === 'pending_both' ||
                i.status === 'pending_captain' ||
                i.status === 'pending_admin' ||
                i.status === 'requested'
            ).length > 0 ? (
              <View className="w-full pb-16">
                <Heading text="My Teams" />
                <View className="w-full gap-3">
                  {roles
                    .filter((r) => r.type !== 'admin')
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
              <View className="w-full items-center justify-center rounded-2xl border border-theme-gray-4 bg-bg-grouped-2 p-6">
                <Text className="font-saira text-lg text-text-2">
                  You are not currently a member of any teams. Use the search bar above to find and
                  join teams.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {!searchActive && <NavBar type="onboarding" />}
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
