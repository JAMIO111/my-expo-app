import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@lib/supabase';
import { useUser } from '@contexts/UserProvider';
import { useBadgeUnlock } from '@contexts/BadgeUnlockProvider';

/**
 * Fetches unseen badges for the current player, subscribes to realtime
 * inserts on "BadgesUnlocked", and pushes anything unseen into the global
 * BadgeUnlockModal. Mount this ONCE, inside BadgeUnlockProvider but above
 * your screens (e.g. in app/_layout.tsx or a top-level AppShell component).
 *
 * Assumes a "BadgesUnlocked" table roughly like:
 *   id, player_id, badge_id, unlocked_at, seen (bool), seen_at
 * joined against a "Badges" table with title/description/icon/tier.
 * Adjust the select() below to match your actual schema.
 */
export function useUnseenBadgesTrigger() {
  // no return value needed — this hook is fire-and-forget, mount it once
  const { player } = useUser();
  const queryClient = useQueryClient();
  const { showBadges } = useBadgeUnlock();

  const { data: unseenBadges } = useQuery({
    queryKey: ['unseen-badges', player?.id],
    enabled: !!player?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('BadgesUnlocked')
        .select(
          `
          id,
          unlocked_at,
          tier,
          Badges (
            id,
            key,
            meta_data
          )
        `
        )
        .eq('player_id', player?.id)
        .eq('seen', false)
        .order('unlocked_at', { ascending: true });

      console.log('PLAYER ID:', player?.id);
      console.log('UNSEEN BADGES DATA:', data);
      console.log('UNSEEN BADGES ERROR:', error);

      if (error) throw error;
      return data;
    },
  });

  const markSeen = useMutation({
    mutationFn: async (playerBadgeIds) => {
      const { data, error } = await supabase.rpc('mark_badges_seen', {
        _player_badge_ids: playerBadgeIds,
      });
      if (error) throw error;
      return data;
    },
  });

  // Realtime: any insert into BadgesUnlocked for this player invalidates
  // the query above, which refetches and re-triggers the effect below.
  useEffect(() => {
    if (!player?.id) return;

    const channel = supabase
      .channel(`player-badges-${player?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'BadgesUnlocked',
          filter: `player_id=eq.${player?.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unseen-badges', player?.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [player?.id, queryClient]);

  // Whenever the unseen list changes and has items, hand them to the modal
  // AND mark them seen immediately. "Seen" means "delivered to the client",
  // not "user finished looking" — this is what keeps the query, the realtime
  // listener, and the modal from fighting each other or double-firing.
  useEffect(() => {
    if (unseenBadges && unseenBadges.length > 0) {
      showBadges(
        unseenBadges.map((pb) => {
          const badgeTier = pb.tier;

          const tierData = Array.isArray(pb.Badges?.meta_data)
            ? pb.Badges.meta_data.find((tier) => Number(tier.tier) === Number(badgeTier))
            : null;

          return {
            id: pb.id,
            title: tierData?.title ?? '',
            description: tierData?.description ?? '',
            icon: tierData?.icon ? { uri: tierData.icon } : undefined,
            xp: tierData?.xp ?? 0,
            tier: badgeTier,
          };
        })
      );

      markSeen.mutate(unseenBadges.map((pb) => pb.id));
      // Optimistically clear so a re-render (or a stray realtime event for
      // an unrelated insert) doesn't re-trigger the same batch.
      queryClient.setQueryData(['unseen-badges', player?.id], []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unseenBadges]);
}
