import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const EMPTY_STATS_FILTERS = {
  seasonIds: [],
  competitionIds: [],
  frameType: null, // 'singles' | 'doubles' | 'scotch-doubles'
  venue: null, // 'home' | 'away' | 'neutral'
};

export const countActiveFilters = (filters) =>
  (filters.seasonIds?.length ? 1 : 0) +
  (filters.competitionIds?.length ? 1 : 0) +
  (filters.frameType ? 1 : 0) +
  (filters.venue ? 1 : 0);

// Win rates match the existing per-type hooks: players are whole percentages,
// teams keep one decimal place.
const winRate = (won, played, entityType) => {
  if (!played) return 0;
  if (entityType === 'team') {
    const rounded = Math.round((won / played) * 1000) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  }
  return Math.round((won / played) * 100);
};

// The one stats query for the entity (player / team) stats page. With no
// filters it is the plain "everything" view (what free users get); Core and
// Pro users pass filters. Everything shares the ['EntityStats', type, id, ...]
// key prefix so a single invalidation (see AppRealtimeProvider) refreshes every
// filter combination for that entity.
export function useEntityStats(entityType, entityId, filters = EMPTY_STATS_FILTERS) {
  const seasonIds = [...(filters.seasonIds ?? [])].sort();
  const competitionIds = [...(filters.competitionIds ?? [])].sort();
  const frameType = filters.frameType ?? null;
  const venue = filters.venue ?? null;

  return useQuery({
    queryKey: [
      'EntityStats',
      entityType,
      entityId,
      { seasonIds, competitionIds, frameType, venue },
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entity_stats_filtered', {
        _entity_type: entityType,
        _entity_id: entityId,
        _season_ids: seasonIds.length ? seasonIds : null,
        _competition_ids: competitionIds.length ? competitionIds : null,
        _frame_type: frameType,
        _venue: venue,
      });
      if (error) throw error;
      return data;
    },
    select: (data) => {
      if (!data) return null;
      const t = data.totalStats ?? {};
      return {
        ...data,
        totalStats: {
          ...t,
          frame_win_percent: winRate(t.frames_won, t.frames_played, entityType),
          match_win_percent: winRate(t.matches_won, t.matches_played, entityType),
        },
      };
    },
    // Keep showing the previous numbers while a new filter combination loads.
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!entityId,
  });
}

// Seasons and competitions the entity has played in. Independent of the
// applied filters, so it's fetched once and cached for a long time; only
// enabled when someone can actually open the filter sheet.
export function useEntityFilterOptions(entityType, entityId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['EntityFilterOptions', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_entity_filter_options', {
        _entity_type: entityType,
        _entity_id: entityId,
      });
      if (error) throw error;
      return data ?? { seasons: [], competitions: [] };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!entityId && enabled,
  });
}

export default useEntityStats;
