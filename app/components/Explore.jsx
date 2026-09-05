import { View, ScrollView, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import MyTeamCard from '@components/MyTeamCard';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import AnimatedSearchBar from '@components/AnimatedSearchBar';
import SearchResultsOverlay from '@components/SearchResultsOverlay';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import { useTeamPlayerActions } from '@hooks/useTeamPlayerActions';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardCheck, Mail, Users, MegaphoneOff, Megaphone, Search } from 'lucide-react-native';
import EmptyStateCard from '@components/EmptyStateCard';
import Heading from './Heading';
import { useTeamsRecruiting } from '@hooks/useTeamsRecruiting';
import TeamLogo from './TeamLogo';
import TicketCarousel from './TicketCarousel';

// ─── Recruiting team card ─────────────────────────────────────────────────────

function RecruitingTeamCard({ team, sendJoinRequest }) {
  return (
    <View className="w-full flex-row items-center gap-4 rounded-2xl border border-theme-gray-5 bg-bg-1 p-4">
      <View className="bg-brand/20 h-12 w-12 items-center justify-center rounded-xl">
        <TeamLogo {...team?.crest} size={40} />
      </View>
      <View className="flex-1">
        <Text className="font-tektur-semibold text-base text-text-1">{team.display_name}</Text>
        <Text className="font-tektur text-sm text-text-2">
          {team.division_name ? `${team.division_name} · ` : ''}
          {team.member_count} player{team.member_count !== 1 ? 's' : ''}
        </Text>
      </View>
      <Pressable
        onPress={() => sendJoinRequest(team)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        className="rounded-xl bg-brand px-3 py-3">
        <Text className="font-tektur-medium text-sm text-white">Request to join</Text>
      </Pressable>
    </View>
  );
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────

function FloatingTabBar({ tabs, activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ bottom: insets.bottom, left: 24, right: 24, borderRadius: 28 }}
      className="absolute z-10 flex-row items-center justify-around bg-brand p-2 shadow-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, flex: 1 })}
            className="items-center justify-center">
            <View
              className={`w-full items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-brand/15' : ''}`}>
              <View className="relative">
                <Icon
                  size={24}
                  color={isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {tab.badge > 0 && (
                  <View
                    style={{ height: 16, minWidth: 16, position: 'absolute', top: -6, right: -8 }}
                    className="items-center justify-center rounded-full bg-theme-red px-1">
                    <Text className="font-tektur-medium text-[10px] text-white">{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-sm"
                style={{
                  fontFamily: isActive ? 'Saira_500Medium' : 'Saira_400Regular',
                  color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)',
                }}>
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Tab: My Teams ────────────────────────────────────────────────────────────

function MyTeamsTab({ roles, currentRole, onLeave }) {
  const myTeams = roles?.filter((r) => r.type !== 'admin') ?? [];

  return (
    <ScrollView
      className="flex-1 bg-bg-grouped-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}>
      {myTeams.length === 0 ? (
        <EmptyStateCard
          backgroundColor="bg-bg-1"
          icon={Users}
          title="Oops, you're not in any teams yet"
          message="Browse the Explore tab to find and join a team"
        />
      ) : (
        myTeams.map((role) => (
          <MyTeamCard
            key={role.id}
            active={currentRole?.team?.id === role?.team?.id}
            onPress={() => onLeave(role)}
            role={role}
          />
        ))
      )}
    </ScrollView>
  );
}

// ─── Tab: Invites & Requests ──────────────────────────────────────────────────

function InvitesTab({ invitesAndRequests }) {
  const hasContent = invitesAndRequests?.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-bg-grouped-1"
      contentContainerStyle={{ padding: 16, paddingHorizontal: 0, paddingBottom: 100, gap: 16 }}>
      <Heading
        text="Pending Invites & Requests"
        notificationCount={invitesAndRequests?.length ?? 0}
        className="px-4 pb-2"
      />
      {!hasContent ? (
        <EmptyStateCard
          backgroundColor="bg-bg-1"
          icon={Mail}
          title="No invites or requests"
          message="When you request to join, or get invited to a team, it'll appear here"
        />
      ) : (
        <TicketCarousel tickets={invitesAndRequests} />
      )}
    </ScrollView>
  );
}

// ─── Tab: Explore / Recruiting ────────────────────────────────────────────────

function ExploreTab({
  recruitingTeams,
  isRecruitingLoading,
  searchActive,
  searchQuery,
  setSearchActive,
  setSearchQuery,
  handleJoinRequest,
  handleJoinRequestDirect,
}) {
  return (
    <>
      <SearchResultsOverlay
        searchActive={searchActive}
        searchQuery={searchQuery}
        sendJoinRequest={handleJoinRequestDirect}
      />
      {!searchActive && (
        <ScrollView
          className="flex-1 bg-bg-grouped-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}>
          <Heading
            text="Teams Actively Recruiting"
            icon={<Megaphone size={16} color="#D4AF37" />}
          />
          {isRecruitingLoading ? (
            <EmptyStateCard
              loading={true}
              backgroundColor="bg-bg-1"
              title="Loading recruiting teams..."
              message="Please wait while we fetch the latest teams actively recruiting."
            />
          ) : recruitingTeams.length === 0 ? (
            <EmptyStateCard
              backgroundColor="bg-bg-1"
              icon={MegaphoneOff}
              title="Oops, no teams are actively recruiting right now"
              message="Check back later or search for a specific team above"
            />
          ) : (
            recruitingTeams.map((team) => (
              <RecruitingTeamCard key={team.id} team={team} sendJoinRequest={handleJoinRequest} />
            ))
          )}
        </ScrollView>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ExploreComponent = () => {
  const queryClient = useQueryClient();
  const { player, roles, currentRole, refetch } = useUser();
  const { acceptInvite } = useTeamPlayerActions(currentRole?.team?.id, {});
  const { data: playerInvitesAndRequests } = usePlayerInvitesAndRequests({ playerId: player.id });
  const { data: recruitingTeams, isLoading: isRecruitingLoading } = useTeamsRecruiting(
    currentRole?.district?.id
  );
  const [activeTab, setActiveTab] = useState('my-teams');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  console.log('Player Invites and Requests:', playerInvitesAndRequests);

  const validRecruitingTeams = recruitingTeams?.filter(
    (team) => team?.id !== currentRole?.team?.id
  );

  console.log('Valid Recruiting Teams:', validRecruitingTeams);

  const validInvitesAndRequests = playerInvitesAndRequests?.filter(
    (invite) => invite.team.parent_team_id === null
  );

  const inviteBadge = validInvitesAndRequests?.length ?? 0;

  const tabs = [
    {
      key: 'my-teams',
      label: 'My Teams',
      icon: Users,
      badge: 0,
    },
    {
      key: 'invites',
      label: 'Invites & Requests',
      icon: Mail,
      badge: inviteBadge,
    },
    {
      key: 'explore',
      label: 'Explore',
      icon: Search,
      badge: 0,
    },
  ];

  const openConfirm = (config) => {
    setConfirmConfig(config);
    setModalVisible(true);
  };

  const handleAccept = (invite) => {
    openConfirm({
      title: 'Accept Invite?',
      message: `Do you want to accept the invite and join ${invite.team.display_name}?`,
      topButtonText: 'Join Team',
      bottomButtonText: 'Go Back',
      topButtonType: 'success',
      bottomButtonType: 'default',
      topButtonFn: async () => {
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

  const requestPlayerJoinTeam = async (team) => {
    try {
      const { data, error } = await supabase.rpc('request_player_join_team', {
        p_team_id: team?.id,
      });
      if (error) throw error;
      if (data.success === false) {
        const rpcError = new Error(data.message || 'Failed to remove player from the team.');
        rpcError.title = data.title;
        rpcError.code = data.code;
        throw rpcError;
      }
      await queryClient.invalidateQueries(['PlayerProfile', player?.id]);
      await queryClient.invalidateQueries(['PlayerInvitesAndRequests', { playerId: player?.id }]);
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Join request sent successfully.',
        text2: `Your request to join ${team?.display_name} has been sent successfully.`,
      });
      setActiveTab('requests');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error.title || 'Failed to send join request',
        text2: error.message || 'An error occurred while sending the player join request.',
      });
    }
  };

  const handleJoinRequest = (team) => {
    openConfirm({
      title: 'Request to Join?',
      message: `Send a request to join ${team.display_name}?`,
      topButtonText: 'Send Request',
      bottomButtonText: 'Cancel',
      topButtonType: 'success',
      bottomButtonType: 'default',
      topButtonFn: () => {
        requestPlayerJoinTeam(team);
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  console.log(recruitingTeams);

  return (
    <>
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand" bottomColor="bg-brand">
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useTopInset={true} useBottomInset={false}>
                <CustomHeader title="Transfer Hub" showBack={true} rightIcon={ClipboardCheck} />
                {activeTab === 'explore' && (
                  <AnimatedSearchBar
                    searchActive={searchActive}
                    setSearchActive={setSearchActive}
                    onDebouncedChange={setSearchQuery}
                  />
                )}
              </SafeViewWrapper>
            ),
          }}
        />

        {/* Tab content */}
        <View style={{ flex: 1, marginTop: activeTab === 'explore' ? 124 : 56 }}>
          {activeTab === 'my-teams' && (
            <MyTeamsTab roles={roles} currentRole={currentRole} onLeave={handleLeaveTeam} />
          )}
          {activeTab === 'invites' && <InvitesTab invitesAndRequests={validInvitesAndRequests} />}
          {activeTab === 'explore' && (
            <ExploreTab
              recruitingTeams={validRecruitingTeams}
              isRecruitingLoading={isRecruitingLoading}
              searchActive={searchActive}
              searchQuery={searchQuery}
              setSearchActive={setSearchActive}
              setSearchQuery={setSearchQuery}
              handleJoinRequest={handleJoinRequest}
              handleJoinRequestDirect={requestPlayerJoinTeam}
            />
          )}
        </View>

        {/* Floating tab bar */}
        <FloatingTabBar tabs={tabs} activeTab={activeTab} onTabPress={setActiveTab} />
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

export default ExploreComponent;
