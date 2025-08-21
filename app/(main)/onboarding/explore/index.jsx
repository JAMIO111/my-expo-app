import { Text, View, ScrollView, RefreshControl } from 'react-native';
import NavBar from '@components/NavBar2';
import { useState, useCallback } from 'react';
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

const Home = () => {
  const { client: supabase } = useSupabaseClient();
  const queryClient = useQueryClient();
  const { player, roles } = useUser();
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: playerInvitesAndRequests } = usePlayerInvitesAndRequests({ playerId: player.id });
  console.log('Player Invites and Requests:', playerInvitesAndRequests);

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
      <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
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
              </SafeViewWrapper>
            ),
          }}
        />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#fff']} // Android spinner color
              tintColor="#fff" // iOS spinner color
            />
          }
          className="flex-1 bg-bg-grouped-1 p-4"
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}>
          {playerInvitesAndRequests?.length > 0 && (
            <View className="mb-2 w-full">
              <Heading text="Invites" />
              {playerInvitesAndRequests.map((invite) => (
                <TeamInviteCard
                  key={invite.id}
                  invite={invite}
                  onAccept={() => handleAccept(invite)}
                  onDecline={() => handleDecline(invite)}
                />
              ))}
            </View>
          )}

          <View className="w-full pb-16">
            <Heading text="My Teams" />
            <View className="w-full gap-5">
              {roles
                .filter((role) => role.type !== 'admin')
                .map((role) => (
                  <MyTeamCard key={role.id} role={role} />
                ))}
            </View>
          </View>
        </ScrollView>
        <NavBar type="onboarding" />
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
