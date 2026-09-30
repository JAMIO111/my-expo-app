import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import Avatar from '@components/Avatar';
import { useUser } from '@contexts/UserProvider';
import { useTheme } from '@contexts/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { useAdminsByDistrict } from '@hooks/useAdminsByDistrict';
import { useDistrictAdminInvites } from '@hooks/useDistrictAdminInvites';
import { handleFixtureError } from '@lib/fixtureActionErrors';

// An admin invites another player to become an admin of the league. The player gets a
// notification and accepts or declines it under Settings.
const InviteAdmin = () => {
  const queryClient = useQueryClient();
  const { currentRole } = useUser();
  const { colors: themeColors } = useTheme();
  const districtId = currentRole?.district?.id;
  const { data: admins } = useAdminsByDistrict(districtId);
  const { data: pending } = useDistrictAdminInvites(districtId, currentRole?.type === 'admin');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const excludedIds = useMemo(
    () =>
      new Set([
        ...(admins ?? []).map((a) => a.Players?.id ?? a.user_id),
        ...(pending ?? []).map((i) => i.player.id),
      ]),
    [admins, pending]
  );

  useEffect(() => {
    const term = query.trim().replace(/[%,()]/g, '');
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data, error } = await supabase
        .from('Players')
        .select('id, first_name, surname, nickname, avatar_url')
        .or(`first_name.ilike.%${term}%,surname.ilike.%${term}%,nickname.ilike.%${term}%`)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(20);
      if (!cancelled) {
        setResults(error ? [] : (data ?? []));
        setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const invite = async (target) => {
    setBusyId(target.id);
    try {
      const { error } = await supabase.rpc('invite_district_admin', {
        p_district_id: districtId,
        p_player_id: target.id,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['DistrictAdminInvites', districtId] });
      Toast.show({
        type: 'success',
        text1: 'Invitation sent',
        text2: `${target.first_name} ${target.surname} has been invited to be an admin.`,
      });
    } catch (error) {
      console.error('Error inviting admin:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Could not send invitation',
        fallbackMessage: 'Please try again.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (inviteRow) => {
    setBusyId(inviteRow.id);
    try {
      const { error } = await supabase.rpc('revoke_district_admin_invite', {
        p_invite_id: inviteRow.id,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['DistrictAdminInvites', districtId] });
      Toast.show({ type: 'success', text1: 'Invitation withdrawn' });
    } catch (error) {
      console.error('Error withdrawing invite:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Could not withdraw invitation',
        fallbackMessage: 'Please try again.',
      });
      await queryClient.invalidateQueries({ queryKey: ['DistrictAdminInvites', districtId] });
    } finally {
      setBusyId(null);
    }
  };

  const Row = ({ person, label, onPress, danger, id }) => (
    <View className="flex-row items-center gap-3 rounded-2xl border border-theme-gray-4 bg-bg-3 p-3">
      <Avatar size={40} borderRadius={20} player={person} />
      <Text numberOfLines={1} className="flex-1 font-saira-medium text-lg text-text-1">
        {`${person.first_name} ${person.surname}`}
      </Text>
      <Pressable
        disabled={!!busyId}
        onPress={onPress}
        className={`rounded-xl px-4 py-2 ${danger ? 'bg-theme-red' : 'bg-brand'} ${busyId ? 'opacity-50' : ''}`}>
        {busyId === id ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="font-saira-semibold text-white">{label}</Text>
        )}
      </Pressable>
    </View>
  );

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Invite an Admin" />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        className="mt-16 flex-1 bg-bg-grouped-1 p-5"
        contentContainerStyle={{ gap: 12, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled">
        <Text className="font-saira text-base text-text-2">
          Search for a player by name. They will get a notification and become an admin of{' '}
          {currentRole?.district?.name ?? 'this league'} once they accept.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search players"
          placeholderTextColor={themeColors.icon}
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-2xl border border-theme-gray-4 bg-bg-3 px-4 py-3 font-saira text-lg text-text-1"
        />
        {searching ? <ActivityIndicator color={themeColors.icon} /> : null}
        {results
          .filter((p) => !excludedIds.has(p.id))
          .map((p) => (
            <Row key={p.id} id={p.id} person={p} label="Invite" onPress={() => invite(p)} />
          ))}
        {query.trim().length >= 2 && !searching && results.length === 0 ? (
          <Text className="text-center font-saira text-base text-text-2">No players found.</Text>
        ) : null}

        {pending && pending.length > 0 ? (
          <>
            <Text className="mt-4 font-saira-semibold text-lg text-text-1">Pending invitations</Text>
            {pending.map((i) => (
              <Row
                key={i.id}
                id={i.id}
                person={i.player}
                label="Withdraw"
                danger
                onPress={() => withdraw(i)}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default InviteAdmin;
