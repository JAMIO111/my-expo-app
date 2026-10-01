import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import CustomTextInput from '@components/CustomTextInput';
import Avatar from '@components/Avatar';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import { assertRpcOk } from '@lib/rpc';

// Captains, vice captains and league admins search for a player and invite them to the team.
// All the rules (transfer window, mid-season transfers, admin approval) are applied by the
// invite_player_to_team function; the screen only shows its answer.
const InvitePlayer = () => {
  const { currentRole, player } = useUser();
  const queryClient = useQueryClient();
  const teamId = currentRole?.team?.id;
  const windowOpen = currentRole?.district?.transfer_window_open !== false;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [invitedIds, setInvitedIds] = useState([]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      const safe = term.replace(/[%,()]/g, ' ');
      const { data, error } = await supabase
        .from('Players')
        .select('id, first_name, surname, nickname, avatar_url, is_searching, is_private')
        .or(`first_name.ilike.%${safe}%,surname.ilike.%${safe}%,nickname.ilike.%${safe}%`)
        .neq('id', player?.id)
        .not('is_private', 'is', true)
        .not('is_deleted', 'is', true)
        .limit(25);
      setSearching(false);
      if (error) {
        Toast.show({ type: 'error', text1: 'Search failed', text2: error.message });
        return;
      }
      setResults(data ?? []);
    }, 350);
    return () => clearTimeout(handle);
  }, [query, player?.id]);

  const invite = async (target) => {
    setInvitingId(target.id);
    try {
      const { data, error } = await supabase.rpc('invite_player_to_team', {
        p_team_id: teamId,
        p_player_id: target.id,
      });
      assertRpcOk(data, error);
      setInvitedIds((prev) => [...prev, target.id]);
      await queryClient.invalidateQueries({ queryKey: ['PlayerInvitesAndRequests'] });
      Toast.show({
        type: 'success',
        text1: 'Invite sent',
        text2:
          data?.status === 'pending_both'
            ? `${target.first_name} needs to accept, and a league admin must approve the move.`
            : `${target.first_name} has been invited to join the team.`,
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err.title || 'Could not send invite',
        text2: err.message || 'Please try again.',
      });
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Invite a Player" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        {!windowOpen && (
          <View className="mb-4 rounded-2xl border border-theme-orange/50 bg-theme-orange/10 p-4">
            <Text className="font-saira-semibold text-base text-theme-orange">
              The transfer window is closed
            </Text>
            <Text className="font-saira text-sm text-text-2">
              Invites can be sent again once a league admin opens the window.
            </Text>
          </View>
        )}
        <CustomTextInput
          placeholder="Search by name"
          value={query}
          onChangeText={setQuery}
          leftIconName="search-outline"
          leftIconSize={20}
        />
        {searching && <ActivityIndicator className="mt-4" />}
        <FlatList
          className="mt-4"
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            query.trim().length >= 2 && !searching ? (
              <Text className="mt-6 text-center font-saira text-text-2">No players found</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const invited = invitedIds.includes(item.id);
            return (
              <View className="mb-2 flex-row items-center gap-3 rounded-2xl bg-bg-1 p-3">
                <Avatar player={item} size={44} borderRadius={8} />
                <View className="flex-1">
                  <Text className="font-saira-semibold text-base text-text-1">
                    {item.first_name} {item.surname}
                  </Text>
                  {item.is_searching ? (
                    <Text className="font-saira text-xs text-theme-green">Looking for a team</Text>
                  ) : null}
                </View>
                <Pressable
                  disabled={!windowOpen || invited || invitingId === item.id}
                  onPress={() => invite(item)}
                  className={`rounded-xl bg-brand px-4 py-2 ${!windowOpen || invited ? 'opacity-40' : ''}`}>
                  <Text className="font-saira-medium text-sm text-white">
                    {invited ? 'Invited' : invitingId === item.id ? 'Sending…' : 'Invite'}
                  </Text>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </SafeViewWrapper>
  );
};

export default InvitePlayer;
