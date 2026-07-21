import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  Platform,
  UIManager,
  StyleSheet,
  Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import colors from '@lib/colors';
import { Ionicons } from '@expo/vector-icons';
import CTAButton from '@components/CTAButton';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Toast from 'react-native-toast-message';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import { useColorScheme } from 'react-native';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useSaveMatchResults } from '@hooks/useSaveMatchResults';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import SlidingTabButton from '@components/SlidingTabButton';
import { useActiveFrame } from '@hooks/useActiveFrame';
import LoadingScreen from '@components/LoadingScreen';
import ForfeitRequestModal from '@components/ForfeitRequestModal';
// ─── NEW: drag-and-drop ───────────────────────────────────────────────────────
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
// ─────────────────────────────────────────────────────────────────────────────

const SubmitResultsScreen = () => {
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [confirmSubmitModalVisible, setConfirmSubmitModalVisible] = useState(false);
  const [forfeitModalVisible, setForfeitModalVisible] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [allowDoubles, setAllowDoubles] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const bottomSheetRef = useRef(null);
  const { fixtureId } = useLocalSearchParams();
  const { data: existingResults, isLoading: isExistingResultsLoading } =
    useResultsByFixture(fixtureId);
  const { data: fixtureDetails, isLoading: isFixtureDetailsLoading } = useFixtureDetails(fixtureId);
  console.log('Fixture details:', fixtureDetails);
  const trophyColor = colorScheme === 'dark' ? '#FFD700' : '#EBB30A';
  const { data: homeTeamPlayers, isLoading: isHomeTeamPlayersLoading } = useTeamPlayers(
    fixtureDetails?.homeTeam?.id
  );
  const { data: awayTeamPlayers, isLoading: isAwayTeamPlayersLoading } = useTeamPlayers(
    fixtureDetails?.awayTeam?.id
  );
  const { saving, save } = useSaveMatchResults(fixtureId, existingResults);
  const [submitting, setSubmitting] = useState(false);

  const [frames, setFrames] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);
  const { activeFrame, updateActiveFrame } = useActiveFrame(frames, setFrames, activeFrameId);

  const isHome = editingPlayer?.startsWith('home');
  const players = isHome ? homeTeamPlayers : awayTeamPlayers;
  const amendMode = fixtureDetails?.is_disputed;
  const drawsAllowed = fixtureDetails?.competition?.draws_allowed;

  const bestOf = fixtureDetails?.competition?.best_of;
  const bonusFrame = fixtureDetails?.competition?.special_match;
  const normalFrameCount = frames.filter((f) => !f.bonusFrame).length;
  const existingBonusFrame = frames.some((f) => f.bonusFrame);
  const frameCountReached = bestOf ? normalFrameCount >= bestOf && existingBonusFrame : false;
  const forceBonusFrame = bonusFrame && bestOf && normalFrameCount >= bestOf && !existingBonusFrame;

  // ─── Drag-and-drop handler ────────────────────────────────────────────────
  // DraggableFlatList supplies the new ordered array after a drop. Because we
  // display frames in reverse order, the `data` prop we pass is reversed, so
  // we reverse it back before storing in state.
  const handleDragEnd = ({ data }) => {
    setFrames([...data].reverse());
  };
  // ─────────────────────────────────────────────────────────────────────────

  const addFrame = () => {
    if (frameCountReached) {
      Toast.show({
        type: 'info',
        text1: 'Frame Limit Reached',
        text2: `This competition is a best of ${bestOf} frames, so you cannot add more than ${bestOf} frames.`,
      });
      return;
    }
    const newFrame = {
      tempId: Date.now().toString(),
      homePlayer1: fixtureDetails.competitor_type === 'team' ? null : fixtureDetails.homePlayer,
      homePlayer2: null,
      awayPlayer1: fixtureDetails.competitor_type === 'team' ? null : fixtureDetails.awayPlayer,
      awayPlayer2: null,
      winnerSide: null,
      lagWon: null,
      breakDish: false,
      reverseDish: false,
      bonusFrame: forceBonusFrame ? true : false,
    };
    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameId(newFrame.tempId);
  };

  const activateFrame = (tempId) => {
    setActiveFrameId(tempId);
  };

  const markComplete = () => {
    setActiveFrameId(null);
  };

  const deleteFrame = (tempId) => {
    setFrames((prev) => prev.filter((f) => f.tempId !== tempId));
    setActiveFrameId(null);
    setConfirmDeleteModalVisible(false);
  };

  const handleCancel = () => {
    setFrameToDelete(null);
    setConfirmDeleteModalVisible(false);
    setConfirmSubmitModalVisible(false);
  };

  const handlePlayerSave = () => {
    if (!editingPlayer || !selectedPlayer || !activeFrameId) return;
    updateActiveFrame(editingPlayer, selectedPlayer);
    setSelectedPlayer(null);
    setEditingPlayer(null);
    closeSheet();
  };

  const openSheet = () => bottomSheetRef.current?.expand();

  const closeSheet = () => {
    setSelectedPlayer(null);
    setEditingPlayer(null);
    bottomSheetRef.current?.close();
  };

  const getPlayerName = (player) =>
    player ? `${player.first_name} ${player.surname}` : 'Select Player';

  useEffect(() => {
    if (existingResults && existingResults.length > 0 && frames.length === 0) {
      const mappedFrames = existingResults?.map((result) => ({
        id: result.id,
        tempId: `${result.id}`,
        homePlayer1: result.home_player_1,
        homePlayer2: result.home_player_2,
        awayPlayer1: result.away_player_1,
        awayPlayer2: result.away_player_2,
        winnerSide: result.winner_side || null,
        breakDish: result.break_dish || false,
        reverseDish: result.reverse_dish || false,
        lagWon: result.lag_won || null,
        bonusFrame: result.bonus_frame || false,
        status: result.status,
        comment: result.comment || null,
      }));
      setFrames(mappedFrames);
    }
  }, [existingResults]);

  useEffect(() => {
    if (!allowDoubles) {
      updateActiveFrame('homePlayer2', null);
      updateActiveFrame('awayPlayer2', null);
    }
  }, [allowDoubles]);

  const homeScore = frames.filter((f) => f.winnerSide === 'home' && !f.bonusFrame).length;
  const awayScore = frames.filter((f) => f.winnerSide === 'away' && !f.bonusFrame).length;

  const handleToggleBonus = (value) => {
    if (value && existingBonusFrame) {
      Toast.show({
        type: 'info',
        text1: 'Bonus Frame Already Exists',
        text2: `Only one ${fixtureDetails?.competition?.special_match_name || 'bonus'} frame is allowed per fixture.`,
      });
      return;
    }
    if (!value) {
      const normalFramesExcludingCurrent = frames.filter((f) => !f.bonusFrame).length;
      if (bestOf && normalFramesExcludingCurrent >= bestOf) {
        Toast.show({
          type: 'info',
          text1: 'Frame Limit Reached',
          text2: `You cannot convert this bonus frame into a normal frame because the maximum of ${bestOf} normal frames has already been reached.`,
        });
        return;
      }
    }
    updateActiveFrame('bonusFrame', value);
  };

  function getOrdinalSuffix(n) {
    const j = n % 10,
      k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  const handleSave = async () => {
    console.log('Saving results...', frames);
    const normalFrameCount = frames.filter((f) => !f.bonusFrame).length;
    if (bestOf && normalFrameCount > bestOf) {
      Toast.show({
        type: 'error',
        text1: 'Too Many Frames',
        text2: `Only ${bestOf} normal frames are allowed.`,
      });
      return false;
    }
    const success = await save(frames);
    if (success) router.back();
  };

  const handleSubmit = async () => {
    if (!drawsAllowed && homeScore === awayScore) {
      Toast.show({
        type: 'info',
        text1: 'Draw Not Allowed',
        text2: 'This competition does not allow draws. Number of frames cannot be tied.',
      });
      setConfirmSubmitModalVisible(false);
      return false;
    }
    const normalFrameCount = frames.filter((f) => !f.bonusFrame).length;
    if (bestOf && normalFrameCount > bestOf) {
      Toast.show({
        type: 'info',
        text1: 'Too Many Frames',
        text2: `Only ${bestOf} normal frames are allowed.`,
      });
      return false;
    }
    if (activeFrameId) {
      Toast.show({
        type: 'info',
        text1: 'Active Frame',
        text2: 'Please finish editing the active frame before submitting.',
      });
      return;
    }
    setSubmitting(true);
    const success = await save(frames);
    if (!success) {
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Could not save changes before submitting.',
      });
      setSubmitting(false);
      return;
    }
    const { error } = await supabase
      .from('Fixtures')
      .update({ is_complete: true })
      .eq('id', fixtureId);
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not submit results. Please try again.',
      });
    } else {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Results submitted successfully.' });
      router.back();
    }
    setSubmitting(false);
  };

  const handleAmendment = async () => {
    setQueryLoading(true);
    const disputedFrames = frames.filter((f) => f.status === 'disputed');
    const amendedFrames = frames.filter((f) => {
      if (f.status !== 'disputed') return false;
      const original = existingResults.find((r) => r.id === f.id);
      return (
        String(f.winnerSide) !== String(original.winner_side) ||
        f.homePlayer1?.id !== original.home_player_1?.id ||
        f.homePlayer2?.id !== original.home_player_2?.id ||
        f.awayPlayer1?.id !== original.away_player_1?.id ||
        f.awayPlayer2?.id !== original.away_player_2?.id ||
        f.breakDish !== original.break_dish ||
        f.reverseDish !== original.reverse_dish ||
        f.lagWon !== original.lag_won ||
        f.bonusFrame !== original.bonus_frame
      );
    });
    try {
      if (disputedFrames.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Changes',
          text2: 'There are no disputed frames to amend.',
        });
        return;
      }
      if (disputedFrames.length !== amendedFrames.length) {
        Toast.show({
          type: 'info',
          text1: 'Amend All Disputed Frames',
          text2:
            'Please make the correct changes to all the disputed frames before submitting amendments.',
        });
        return;
      }
      const payload = amendedFrames.map((f) => ({
        id: f.id,
        winner_side: f.winnerSide,
        home_player_1: f.homePlayer1?.id,
        home_player_2: f.homePlayer2?.id,
        away_player_1: f.awayPlayer1?.id,
        away_player_2: f.awayPlayer2?.id,
        break_dish: f.breakDish || false,
        reverse_dish: f.reverseDish || false,
        lag_won: f.lagWon,
        bonus_frame: f.bonusFrame || false,
      }));
      const { error } = await supabase.rpc('amend_result', {
        fixture_id: fixtureId,
        frames: payload,
      });
      if (error) throw error;
      Toast.show({
        type: 'success',
        text1: 'Results Amended',
        text2: 'Pending opponent approval.',
      });
      router.back();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to amend results.' });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleEscalate = async () => {
    setQueryLoading(true);
    try {
      const { error } = await supabase
        .from('Fixtures')
        .update({ is_escalated: true, updated_at: new Date().toISOString() })
        .eq('id', fixtureId)
        .eq('approved', false)
        .eq('is_disputed', true);
      if (error) throw error;
      Toast.show({
        type: 'success',
        text1: 'Escalated',
        text2: 'The dispute has been escalated to the league administrators.',
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not escalate fixture. Please try again.',
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRequestForfeit = () => {
    setForfeitModalVisible(true);
  };

  const handleCancelForfeit = () => {
    setForfeitModalVisible(false);
  };

  const handleConfirmForfeit = async () => {
    setIsForfeiting(true);
    try {
      const { data, error } = await supabase.rpc('forfeit_fixture', {
        p_fixture_id: fixtureId,
        p_side: side,
        p_reason: forfeitReason || null,
        p_admin: currentRole?.role === 'admin' ? true : false,
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.detail || data?.error || 'Forfeit failed');
      Toast.show({
        type: 'success',
        text1: 'Forfeit Requested',
        text2: 'Your opponent has been notified.',
      });
      router.back();
    } catch (err) {
      console.error(err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to request forfeit.' });
    } finally {
      setIsForfeiting(false);
      setForfeitModalVisible(false);
    }
  };

  const reversedFrames = useMemo(() => {
    return [...frames].reverse();
  }, [frames]);

  // ─── Score card rendered as the list header ───────────────────────────────
  const ScoreHeader = (
    <View className="my-4 rounded-3xl bg-bg-1 p-4 shadow-sm">
      <View className="flex-row items-center justify-between gap-3 px-2">
        {/* HOME */}
        <View style={{ flex: 1 }} className="items-center">
          {fixtureDetails?.competitor_type === 'team' ? (
            <TeamLogo
              size={60}
              color1={fixtureDetails?.homeTeam?.crest?.color1}
              color2={fixtureDetails?.homeTeam?.crest?.color2}
              type={fixtureDetails?.homeTeam?.crest?.type}
              thickness={fixtureDetails?.homeTeam?.crest?.thickness}
            />
          ) : (
            <View className="mb-2 rounded-2xl border border-border-color p-1">
              <Avatar size={60} borderRadius={12} player={fixtureDetails?.homePlayer} />
            </View>
          )}
          {fixtureDetails?.competitor_type === 'team' ? (
            <View className="mt-3 items-center">
              <Text className="text-center font-saira-semibold text-lg text-text-1">
                {fixtureDetails?.homeTeam?.abbreviation}
              </Text>
              <Text className="text-center font-saira-semibold text-lg text-text-2">
                {fixtureDetails?.homeTeam?.display_name}
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center">
              <Text className="text-center font-saira-medium text-lg text-text-1">
                {fixtureDetails?.homePlayer?.first_name}
              </Text>
              <Text className="text-center font-saira-medium text-lg text-text-2">
                {fixtureDetails?.homePlayer?.surname}
              </Text>
            </View>
          )}
        </View>

        {/* CENTRE */}
        <View style={{ flex: 1.5 }} className="items-center justify-center">
          <Text className="mb-2 text-center font-saira text-lg text-text-1">
            {fixtureDetails?.competition?.name}
          </Text>
          <View className="mx-2 flex-row items-center justify-center gap-1 rounded-2xl bg-bg-2 px-2 pb-1 pt-3 shadow-sm">
            <Text className="w-12 text-center font-saira-bold text-3xl text-text-1">
              {homeScore}
            </Text>
            <Text className="mb-2 font-saira text-text-2">vs</Text>
            <Text className="w-12 text-center font-saira-bold text-3xl text-text-1">
              {awayScore}
            </Text>
          </View>
          <Text className="mt-2 text-center font-saira-medium text-text-2">
            {fixtureDetails?.competition?.best_of
              ? `Best of ${fixtureDetails?.competition?.best_of} frames`
              : 'Open Frame Format'}
          </Text>
          <Text className="mt-1 text-center font-saira text-text-2">
            {new Date(fixtureDetails?.date_time).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>

        {/* AWAY */}
        <View style={{ flex: 1 }} className="items-center">
          {fixtureDetails?.competitor_type === 'team' ? (
            <TeamLogo
              size={60}
              color1={fixtureDetails?.awayTeam?.crest?.color1}
              color2={fixtureDetails?.awayTeam?.crest?.color2}
              type={fixtureDetails?.awayTeam?.crest?.type}
              thickness={fixtureDetails?.awayTeam?.crest?.thickness}
            />
          ) : (
            <View className="mb-2 rounded-2xl border border-border-color p-1">
              <Avatar size={60} borderRadius={12} player={fixtureDetails?.awayPlayer} />
            </View>
          )}
          {fixtureDetails?.competitor_type === 'team' ? (
            <View className="mt-3 items-center">
              <Text className="font-saira-semibold text-lg text-text-1">
                {fixtureDetails?.awayTeam?.abbreviation}
              </Text>
              <Text className="text-center font-saira-semibold text-lg text-text-2">
                {fixtureDetails?.awayTeam?.display_name}
              </Text>
            </View>
          ) : (
            <View className="flex-1 items-center">
              <Text className="text-center font-saira-medium text-lg text-text-1">
                {fixtureDetails?.awayPlayer?.first_name}
              </Text>
              <Text className="text-center font-saira-medium text-lg text-text-2">
                {fixtureDetails?.awayPlayer?.surname}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // ─── renderItem for DraggableFlatList ─────────────────────────────────────
  // `isDragging` comes from the list (item is being physically dragged).
  // `isActive` is our own concept (frame is expanded for editing).
  // Drag is disabled whenever:
  //   • any frame is open for editing  (activeFrameId is set)
  //   • we're in amendMode and this frame is not disputed
  const renderFrame = ({ item: frame, drag, isActive: isDragging, getIndex }) => {
    const currentIndex = getIndex?.() ?? 0;
    const index = frames.length - currentIndex;
    const isActive = frame.tempId === activeFrameId;
    const isDisputed = frame?.status === 'disputed';
    const homeCount = [frame.homePlayer1, frame.homePlayer2].filter(Boolean).length;
    const awayCount = [frame.awayPlayer1, frame.awayPlayer2].filter(Boolean).length;
    const isValidPlayers = allowDoubles
      ? homeCount === 2 && awayCount === 2
      : homeCount === 1 && awayCount === 1;

    // Drag is only meaningful when the list is in a resting state and the item
    // is not currently being edited. In amend mode, non-disputed frames are
    // read-only so we also block drag on them.
    const dragDisabled = !!activeFrameId || (amendMode && !isDisputed);

    return (
      // ScaleDecorator gives a subtle scale-up while the item is being dragged
      <ScaleDecorator>
        <Pressable
          onLongPress={dragDisabled ? null : drag}
          delayLongPress={300}
          onPress={() => {
            if (activeFrameId === frame.tempId) return;
            if (amendMode && !isDisputed) return;
            if (activeFrameId && activeFrameId !== frame.tempId) return;

            if (
              (allowDoubles
                ? homeCount === 2 && awayCount === 2
                : homeCount === 1 && awayCount === 1) &&
              homeCount === awayCount &&
              frame.winnerSide !== null
            ) {
              activeFrameId === frame.tempId ? markComplete() : activateFrame(frame.tempId);
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error!',
                text2:
                  'Ensure both players are selected, the number of players is equal, and a winner is chosen.',
                props: { colorScheme },
              });
            }
          }}
          className={`mb-3 rounded-3xl border-2 ${isDisputed ? 'border-theme-red' : 'border-transparent'} bg-bg-grouped-2 pb-2 shadow-sm`}
          style={[styles.cardContainer, isDragging && styles.cardDragging]}>
          {/* ── Expanded / editable view ─────────────────────────────── */}
          {isActive && (
            <View className="flex flex-col gap-3">
              <View
                style={{ borderTopRightRadius: 14, borderTopLeftRadius: 14 }}
                className={`gap-2 ${amendMode && isDisputed ? 'bg-theme-red' : ''} pb-2`}>
                <Text
                  className={`mt-6 w-full px-5 ${isActive ? 'text-left' : 'text-center'} font-saira-medium text-xl ${isDisputed ? 'text-white' : 'text-text-2'}`}>
                  {index}
                  {`${getOrdinalSuffix(index)} Frame ${fixtureDetails?.is_disputed ? '- Disputed' : ''}`}
                </Text>
                {amendMode && isDisputed && (
                  <Text className="px-5 text-left font-saira text-sm text-white">
                    {frame?.comment}
                  </Text>
                )}
                <View className="absolute right-3 top-3 flex-row items-center justify-end gap-3">
                  <Pressable
                    onPress={() => {
                      if (bestOf && normalFrameCount > bestOf && !frame.bonusFrame) {
                        Toast.show({
                          type: 'error',
                          text1: 'Frame Limit Reached',
                          text2: `This competition is a best of ${bestOf} frames, so you cannot have more than ${bestOf} normal frames.`,
                        });
                        return;
                      }
                      if (
                        (allowDoubles
                          ? homeCount === 2 && awayCount === 2
                          : homeCount === 1 && awayCount === 1) &&
                        homeCount === awayCount &&
                        frame.winnerSide !== null
                      ) {
                        markComplete(frame.tempId);
                      } else {
                        Toast.show({
                          type: 'error',
                          text1: 'Error!',
                          text2:
                            'Ensure both players are selected, the number of players is equal, and a winner is chosen.',
                          props: { colorScheme },
                        });
                      }
                    }}
                    className="flex-row items-center gap-2 rounded-xl border-theme-green/50 bg-theme-green/15 p-2 px-4">
                    <Ionicons name="checkmark-outline" size={24} color={'green'} />
                    <Text className="font-saira-medium text-lg text-[#058501]">Save</Text>
                  </Pressable>
                  {!amendMode && isActive && (
                    <Pressable
                      onPress={() => {
                        setFrameToDelete(frame.tempId);
                        setConfirmDeleteModalVisible(true);
                      }}
                      className="rounded-xl border-theme-red/50 bg-theme-red/20 p-2">
                      <Ionicons name="trash-outline" size={24} color={'red'} />
                    </Pressable>
                  )}
                </View>
              </View>

              <View className="gap-3 px-4 pb-2">
                {fixtureDetails?.competitor_type === 'team' && (
                  <SlidingTabButton
                    value={allowDoubles ? 'right' : 'left'}
                    onChange={(value) => setAllowDoubles(value === 'right')}
                    option1="Singles"
                    option2="Doubles"
                  />
                )}

                <View className="flex-row gap-5 pb-2">
                  <Pressable
                    onPress={() => {
                      if (fixtureDetails?.competitor_type === 'individual') return;
                      setEditingPlayer('homePlayer1');
                      openSheet();
                    }}
                    className="flex-1 rounded-2xl bg-bg-2 p-3 py-4 shadow-sm">
                    <Text
                      numberOfLines={1}
                      className={`text-center ${frame.homePlayer1 ? 'font-saira-medium text-text-1' : 'font-saira-regular text-text-2'}`}>
                      {getPlayerName(frame.homePlayer1)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (fixtureDetails?.competitor_type === 'individual') return;
                      setEditingPlayer('awayPlayer1');
                      openSheet();
                    }}
                    className="flex-1 rounded-2xl bg-bg-2 p-3 py-4 shadow-sm">
                    <Text
                      numberOfLines={1}
                      className={`text-center ${frame.awayPlayer1 ? 'font-saira-medium text-text-1' : 'font-saira-regular text-text-2'}`}>
                      {getPlayerName(frame.awayPlayer1)}
                    </Text>
                  </Pressable>
                </View>

                {allowDoubles && (
                  <View className="flex-row gap-5 pb-2">
                    <Pressable
                      onPress={() => {
                        if (fixtureDetails?.competitor_type === 'individual') return;
                        setEditingPlayer('homePlayer2');
                        openSheet();
                      }}
                      className="flex-1 rounded-2xl bg-bg-2 p-3 py-4 shadow-sm">
                      <Text
                        numberOfLines={1}
                        className={`text-center ${frame.homePlayer2 ? 'font-saira-medium text-text-1' : 'font-saira-regular text-text-2'}`}>
                        {getPlayerName(frame.homePlayer2)}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        if (fixtureDetails?.competitor_type === 'individual') return;
                        setEditingPlayer('awayPlayer2');
                        openSheet();
                      }}
                      className="flex-1 rounded-2xl bg-bg-2 p-3 py-4 shadow-sm">
                      <Text
                        numberOfLines={1}
                        className={`text-center ${frame.awayPlayer2 ? 'font-saira-medium text-text-1' : 'font-saira-regular text-text-2'}`}>
                        {getPlayerName(frame.awayPlayer2)}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {isValidPlayers && (
                  <View className="mt-3 flex-col items-center justify-center gap-3">
                    {/* Winner row */}
                    <View className="flex-row items-center justify-evenly">
                      <Pressable
                        style={{ height: 44, width: 44 }}
                        onPress={() =>
                          updateActiveFrame(
                            'winnerSide',
                            frame.winnerSide === 'home' ? null : 'home'
                          )
                        }
                        className={`h-15 w-15 items-center justify-center rounded-xl border ${frame.winnerSide === 'home' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                        {frame.winnerSide === 'home' && (
                          <Ionicons name="trophy-outline" size={26} color="white" />
                        )}
                      </Pressable>
                      <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                        Winner
                      </Text>
                      <Pressable
                        style={{ height: 44, width: 44 }}
                        onPress={() =>
                          updateActiveFrame(
                            'winnerSide',
                            frame.winnerSide === 'away' ? null : 'away'
                          )
                        }
                        className={`items-center justify-center rounded-xl border ${frame.winnerSide === 'away' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                        {frame.winnerSide === 'away' && (
                          <Ionicons name="trophy-outline" size={26} color="white" />
                        )}
                      </Pressable>
                    </View>

                    {/* Lag Won row */}
                    <View className="flex-row items-center justify-evenly">
                      <Pressable
                        style={{ height: 44, width: 44 }}
                        onPress={() =>
                          updateActiveFrame('lagWon', frame.lagWon === 'home' ? null : 'home')
                        }
                        className={`h-15 w-15 items-center justify-center rounded-xl border ${frame.lagWon === 'home' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                        {frame.lagWon === 'home' && (
                          <Ionicons
                            style={{ transform: [{ rotate: '90deg' }] }}
                            name="swap-horizontal-outline"
                            size={26}
                            color="white"
                          />
                        )}
                      </Pressable>
                      <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                        Lag Won
                      </Text>
                      <Pressable
                        style={{ height: 44, width: 44 }}
                        onPress={() =>
                          updateActiveFrame('lagWon', frame.lagWon === 'away' ? null : 'away')
                        }
                        className={`items-center justify-center rounded-xl border ${frame.lagWon === 'away' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                        {frame.lagWon === 'away' && (
                          <Ionicons
                            style={{ transform: [{ rotate: '90deg' }] }}
                            name="swap-horizontal-outline"
                            size={26}
                            color="white"
                          />
                        )}
                      </Pressable>
                    </View>

                    {/* Break Dish row */}
                    {frame.winnerSide !== null && (
                      <View className="flex-row items-center justify-evenly">
                        {frame.winnerSide === 'home' ? (
                          <Pressable
                            style={{ height: 44, width: 44 }}
                            onPress={() => updateActiveFrame('breakDish', !frame.breakDish)}
                            className={`h-15 w-15 items-center justify-center rounded-xl border ${frame.breakDish && frame.winnerSide === 'home' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                            {frame.breakDish && frame.winnerSide === 'home' && (
                              <Ionicons name="flash" size={26} color="white" />
                            )}
                          </Pressable>
                        ) : (
                          <View style={{ width: 44 }} />
                        )}
                        <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                          Break Dish
                        </Text>
                        {frame.winnerSide === 'away' ? (
                          <Pressable
                            style={{ height: 44, width: 44 }}
                            onPress={() => updateActiveFrame('breakDish', !frame.breakDish)}
                            className={`items-center justify-center rounded-xl border ${frame.breakDish && frame.winnerSide === 'away' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                            {frame.breakDish && frame.winnerSide === 'away' && (
                              <Ionicons name="flash" size={26} color="white" />
                            )}
                          </Pressable>
                        ) : (
                          <View style={{ width: 44 }} />
                        )}
                      </View>
                    )}

                    {/* Reverse Dish row */}
                    {frame.winnerSide !== null && (
                      <View className="flex-row items-center justify-evenly">
                        {frame.winnerSide === 'home' ? (
                          <Pressable
                            style={{ height: 44, width: 44 }}
                            onPress={() => updateActiveFrame('reverseDish', !frame.reverseDish)}
                            className={`h-11 w-11 items-center justify-center rounded-xl border ${frame.reverseDish && frame.winnerSide === 'home' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                            {frame.reverseDish && frame.winnerSide === 'home' && (
                              <Ionicons
                                style={{ transform: [{ rotate: '180deg' }] }}
                                name="refresh-outline"
                                size={26}
                                color="white"
                              />
                            )}
                          </Pressable>
                        ) : (
                          <View style={{ width: 44 }} />
                        )}
                        <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                          Reverse Dish
                        </Text>
                        {frame.winnerSide === 'away' ? (
                          <Pressable
                            style={{ height: 44, width: 44 }}
                            onPress={() => updateActiveFrame('reverseDish', !frame.reverseDish)}
                            className={`items-center justify-center rounded-xl border ${frame.reverseDish && frame.winnerSide === 'away' ? 'border-brand bg-brand-light' : 'border-border-color bg-bg-grouped-1'}`}>
                            {frame.reverseDish && frame.winnerSide === 'away' && (
                              <Ionicons
                                style={{ transform: [{ rotate: '180deg' }] }}
                                name="refresh-outline"
                                size={26}
                                color="white"
                              />
                            )}
                          </Pressable>
                        ) : (
                          <View style={{ width: 44 }} />
                        )}
                      </View>
                    )}

                    {/* Bonus frame toggle */}
                    <View className="mt-2 flex-row items-center justify-between gap-5 border-t border-theme-gray-4 bg-bg-1 pt-3">
                      <View className="flex-1 items-start justify-center gap-1">
                        <Text className="font-saira-medium text-xl text-text-1">
                          {fixtureDetails?.competition?.special_match_name || 'Bonus Frame'}
                        </Text>
                        <Text className="font-saira text-sm text-text-2">
                          {`If enabled this frame will be recorded as the ${fixtureDetails?.competition?.special_match_name || 'bonus frame'} (${fixtureDetails?.competition?.special_match_abbreviation || 'BF'})`}
                        </Text>
                      </View>
                      <Switch
                        className="w-16"
                        value={frame.bonusFrame || false}
                        onValueChange={handleToggleBonus}
                        trackColor={{ false: '#E5E7EB', true: '#800080' }}
                        thumbColor={frame.bonusFrame ? '#ffffff' : '#f4f3f4'}
                      />
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Modals live inside the card so they reference the right frame */}
          <FloatingBottomSheet
            visible={confirmDeleteModalVisible && frameToDelete === frame.tempId}
            title="Delete Frame?"
            message={`Are you sure you want to delete frame ${index}?`}
            onCancel={handleCancel}
            topButtonText="Cancel"
            bottomButtonText="Delete"
            topButtonType="default"
            bottomButtonType="error"
            topButtonFn={handleCancel}
            bottomButtonFn={() => deleteFrame(frame.tempId)}
          />
          <FloatingBottomSheet
            visible={confirmSubmitModalVisible}
            title="Submit Results?"
            message={`Are you sure you want to submit the final results? Once submitted, you won't be able to make any changes unless the opponent disputes the result.`}
            onCancel={handleCancel}
            topButtonText="Cancel"
            bottomButtonText="Submit"
            topButtonType="default"
            bottomButtonType="success"
            topButtonFn={handleCancel}
            bottomButtonFn={handleSubmit}
          />

          {/* ── Collapsed summary view ───────────────────────────────── */}
          {!isActive && (
            <View
              pointerEvents={isActive ? 'none' : 'auto'}
              style={[
                styles.summaryContainer,
                {
                  minHeight: 90,
                },
              ]}>
              {isDisputed && (
                <View
                  style={{ borderTopRightRadius: 14, borderTopLeftRadius: 14 }}
                  className="bg-theme-red py-1">
                  <Text className="text-center font-saira-medium text-white">
                    {frame.status === 'disputed' ? 'Disputed' : ''}
                  </Text>
                </View>
              )}

              <View className="mt-4 flex flex-1 flex-row items-center gap-2 px-3">
                {/* Home icons */}
                <View
                  style={{ borderRadius: 14 }}
                  className="flex h-12 flex-1 flex-row items-center justify-end gap-2 bg-bg-2 p-2 shadow-sm">
                  {frame.lagWon === 'home' && (
                    <View className="items-center justify-center rounded-lg bg-brand p-2 shadow-sm">
                      <Ionicons
                        style={{ transform: [{ rotate: '90deg' }] }}
                        name="swap-horizontal-outline"
                        size={14}
                        color="#FFF"
                      />
                    </View>
                  )}
                  {frame.reverseDish && frame.winnerSide === 'home' && (
                    <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons
                        style={{ transform: [{ rotate: '180deg' }] }}
                        name="refresh-outline"
                        size={14}
                        color="#000000"
                      />
                    </View>
                  )}
                  {frame.breakDish && frame.winnerSide === 'home' && (
                    <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons name="flash" size={14} color="#000" />
                    </View>
                  )}
                  {frame.winnerSide === 'home' && (
                    <View
                      style={{ backgroundColor: trophyColor }}
                      className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons name="trophy" size={14} color="#FFF" />
                    </View>
                  )}
                </View>

                {/* Frame number badge */}
                <View
                  style={{ minWidth: 40 }}
                  className={`${frame.bonusFrame ? 'border-theme-purple bg-theme-purple/10' : 'border-transparent bg-bg-2'} h-full justify-center rounded-xl border shadow-sm`}>
                  <Text className="px-2 text-center font-saira-medium text-text-2">
                    {index}
                    {getOrdinalSuffix(index)}
                  </Text>
                  {frame.bonusFrame && (
                    <Text
                      style={{ lineHeight: 18 }}
                      className="w-full px-2 text-center font-saira-medium text-theme-purple">
                      {fixtureDetails?.competition?.special_match_abbreviation || 'BF'}
                    </Text>
                  )}
                </View>

                {/* Away icons */}
                <View
                  style={{ borderRadius: 14 }}
                  className="flex h-12 flex-1 flex-row items-center justify-start gap-2 bg-bg-2 p-2 shadow-sm">
                  {frame.winnerSide === 'away' && (
                    <View
                      style={{ backgroundColor: trophyColor }}
                      className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons name="trophy" size={14} color="#FFF" />
                    </View>
                  )}
                  {frame.breakDish && frame.winnerSide === 'away' && (
                    <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons name="flash" size={14} color="#000" />
                    </View>
                  )}
                  {frame.reverseDish && frame.winnerSide === 'away' && (
                    <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                      <Ionicons
                        style={{ transform: [{ rotate: '180deg' }] }}
                        name="refresh-outline"
                        size={14}
                        color="#000000"
                      />
                    </View>
                  )}
                  {frame.lagWon === 'away' && (
                    <View className="items-center justify-center rounded-lg bg-brand p-2 shadow-sm">
                      <Ionicons
                        style={{ transform: [{ rotate: '90deg' }] }}
                        name="swap-horizontal-outline"
                        size={14}
                        color="#FFF"
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* Player names row */}
              <View className="flex-row items-center justify-between gap-3 px-3 pt-3">
                <View className="flex flex-1 flex-col gap-1">
                  <View className="flex flex-row items-center gap-2">
                    <Avatar size={24} borderRadius={6} player={frame.homePlayer1} />
                    <Text
                      numberOfLines={1}
                      className={`${frame.homePlayer1 ? 'text-text-1' : 'text-theme-red'} flex-1 text-left font-saira-medium text-lg`}>
                      {getPlayerName(frame.homePlayer1)}
                    </Text>
                  </View>
                  {frame.homePlayer2 && (
                    <View className="flex flex-row items-center gap-2">
                      <Avatar size={24} borderRadius={6} player={frame.homePlayer2} />
                      <Text
                        numberOfLines={1}
                        className={`${frame.homePlayer2 ? 'text-text-1' : 'text-theme-red'} flex-1 text-left font-saira-medium text-lg`}>
                        {getPlayerName(frame.homePlayer2)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="mx-2 text-center text-sm text-text-2">vs</Text>
                <View className="flex flex-1 flex-col gap-1">
                  <View className="flex flex-row items-center gap-2">
                    <Text
                      numberOfLines={1}
                      className={`${frame.awayPlayer1 ? 'text-text-1' : 'text-theme-red'} flex-1 text-right font-saira-medium text-lg`}>
                      {getPlayerName(frame.awayPlayer1)}
                    </Text>
                    <Avatar size={24} borderRadius={8} player={frame.awayPlayer1} />
                  </View>
                  {frame.awayPlayer2 && (
                    <View className="flex flex-row items-center gap-2">
                      <Text
                        numberOfLines={1}
                        className={`${frame.awayPlayer2 ? 'text-text-1' : 'text-theme-red'} flex-1 text-right font-saira-medium text-lg`}>
                        {getPlayerName(frame.awayPlayer2)}
                      </Text>
                      <Avatar size={24} borderRadius={8} player={frame.awayPlayer2} />
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title={fixtureDetails?.is_disputed ? 'Amend Result' : 'Submit Results'}
                rightIcon="clipboard-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />

      {isExistingResultsLoading ||
      isFixtureDetailsLoading ||
      isHomeTeamPlayersLoading ||
      isAwayTeamPlayersLoading ? (
        <LoadingScreen />
      ) : (
        <View className="flex-1 bg-bg-2">
          {/* ── DraggableFlatList replaces the old ScrollView + .map() ── */}
          <DraggableFlatList
            // Display in reverse so newest frame is at the top
            data={reversedFrames}
            keyExtractor={(item) => item.tempId}
            renderItem={renderFrame}
            onDragEnd={handleDragEnd}
            // Disable the whole list's drag interaction while a frame is
            // open for editing, to avoid gesture conflicts
            dragItemOverflow
            activationDistance={10}
            ListHeaderComponent={() => ScoreHeader}
            contentContainerStyle={{ paddingBottom: 300, paddingHorizontal: 12 }}
            containerStyle={{ flex: 1, marginTop: 64 }}
            style={{ flex: 1 }}
          />

          {/* ── Floating action buttons (unchanged) ─────────────────── */}
          {!activeFrameId && (
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} className="p-6">
              <View
                style={{ borderRadius: 30 }}
                className="border border-theme-gray-3 bg-bg-1/80 shadow-md backdrop-blur-lg">
                <View className="gap-3 p-4">
                  {amendMode && (
                    <CTAButton
                      text="Submit Amendments"
                      type="success"
                      callbackFn={handleAmendment}
                    />
                  )}
                  {amendMode && (
                    <CTAButton
                      text="Refute and Escalate"
                      type="error"
                      callbackFn={handleEscalate}
                    />
                  )}
                  {!amendMode && (
                    <CTAButton
                      text={frameCountReached ? 'Frame Limit Reached' : 'Add Frame'}
                      type="default"
                      icon={
                        <Ionicons
                          name={frameCountReached ? 'close-outline' : 'add'}
                          size={20}
                          color="#FFF"
                        />
                      }
                      disabled={submitting || saving}
                      callbackFn={addFrame}
                    />
                  )}
                  {!amendMode && frames.length > 0 && (
                    <View className="gap-3">
                      <CTAButton
                        text={saving ? 'Saving Updates...' : 'Save Updates'}
                        type="yellow"
                        icon={<Ionicons name="save-outline" size={20} color="#000" />}
                        callbackFn={handleSave}
                        disabled={saving || submitting}
                        loading={saving}
                      />
                      <CTAButton
                        text={submitting ? 'Submitting Results...' : 'Submit Final Result'}
                        type="success"
                        icon={<Ionicons name="checkmark-outline" size={24} color="#FFF" />}
                        callbackFn={() => setConfirmSubmitModalVisible(true)}
                        disabled={saving || submitting}
                        loading={submitting}
                      />
                    </View>
                  )}
                  {!amendMode && (
                    <CTAButton
                      text={'Request Forfeit'}
                      type="error"
                      icon={<Ionicons name="alert-circle-outline" size={20} color="#FFF" />}
                      disabled={submitting || saving}
                      callbackFn={handleRequestForfeit}
                    />
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Player selection bottom sheet (unchanged) ─────────────── */}
      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['90%']}
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 140 }}
              className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
              <CTAButton text="Save" type="brand" callbackFn={handlePlayerSave} />
            </View>
          </BottomSheetFooter>
        )}>
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
            Select a Player
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 180, paddingTop: 80, paddingHorizontal: 24 }}>
          {players?.map((player) => {
            const isAlreadySelected =
              activeFrame?.homePlayer1?.id === player.id ||
              activeFrame?.homePlayer2?.id === player.id ||
              activeFrame?.awayPlayer1?.id === player.id ||
              activeFrame?.awayPlayer2?.id === player.id;
            return (
              <Pressable
                key={player.id}
                onPress={() => {
                  if (isAlreadySelected) return;
                  setSelectedPlayer(player);
                }}
                className={`mb-3 flex-row items-center gap-3 rounded-2xl border-2 bg-bg-2 p-2 ${
                  selectedPlayer?.id === player.id
                    ? 'border-brand'
                    : isAlreadySelected
                      ? 'bg-black/50 opacity-50'
                      : 'border-transparent'
                }`}>
                <Avatar size={40} borderRadius={8} player={player} />
                <Text className="font-saira-medium text-lg text-text-1">
                  {player.first_name} {player.surname}
                </Text>
              </Pressable>
            );
          })}
          <ForfeitRequestModal
            visible={forfeitModalVisible}
            onCancel={handleCancelForfeit}
            onConfirm={handleConfirmForfeit}
          />
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  cardContainer: {},
  // Subtle shadow lift while an item is physically being dragged
  cardDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  editableContainer: {
    overflow: 'hidden',
  },
  summaryContainer: {
    overflow: 'hidden',
  },
  // Drag handle sits at the bottom-right of the collapsed card
  dragHandle: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    padding: 6,
    opacity: 0.45,
  },
});

export default SubmitResultsScreen;
