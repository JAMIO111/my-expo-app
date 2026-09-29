import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabase';

const preferencesKey = (playerId) => ['NotificationPreferences', playerId];

// The signed-in player's effective notification settings: every category with
// its current in-app / push value (their override, else the category default)
// and whether either channel is locked on.
export function useNotificationPreferences(playerId) {
  return useQuery({
    queryKey: preferencesKey(playerId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_notification_preferences');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!playerId,
  });
}

// Turns one channel ('in_app' | 'push') of one category on or off. Optimistic:
// the switch flips immediately and flips back with an error toast on failure.
export function useSetNotificationPreference(playerId) {
  const queryClient = useQueryClient();

  const patchCategory = (category, patch) =>
    queryClient.setQueryData(preferencesKey(playerId), (old) =>
      old?.map((item) => (item.key === category ? { ...item, ...patch } : item))
    );

  return useMutation({
    mutationFn: async ({ category, channel, enabled }) => {
      const { data, error } = await supabase.rpc('set_notification_preference', {
        _category: category,
        _channel: channel,
        _enabled: enabled,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async ({ category, channel, enabled }) => {
      await queryClient.cancelQueries({ queryKey: preferencesKey(playerId) });
      patchCategory(category, { [channel]: enabled });
    },
    onError: (error, { category, channel, enabled }) => {
      patchCategory(category, { [channel]: !enabled });
      Toast.show({
        type: 'error',
        text1: "Couldn't save your notification settings",
        text2: error.message,
      });
    },
    onSuccess: (row) => {
      if (row?.key) patchCategory(row.key, row);
    },
  });
}
