import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Animated, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useKnockoutBracket } from '@/hooks/useKnockoutBracket';

// ─── Layout constants ─────────────────────────────────────
const CARD_H = 68;
const CARD_GAP = 12;
const S = CARD_H + CARD_GAP;

const COL_W = 188;
const COL_GAP = 52;
const ROUND_W = COL_W + COL_GAP;

// ─── Helpers ──────────────────────────────────────────────
const getCenterY = (roundIdx, matchIdx) => S * Math.pow(2, roundIdx) * (matchIdx + 0.5);

const getTotalH = (n0) => n0 * S;
const getTotalW = (n) => n * ROUND_W - COL_GAP;

// ─── Tree builder ─────────────────────────────────────────
function buildRounds(stages, fixtures) {
  if (!stages.length || !fixtures.length) return [];

  const stageIdx = Object.fromEntries(stages.map((s, i) => [s.id, i]));
  const childrenOf = {};

  fixtures.forEach((f) => {
    if (f.parent_fixture_id) {
      (childrenOf[f.parent_fixture_id] ??= []).push(f);
    }
  });

  const lastStage = stages[stages.length - 1];
  const root = fixtures.find((f) => f.stage_id === lastStage.id);
  if (!root) return [];

  const rounds = stages.map(() => []);

  function dfs(node) {
    rounds[stageIdx[node.stage_id]].push(node);

    (childrenOf[node.id] ?? []).sort((a) => (a.parent_slot === 'home' ? -1 : 1)).forEach(dfs);
  }

  dfs(root);
  return rounds;
}

// ─── Slot ────────────────────────────────────────────────
const Slot = ({ name, isWinner, isBye, isHome }) => {
  const isEmpty = !name && !isBye;

  const label = isBye ? 'BYE' : isEmpty ? 'TBD' : name;

  return (
    <View style={[styles.slot, isWinner && styles.slotWinner, isHome && styles.slotDivider]}>
      {isWinner && <View style={styles.winnerDot} />}

      <Text
        numberOfLines={1}
        style={[
          styles.slotText,
          isWinner && styles.winnerText,
          isBye && styles.byeText,
          isEmpty && styles.emptyText,
        ]}>
        {label}
      </Text>
    </View>
  );
};

// ─── Match Card ──────────────────────────────────────────
const MatchCard = ({ fixture, teams, players, isFinal, animDelay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getParticipantName = (fixture, side) => {
    const id =
      side === 'home'
        ? fixture.home_team || fixture.home_player
        : fixture.away_team || fixture.away_player;

    if (!id) return null;

    return teams[id] || players[id] || null;
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      delay: animDelay,
      useNativeDriver: true,
    }).start();
  }, []);

  const homeName = getParticipantName(fixture, 'home');
  const awayName = getParticipantName(fixture, 'away');

  const isPending = !fixture.home_team && !fixture.away_team;
  const homeBye = !fixture.home_team && !fixture.home_player && !isPending;
  const awayBye = !fixture.away_team && !fixture.away_player && !isPending;

  return (
    <Pressable disabled={isPending || homeBye || awayBye} style={{ opacity: isPending ? 0.7 : 1 }}>
      <Animated.View
        style={[
          styles.card,
          isFinal ? styles.finalCard : styles.normalCard,
          { opacity: fadeAnim },
        ]}>
        <Slot name={homeName} isWinner={fixture.winner_side === 'home'} isBye={homeBye} isHome />
        <Slot name={awayName} isWinner={fixture.winner_side === 'away'} isBye={awayBye} />
      </Animated.View>
    </Pressable>
  );
};

// ─── Main Component ──────────────────────────────────────
export default function KnockoutBracket({ competitionInstanceId }) {
  const { data, isLoading, error } = useKnockoutBracket(competitionInstanceId);
  console.log('KnockoutBracket - data:', data);

  const stages = data?.stages ?? [];
  const fixtures = data?.fixtures ?? [];
  const teams = data?.teams ?? {};
  const players = data?.players ?? {};

  const rounds = useMemo(() => {
    if (!stages.length || !fixtures.length) return [];
    return buildRounds(stages, fixtures);
  }, [stages, fixtures]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center rounded-2xl bg-bg-2 p-8">
        <Text className="text-center font-saira-medium text-text-2">Loading bracket…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center rounded-2xl bg-bg-2 p-8">
        <Text className="text-center font-saira-medium text-text-2">Failed to load bracket.</Text>
      </View>
    );
  }

  if (!rounds.length) {
    return (
      <View className="flex-1 items-center justify-center rounded-2xl bg-bg-2 p-8">
        <Text className="text-center font-saira-medium text-text-2">No bracket data found.</Text>
      </View>
    );
  }

  const nR = rounds.length;
  const n0 = rounds[0]?.length ?? 1;

  const HORIZONTAL_PADDING = COL_GAP / 2;

  const h = getTotalH(n0);
  const w = getTotalW(nR) + 2 * HORIZONTAL_PADDING;

  return (
    <ScrollView className="rounded-2xl bg-bg-2" horizontal>
      <View style={{ width: w, paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 20 }}>
        {/* Headers */}
        <View className="mb-4 mt-4 flex-row">
          {stages.map((stage, ri) => (
            <View key={stage.id} style={{ width: ri < nR - 1 ? ROUND_W : COL_W }}>
              <Text className="pr-8 text-center font-saira-medium text-sm uppercase text-text-2">
                {stage.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Canvas */}
        <View style={{ width: w, height: h }}>
          {/* Lines */}
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            {rounds.map((roundFixtures, ri) => {
              if (ri === nR - 1) return null;

              return roundFixtures.map((fixture, mi) => {
                const x1 = ri * ROUND_W + COL_W;
                const y1 = getCenterY(ri, mi);
                const x2 = (ri + 1) * ROUND_W;
                const y2 = getCenterY(ri + 1, Math.floor(mi / 2));
                const midX = x1 + COL_GAP / 2;

                return (
                  <Path
                    key={fixture.id}
                    d={`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`}
                    stroke={fixture.winner_side ? '#f59e0b' : '#000000'}
                    strokeWidth={fixture.winner_side ? 1.5 : 0.5}
                    fill="none"
                  />
                );
              });
            })}
          </Svg>

          {/* Cards */}
          {rounds.map((roundFixtures, ri) =>
            roundFixtures.map((fixture, mi) => (
              <View
                key={fixture.id}
                style={{
                  position: 'absolute',
                  left: ri * ROUND_W,
                  top: getCenterY(ri, mi) - CARD_H / 2,
                }}>
                <MatchCard
                  fixture={fixture}
                  teams={teams}
                  players={players}
                  isFinal={ri === nR - 1}
                  animDelay={(ri * 3 + mi) * 55}
                />
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  loading: {
    textAlign: 'center',
    marginTop: 40,
    color: '#9ca3af',
  },

  card: {
    width: COL_W,
    height: CARD_H,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  normalCard: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },

  finalCard: {
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },

  slot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  slotDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },

  slotWinner: {
    backgroundColor: '#fef3c7',
  },

  winnerDot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#d97706',
    marginRight: 6,
  },

  slotText: {
    fontSize: 11,
    color: '#111827',
    flexShrink: 1,
  },

  winnerText: {
    fontWeight: '600',
    color: '#92400e',
  },

  byeText: {
    color: '#9ca3af',
  },

  emptyText: {
    color: '#b5b7ba',
  },
});
