import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Animated, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useKnockoutBracket } from '@/hooks/useKnockoutBracket';
import CTAButton from './CTAButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUser } from '@contexts/UserProvider';
import BottomSheetModal from './BottomSheetModal';
import { Trophy, Calendar, Repeat, Users, Layers, Swords } from 'lucide-react-native';

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

const StatCard = ({ icon, label, value, wide }) => (
  <View className={`rounded-xl bg-bg-1 p-3 shadow-sm ${wide ? 'w-full' : 'min-w-[45%] flex-1'}`}>
    <View className="bg-brand/20 mb-2 h-9 w-9 items-center justify-center rounded-full">
      {icon}
    </View>
    <Text className="font-saira-medium text-text-2">{label}</Text>
    <Text className="mt-0.5 font-saira-bold text-xl text-text-1">{value}</Text>
  </View>
);

// ─── Slot ────────────────────────────────────────────────
const Slot = ({ name, isWinner, isBye, isHome, isFrames, score }) => {
  const isEmpty = !name && !isBye;

  const label = isBye ? 'BYE' : isEmpty ? 'TBD' : name;

  return (
    <View style={[styles.slot, isWinner && styles.slotWinner, isHome && styles.slotDivider]}>
      {isWinner && <View style={styles.winnerDot} />}

      <Text
        className="flex-1"
        numberOfLines={1}
        style={[
          styles.slotText,
          isWinner && styles.winnerText,
          isBye && styles.byeText,
          isEmpty && styles.emptyText,
        ]}>
        {label}
      </Text>
      {isFrames && (
        <Text
          style={[
            styles.slotText,
            isWinner && styles.winnerText,
            { marginLeft: 6, fontWeight: '600', fontSize: 14, width: 20, textAlign: 'center' },
          ]}>
          {score}
        </Text>
      )}
    </View>
  );
};

// ─── Match Card ──────────────────────────────────────────
const MatchCard = ({
  fixture,
  frames,
  teams,
  players,
  isFinal,
  animDelay,
  competitionInstanceId,
}) => {
  const router = useRouter();
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

  const getExists = (side) => {
    if (fixture.competitor_type === 'team') {
      return side === 'home' ? fixture.home_team : fixture.away_team;
    }

    return side === 'home' ? fixture.home_player : fixture.away_player;
  };

  const homeExists = getExists('home');
  const awayExists = getExists('away');

  const isPending = !homeExists && !awayExists;
  const homeBye = !homeExists && !isPending;
  const awayBye = !awayExists && !isPending;

  const isFrames = frames && frames.length > 0;

  const isApproved = fixture.approved;

  const homeScore = frames.filter((f) => f.winner_side === 'home').length;
  const awayScore = frames.filter((f) => f.winner_side === 'away').length;

  return (
    <Pressable
      className="shadow-sm"
      onPress={() => {
        router.push(`/competitions/${competitionInstanceId}/${fixture.id}`);
      }}
      disabled={isPending || homeBye || awayBye}
      style={{ opacity: isPending ? 0.7 : 1 }}>
      <Animated.View
        style={[
          styles.card,
          isFinal ? styles.finalCard : styles.normalCard,
          { opacity: fadeAnim },
        ]}>
        <Slot
          name={homeName}
          isWinner={fixture.winner_side === 'home' && isApproved}
          isBye={homeBye}
          isHome
          isFrames={isFrames}
          score={homeScore}
        />
        <Slot
          name={awayName}
          isWinner={fixture.winner_side === 'away' && isApproved}
          isBye={awayBye}
          isFrames={isFrames}
          score={awayScore}
        />
      </Animated.View>
    </Pressable>
  );
};

// ─── Main Component ──────────────────────────────────────
export default function KnockoutBracket({ competitionInstanceId }) {
  const [activeStage, setActiveStage] = useState(null);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const { data, isLoading, error } = useKnockoutBracket(competitionInstanceId);
  const { currentRole } = useUser();

  console.log('KnockoutBracket - data:', data);

  const stages = data?.stages ?? [];
  const fixtures = data?.fixtures ?? [];
  const teams = data?.teams ?? {};
  const players = data?.players ?? {};
  const frames = data?.frames ?? {};

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
    <>
      <ScrollView className="rounded-2xl bg-bg-2" horizontal>
        <View style={{ width: w, paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: 20 }}>
          {/* Headers */}
          <View className="mb-4 mt-4 flex-row">
            {stages.map((stage, ri) => (
              <View key={stage.id} style={{ width: ri < nR - 1 ? ROUND_W : COL_W }}>
                <Pressable
                  onPress={() => {
                    setActiveStage(stage);
                    setStageModalVisible(true);
                  }}
                  className="flex-row items-center justify-center gap-2">
                  <Ionicons
                    name={
                      currentRole?.role === 'admin'
                        ? 'settings-outline'
                        : 'information-circle-outline'
                    }
                    size={16}
                    color="#1f84d1"
                  />
                  <Text className="text-center font-saira-medium uppercase text-text-2">
                    {stage.name}
                  </Text>
                </Pressable>
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
                    frames={frames[fixture.id] ?? []}
                    teams={teams}
                    players={players}
                    isFinal={ri === nR - 1}
                    animDelay={(ri * 3 + mi) * 55}
                    competitionInstanceId={competitionInstanceId}
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <BottomSheetModal
        showModal={stageModalVisible}
        setShowModal={setStageModalVisible}
        title="Stage Details">
        <View className="flex-1 bg-bg-2 p-4">
          {/* Hero header */}
          <View className="mb-5 rounded-2xl bg-brand p-5">
            <Text className="font-saira-medium text-sm uppercase tracking-wider text-text-on-brand-2">
              Competition Stage
            </Text>
            <Text className="mt-1 font-saira-bold text-2xl text-white" numberOfLines={1}>
              {activeStage?.name}
            </Text>

            <View className="mt-4 flex-row items-center gap-2">
              {/* Stage type badge */}
              <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Layers size={14} color="#FFFFFF" />
                <Text className="font-saira-medium text-sm text-white">
                  {activeStage?.stage_type === 'round_robin'
                    ? 'Round Robin'
                    : activeStage?.stage_type === 'knockout'
                      ? 'Knockout'
                      : activeStage?.stage_type === 'league'
                        ? 'League'
                        : activeStage?.stage_type === 'group'
                          ? 'Groups Stage'
                          : activeStage?.stage_type === 'playoff'
                            ? 'Play-offs'
                            : activeStage?.stage_type}
                </Text>
              </View>

              {/* Status badge */}
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  activeStage?.status === 'completed'
                    ? 'bg-green-500/20'
                    : activeStage?.status === 'active'
                      ? 'bg-amber-400/20'
                      : 'bg-white/15'
                }`}>
                <View
                  className={`h-2 w-2 rounded-full ${
                    activeStage?.status === 'completed'
                      ? 'bg-green-400'
                      : activeStage?.status === 'active'
                        ? 'bg-amber-300'
                        : 'bg-slate-300'
                  }`}
                />
                <Text className="font-saira-medium text-sm text-white">
                  {activeStage?.status === 'completed'
                    ? 'Completed'
                    : activeStage?.status === 'active'
                      ? 'In Progress'
                      : 'Upcoming'}
                </Text>
              </View>
            </View>
          </View>

          {/* Stat cards grid */}
          <View className="flex-row flex-wrap gap-3">
            {activeStage?.best_of && (
              <StatCard
                icon={<Swords size={20} color="#D4AF37" />}
                label="Best of"
                value={`${activeStage.best_of} frames`}
              />
            )}

            {activeStage?.complete_by && (
              <StatCard
                icon={<Calendar size={20} color="#D4AF37" />}
                label="Complete By"
                value={new Date(activeStage.complete_by).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                wide
              />
            )}

            {activeStage?.stage_type === 'knockout' && (
              <StatCard
                icon={<Trophy size={20} color="#D4AF37" />}
                label="No. of Legs"
                value={activeStage?.legs ?? '–'}
              />
            )}

            {activeStage?.stage_type === 'round_robin' && (
              <StatCard
                icon={<Repeat size={20} color="#D4AF37" />}
                label="Round Robins"
                value={activeStage?.round_robins ?? '–'}
              />
            )}

            {activeStage?.stage_type === 'group' && (
              <>
                <StatCard
                  icon={<Layers size={20} color="#D4AF37" />}
                  label="No. of Groups"
                  value={activeStage?.groups ?? '–'}
                />
                <StatCard
                  icon={<Users size={20} color="#D4AF37" />}
                  label="Teams per Group"
                  value={activeStage?.teams_per_group ?? '–'}
                />
              </>
            )}
          </View>
        </View>
      </BottomSheetModal>
    </>
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
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#d97706',
    marginRight: 6,
  },

  slotText: {
    fontSize: 12,
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
