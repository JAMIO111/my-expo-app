import { View, ScrollView, RefreshControl, Text, Pressable, Animated } from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useQueryClient } from '@tanstack/react-query';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import TeamInviteCard from '@components/TeamInviteCard';
import MyTeamCard from '@components/MyTeamCard';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import AnimatedSearchBar from '@components/AnimatedSearchBar';
import SearchResultsOverlay from '@components/SearchResultsOverlay';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';
import { useTeamPlayerActions } from '@hooks/useTeamPlayerActions';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, message, hint }) {
  return (
    <View className="w-full items-center gap-2 rounded-2xl bg-bg-grouped-2 px-6 py-8 shadow-sm">
      <Ionicons name={icon} size={36} color="green" />
      <Text className="mt-1 text-center font-saira-medium text-base text-text-2">{message}</Text>
      {hint && <Text className="text-center font-saira text-sm text-text-3">{hint}</Text>}
    </View>
  );
}

// ─── Recruiting team card ─────────────────────────────────────────────────────

function RecruitingTeamCard({ team, onRequest }) {
  return (
    <View className="w-full flex-row items-center gap-4 rounded-2xl border border-theme-gray-4 bg-bg-grouped-2 p-4">
      <View className="bg-brand/20 h-12 w-12 items-center justify-center rounded-xl">
        <Ionicons name="people" size={22} color="#D4AF37" />
      </View>
      <View className="flex-1">
        <Text className="font-saira-semibold text-base text-text-1">{team.display_name}</Text>
        <Text className="font-saira text-sm text-text-2">
          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
          {team.district?.name ? ` · ${team.district.name}` : ''}
        </Text>
      </View>
      <Pressable
        onPress={() => onRequest(team)}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        className="rounded-xl bg-brand px-4 py-2">
        <Text className="font-saira-semibold text-sm text-white">Request</Text>
      </Pressable>
    </View>
  );
}

// ─── Floating Tab Bar ─────────────────────────────────────────────────────────

function FloatingTabBar({ tabs, activeTab, onTabPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ bottom: insets.bottom, left: 24, right: 24 }}
      className="absolute z-10 flex-row items-center justify-around rounded-3xl bg-brand p-2 shadow-xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, flex: 1 })}
            className="items-center justify-center">
            <View
              className={`w-full items-center gap-1 rounded-xl py-2 ${isActive ? 'bg-brand/15' : ''}`}>
              <View className="relative">
                <Ionicons
                  name={isActive ? tab.iconActive : tab.icon}
                  size={24}
                  color={isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)'}
                />
                {tab.badge > 0 && (
                  <View
                    style={{ height: 16, minWidth: 16, position: 'absolute', top: -6, right: -8 }}
                    className="items-center justify-center rounded-full bg-theme-red px-1">
                    <Text className="font-saira-medium text-[10px] text-white">{tab.badge}</Text>
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
        <EmptyState
          icon="people-outline"
          message="You're not in any teams yet"
          hint="Browse the Explore tab to find and join a team"
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

function InvitesTab({ invites, requests, onAccept, onDecline, onRevoke }) {
  const hasContent = invites.length > 0 || requests.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-bg-grouped-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 16 }}>
      {!hasContent && (
        <EmptyState
          icon="mail-outline"
          message="No invites or requests"
          hint="When you request to join, or get invited to a team, it'll appear here"
        />
      )}

      {invites.length > 0 && (
        <View className="gap-3">
          <View className="flex-row items-center gap-2 px-1">
            <Ionicons name="mail" size={16} color="#D4AF37" />
            <Text className="font-saira-medium text-sm uppercase tracking-widest text-text-2">
              Invites
            </Text>
            <View className="ml-1 h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5">
              <Text className="font-saira-semibold text-xs text-white">{invites.length}</Text>
            </View>
          </View>
          {invites.map((invite) => (
            <TeamInviteCard
              key={invite.id}
              type="invite"
              invite={invite}
              onAccept={() => onAccept(invite)}
              onDecline={() => onDecline(invite)}
            />
          ))}
        </View>
      )}

      {requests.length > 0 && (
        <View className="gap-3">
          <View className="flex-row items-center gap-2 px-1">
            <Ionicons name="time-outline" size={16} color="#D4AF37" />
            <Text className="font-saira-medium text-sm uppercase tracking-widest text-text-2">
              Pending Requests
            </Text>
          </View>
          {requests.map((request) => (
            <TeamInviteCard
              key={request.id}
              type="request"
              invite={request}
              onDecline={() => onRevoke(request)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Tab: Explore / Recruiting ────────────────────────────────────────────────

function ExploreTab({
  searchActive,
  searchQuery,
  setSearchActive,
  setSearchQuery,
  sendJoinRequest,
  onRequest,
}) {
  // Stub — replace with real hook
  const recruitingTeams = [];

  return (
    <>
      <SearchResultsOverlay
        searchActive={searchActive}
        searchQuery={searchQuery}
        sendJoinRequest={sendJoinRequest}
      />
      {!searchActive && (
        <ScrollView
          className="flex-1 bg-bg-grouped-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}>
          <View className="flex-row items-center gap-2 px-1">
            <Ionicons name="megaphone-outline" size={16} color="#D4AF37" />
            <Text className="font-saira-semibold text-sm uppercase tracking-widest text-text-2">
              Looking for Players
            </Text>
          </View>
          {recruitingTeams.length === 0 ? (
            <EmptyState
              icon="megaphone-outline"
              message="No teams are recruiting right now"
              hint="Check back later or search for a specific team above"
            />
          ) : (
            recruitingTeams.map((team) => (
              <RecruitingTeamCard key={team.id} team={team} onRequest={onRequest} />
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
  const { user, player, roles, currentRole } = useUser();
  const { leaveTeam, sendJoinRequest, revokeRequest } = useTeamPlayerActions();
  const { acceptInvite } = useTeamPlayerActions(currentRole?.team?.id, {});
  const { data: playerInvitesAndRequests } = usePlayerInvitesAndRequests({ playerId: player.id });

  const [activeTab, setActiveTab] = useState('my-teams');
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const pendingStatuses = ['pending_both', 'pending_captain', 'pending_admin', 'requested'];
  const invites = playerInvitesAndRequests?.filter((i) => i.status === 'invited') ?? [];
  const requests =
    playerInvitesAndRequests?.filter((i) => pendingStatuses.includes(i.status)) ?? [];
  const inviteBadge = invites.length + requests.length;

  const tabs = [
    {
      key: 'my-teams',
      label: 'My Teams',
      icon: 'people-outline',
      iconActive: 'people',
      badge: 0,
    },
    {
      key: 'invites',
      label: 'Requests',
      icon: 'mail-outline',
      iconActive: 'mail',
      badge: inviteBadge,
    },
    {
      key: 'explore',
      label: 'Explore',
      icon: 'search-outline',
      iconActive: 'search',
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

  const handleJoinRequest = (team) => {
    openConfirm({
      title: 'Request to Join?',
      message: `Send a join request to ${team.display_name}?`,
      topButtonText: 'Send Request',
      bottomButtonText: 'Cancel',
      topButtonType: 'success',
      bottomButtonType: 'default',
      topButtonFn: () => {
        sendJoinRequest.mutate({ teamId: team.id, playerId: player.id });
        setModalVisible(false);
      },
      bottomButtonFn: () => setModalVisible(false),
    });
  };

  return (
    <>
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand" bottomColor="bg-brand">
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useTopInset={true} useBottomInset={false}>
                <CustomHeader title="Transfer Hub" showBack={true} rightIcon="clipboard-outline" />
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
        <View style={{ flex: 1, marginTop: activeTab === 'explore' ? 126 : 56 }}>
          {activeTab === 'my-teams' && (
            <MyTeamsTab roles={roles} currentRole={currentRole} onLeave={handleLeaveTeam} />
          )}
          {activeTab === 'invites' && (
            <InvitesTab
              invites={invites}
              requests={requests}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onRevoke={handleRevoke}
            />
          )}
          {activeTab === 'explore' && (
            <ExploreTab
              searchActive={searchActive}
              searchQuery={searchQuery}
              setSearchActive={setSearchActive}
              setSearchQuery={setSearchQuery}
              sendJoinRequest={sendJoinRequest}
              onRequest={handleJoinRequest}
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
