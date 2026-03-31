import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
  StyleSheet,
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

const SubmitResultsScreen = () => {
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [allowDoubles, setAllowDoubles] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const bottomSheetRef = useRef(null);
  const { fixtureId } = useLocalSearchParams();
  const { data: existingResults, isLoading: isExistingResultsLoading } =
    useResultsByFixture(fixtureId);
  const { data: fixtureDetails, isLoading: isFixtureDetailsLoading } = useFixtureDetails(fixtureId);
  console.log('Fixture Details:', fixtureDetails);
  console.log('ExistingResults:', existingResults);
  const trophyColor = colorScheme === 'dark' ? '#FFD700' : '#EBB30A';
  const { data: homeTeamPlayers, isLoading: isHomeTeamPlayersLoading } = useTeamPlayers(
    fixtureDetails?.homeTeam?.id
  );
  const { data: awayTeamPlayers, isLoading: isAwayTeamPlayersLoading } = useTeamPlayers(
    fixtureDetails?.awayTeam?.id
  );
  const { saving, save } = useSaveMatchResults(fixtureId, existingResults);
  const [submitting, setSubmitting] = useState(false);

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [frames, setFrames] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);
  const { activeFrame, updateActiveFrame } = useActiveFrame(frames, setFrames, activeFrameId);

  const isHome = editingPlayer?.startsWith('home');
  const players = isHome ? homeTeamPlayers : awayTeamPlayers;

  const addFrame = () => {
    const newFrame = {
      tempId: Date.now().toString(),
      homePlayer1: fixtureDetails.competitor_type === 'team' ? null : fixtureDetails.homePlayer,
      homePlayer2: null,
      awayPlayer1: fixtureDetails.competitor_type === 'team' ? null : fixtureDetails.awayPlayer,
      awayPlayer2: null,
      winnerSide: null,
      lagWon: null,
      breakDish: null,
      reverseDish: null,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameId(newFrame.tempId);
  };

  const activateFrame = (tempId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(tempId);
  };

  const markComplete = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(null);
  };

  const deleteFrame = (tempId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => prev.filter((f) => f.tempId !== tempId));
    setActiveFrameId(null);
    setConfirmDeleteModalVisible(false);
  };

  const handleCancel = () => {
    setFrameToDelete(null);
    setConfirmDeleteModalVisible(false);
  };

  const handlePlayerSave = () => {
    if (!editingPlayer || !selectedPlayer || !activeFrameId) return;

    updateActiveFrame(editingPlayer, selectedPlayer);

    setSelectedPlayer(null);
    setEditingPlayer(null);
    closeSheet();
  };

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    setSelectedPlayer(null);
    setEditingPlayer(null);
    bottomSheetRef.current?.close();
  };

  const getPlayerName = (player) =>
    player ? `${player.first_name} ${player.surname}` : 'Select Player';

  useEffect(() => {
    if (existingResults && existingResults.length > 0 && frames.length === 0) {
      const mappedFrames = existingResults?.map((result) => {
        return {
          id: result.id,
          tempId: `${result.id}`,

          homePlayer1: result.home_player_1,
          homePlayer2: result.home_player_2,
          awayPlayer1: result.away_player_1,
          awayPlayer2: result.away_player_2,

          winnerSide: result.winner_side || null,

          breakDish: result.break_dish || null,
          reverseDish: result.reverse_dish || null,
          lagWon: result.lag_won || null, // if you add this later
        };
      });

      setFrames(mappedFrames); // Reverse to show latest first
    }
  }, [existingResults]);

  useEffect(() => {
    if (!allowDoubles) {
      updateActiveFrame('homePlayer2', null);
      updateActiveFrame('awayPlayer2', null);
    }
  }, [allowDoubles]);

  const homeScore = frames.filter((f) => f.winnerSide === 'home').length;
  const awayScore = frames.filter((f) => f.winnerSide === 'away').length;

  function getOrdinalSuffix(n) {
    const j = n % 10,
      k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  const handleSave = async () => {
    const success = await save(frames);
    if (success) {
      router.back(); // Go back to previous screen or navigate to a different one as needed
    }
  };

  const handleSubmit = async () => {
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
      console.error('Failed to mark fixture as complete:', error.message);
      // Optionally show toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not submit results. Please try again.',
      });
    } else {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Results submitted successfully.',
      });
      router.back(); // Go back to previous screen or navigate to a different one as needed
    }

    setSubmitting(false);
  };

  console.log('Frames: ', frames);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Submit Results" rightIcon="clipboard-outline" />
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
        <View className="flex-1 bg-bg-1">
          <ScrollView className="mt-16 flex-1 bg-bg-grouped-1 p-4">
            {/* Match Score */}
            <View className="mb-4 rounded-3xl bg-bg-1 p-4 shadow-sm">
              <View className="flex-row items-center justify-between px-2">
                {/* HOME */}
                <View className="items-center">
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
                      <Text className={`font-saira-semibold text-lg text-text-1`}>
                        {fixtureDetails?.homeTeam?.abbreviation}
                      </Text>
                      <Text className={`font-saira-semibold text-lg text-text-2`}>
                        {fixtureDetails?.homeTeam?.display_name}
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <Text className="font-saira-medium text-lg text-text-1">
                        {fixtureDetails?.homePlayer?.first_name}
                      </Text>
                      <Text className="font-saira-medium text-lg text-text-2">
                        {fixtureDetails?.homePlayer?.surname}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-1 items-center justify-center">
                  <Text className="mb-2 text-center font-saira text-lg text-text-1">
                    {fixtureDetails?.competition?.name}
                  </Text>
                  {/* SCORE */}
                  <View className="mx-2 flex-row items-center justify-center gap-1 rounded-2xl bg-bg-2 px-2 pb-2 pt-4 shadow-sm">
                    <Text className="w-12 text-center font-saira-bold text-3xl text-text-1">
                      {homeScore}
                    </Text>
                    <Text className="mb-2 font-saira text-text-2">vs</Text>
                    <Text className="w-12 text-center font-saira-bold text-3xl text-text-1">
                      {awayScore}
                    </Text>
                  </View>
                  <Text className="mt-2 text-center font-saira text-text-2">
                    {new Date(fixtureDetails.date_time).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    })}
                  </Text>
                  <Text className="text-center font-saira text-text-2">
                    {new Date(fixtureDetails.date_time).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {/* AWAY */}
                <View className="items-center">
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
                      <Text className={`font-saira-semibold text-lg text-text-1`}>
                        {fixtureDetails?.awayTeam?.abbreviation}
                      </Text>
                      <Text className={`font-saira-semibold text-lg text-text-2`}>
                        {fixtureDetails?.awayTeam?.display_name}
                      </Text>
                    </View>
                  ) : (
                    <View className="items-center">
                      <Text className="font-saira-medium text-lg text-text-1">
                        {fixtureDetails?.awayPlayer?.first_name}
                      </Text>
                      <Text className="font-saira-medium text-lg text-text-2">
                        {fixtureDetails?.awayPlayer?.surname}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Frames */}
            {frames
              .slice()
              .reverse()
              .map((frame, i) => {
                const isActive = frame.tempId === activeFrameId;
                const index = frames.length - i;
                const homeCount = [frame.homePlayer1, frame.homePlayer2].filter(Boolean).length;
                const awayCount = [frame.awayPlayer1, frame.awayPlayer2].filter(Boolean).length;
                const isValidPlayers = allowDoubles
                  ? homeCount === 2 && awayCount === 2
                  : homeCount === 1 && awayCount === 1;

                return (
                  <Pressable
                    key={frame.tempId}
                    onPress={() => {
                      if (!activeFrameId || activeFrameId === frame.tempId) {
                        activateFrame(frame.tempId);
                      }
                    }}
                    className="mb-3 rounded-3xl bg-bg-grouped-2 shadow-sm"
                    style={styles.cardContainer}>
                    {/* Editable view */}
                    <View
                      className="flex flex-col gap-3"
                      style={[
                        styles.editableContainer,
                        {
                          height: isActive ? 'auto' : 0,
                          opacity: isActive ? 1 : 0,
                          paddingVertical: isActive ? 6 : 0,
                          paddingHorizontal: isActive ? 16 : 0,
                        },
                      ]}>
                      <Text
                        className={`mt-4 w-full px-5 ${isActive ? 'text-left' : 'text-center'} font-saira-medium text-lg text-text-2`}>
                        {index}
                        {getOrdinalSuffix(index)} Frame
                      </Text>
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
                          <View className="flex-row items-center justify-evenly">
                            <Pressable
                              style={{
                                height: 50,
                                width: 50,
                              }}
                              onPress={() =>
                                updateActiveFrame(
                                  'winnerSide',
                                  frame.winnerSide === 'home' ? null : 'home'
                                )
                              }
                              className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                frame.winnerSide === 'home'
                                  ? 'border-brand bg-brand-light'
                                  : 'border-border-color bg-bg-grouped-1'
                              }`}>
                              {frame.winnerSide === 'home' && (
                                <Ionicons name="trophy-outline" size={36} color="white" />
                              )}
                            </Pressable>
                            <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                              Winner
                            </Text>
                            <Pressable
                              style={{
                                height: 50,
                                width: 50,
                              }}
                              onPress={() =>
                                updateActiveFrame(
                                  'winnerSide',
                                  frame.winnerSide === 'away' ? null : 'away'
                                )
                              }
                              className={`items-center justify-center rounded-2xl border ${
                                frame.winnerSide === 'away'
                                  ? 'border-brand bg-brand-light'
                                  : 'border-border-color bg-bg-grouped-1'
                              }`}>
                              {frame.winnerSide === 'away' && (
                                <Ionicons name="trophy-outline" size={36} color="white" />
                              )}
                            </Pressable>
                          </View>
                          <View className="flex-row items-center justify-evenly">
                            <Pressable
                              style={{
                                height: 50,
                                width: 50,
                              }}
                              onPress={() =>
                                updateActiveFrame('lagWon', frame.lagWon === 'home' ? null : 'home')
                              }
                              className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                frame.lagWon === 'home'
                                  ? 'border-brand bg-brand-light'
                                  : 'border-border-color bg-bg-grouped-1'
                              }`}>
                              {frame.lagWon === 'home' && (
                                <Ionicons name="radio-button-on" size={36} color="white" />
                              )}
                            </Pressable>
                            <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                              Lag Won
                            </Text>
                            <Pressable
                              style={{
                                height: 50,
                                width: 50,
                              }}
                              onPress={() =>
                                updateActiveFrame('lagWon', frame.lagWon === 'away' ? null : 'away')
                              }
                              className={`items-center justify-center rounded-2xl border ${
                                frame.lagWon === 'away'
                                  ? 'border-brand bg-brand-light'
                                  : 'border-border-color bg-bg-grouped-1'
                              }`}>
                              {frame.lagWon === 'away' && (
                                <Ionicons name="radio-button-on" size={36} color="white" />
                              )}
                            </Pressable>
                          </View>
                          {frame.winnerSide !== null && (
                            <View className="flex-row items-center justify-evenly">
                              {frame.winnerSide === 'home' ? (
                                <Pressable
                                  style={{
                                    height: 50,
                                    width: 50,
                                  }}
                                  onPress={() =>
                                    updateActiveFrame('breakDish', frame.breakDish ? false : true)
                                  }
                                  className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                    frame.breakDish && frame.winnerSide === 'home'
                                      ? 'border-brand bg-brand-light'
                                      : 'border-border-color bg-bg-grouped-1'
                                  }`}>
                                  {frame.breakDish && frame.winnerSide === 'home' && (
                                    <Ionicons name="triangle-outline" size={36} color="white" />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={{ width: 50 }} />
                              )}
                              <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                                Break Dish
                              </Text>
                              {frame.winnerSide === 'away' ? (
                                <Pressable
                                  style={{
                                    height: 50,
                                    width: 50,
                                  }}
                                  onPress={() =>
                                    updateActiveFrame('breakDish', frame.breakDish ? false : true)
                                  }
                                  className={`items-center justify-center rounded-2xl border ${
                                    frame.breakDish && frame.winnerSide === 'away'
                                      ? 'border-brand bg-brand-light'
                                      : 'border-border-color bg-bg-grouped-1'
                                  }`}>
                                  {frame.breakDish && frame.winnerSide === 'away' && (
                                    <Ionicons name="triangle-outline" size={36} color="white" />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={{ width: 50 }} />
                              )}
                            </View>
                          )}
                          {frame.winnerSide !== null && (
                            <View className="flex-row items-center justify-evenly">
                              {frame.winnerSide === 'home' ? (
                                <Pressable
                                  style={{
                                    height: 50,
                                    width: 50,
                                  }}
                                  onPress={() =>
                                    updateActiveFrame(
                                      'reverseDish',
                                      frame.reverseDish ? false : true
                                    )
                                  }
                                  className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                    frame.reverseDish && frame.winnerSide === 'home'
                                      ? 'border-brand bg-brand-light'
                                      : 'border-border-color bg-bg-grouped-1'
                                  }`}>
                                  {frame.reverseDish && frame.winnerSide === 'home' && (
                                    <Ionicons
                                      style={{ transform: [{ rotate: '180deg' }] }}
                                      name="triangle-outline"
                                      size={36}
                                      color="white"
                                    />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={{ width: 50 }} />
                              )}
                              <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                                Reverse Dish
                              </Text>
                              {frame.winnerSide === 'away' ? (
                                <Pressable
                                  style={{
                                    height: 50,
                                    width: 50,
                                  }}
                                  onPress={() =>
                                    updateActiveFrame(
                                      'reverseDish',
                                      frame.reverseDish ? false : true
                                    )
                                  }
                                  className={`items-center justify-center rounded-2xl border ${
                                    frame.reverseDish && frame.winnerSide === 'away'
                                      ? 'border-brand bg-brand-light'
                                      : 'border-border-color bg-bg-grouped-1'
                                  }`}>
                                  {frame.reverseDish && frame.winnerSide === 'away' && (
                                    <Ionicons
                                      style={{ transform: [{ rotate: '180deg' }] }}
                                      name="triangle-outline"
                                      size={36}
                                      color="white"
                                    />
                                  )}
                                </Pressable>
                              ) : (
                                <View style={{ width: 50 }} />
                              )}
                            </View>
                          )}
                        </View>
                      )}
                      <View className="mb-2 flex-row items-center justify-between gap-3">
                        {isActive && (
                          <>
                            <Pressable
                              onPress={() => {
                                setFrameToDelete(frame.tempId);
                                setConfirmDeleteModalVisible(true);
                              }}
                              className="rounded-2xl border border-theme-red-hc bg-theme-red/85 p-3"
                              hitSlop={10}>
                              <Ionicons name="trash-outline" size={30} color="white" />
                            </Pressable>
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
                          </>
                        )}
                        <View className="flex-1">
                          <CTAButton
                            text="Confirm Frame"
                            type="yellow"
                            callbackFn={() => {
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
                                  props: {
                                    colorScheme: colorScheme,
                                  },
                                });
                              }
                            }}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Collapsed summary */}
                    <View
                      style={[
                        styles.summaryContainer,
                        {
                          height: isActive ? 0 : 'auto',
                          opacity: isActive ? 0 : 1,
                          paddingVertical: isActive ? 0 : 12,
                        },
                      ]}
                      className="flex">
                      <View className="flex flex-1 flex-row items-center gap-2 px-3">
                        <View
                          style={{ borderRadius: 14 }}
                          className="flex h-12 flex-1 flex-row items-center justify-end gap-2 bg-bg-2 p-2 shadow-sm">
                          {frame.lagWon === 'home' && (
                            <View className="items-center justify-center rounded-lg bg-brand p-2 shadow-sm">
                              <Ionicons name="radio-button-on" size={14} color="#FFF" />
                            </View>
                          )}
                          {frame.reverseDish && frame.winnerSide === 'home' && (
                            <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                              <Ionicons
                                style={{ transform: [{ rotate: '180deg' }] }}
                                name="triangle-outline"
                                size={14}
                                color="#FF0000"
                              />
                            </View>
                          )}
                          {frame.breakDish && frame.winnerSide === 'home' && (
                            <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                              <Ionicons name="triangle-outline" size={14} color="#000" />
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
                        <View className="h-full justify-center rounded-xl bg-bg-2 shadow-sm">
                          <Text
                            className={`w-full px-2 text-center font-saira-medium text-xl text-text-2`}>
                            {index}
                            {getOrdinalSuffix(index)}
                          </Text>
                        </View>
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
                              <Ionicons name="triangle-outline" size={14} color="#000" />
                            </View>
                          )}
                          {frame.reverseDish && frame.winnerSide === 'away' && (
                            <View className="items-center justify-center rounded-lg bg-bg-1 p-2 shadow-sm">
                              <Ionicons
                                style={{ transform: [{ rotate: '180deg' }] }}
                                name="triangle-outline"
                                size={14}
                                color="#FF0000"
                              />
                            </View>
                          )}
                          {frame.lagWon === 'away' && (
                            <View className="items-center justify-center rounded-lg bg-brand p-2 shadow-sm">
                              <Ionicons name="radio-button-on" size={14} color="#FFF" />
                            </View>
                          )}
                        </View>
                      </View>
                      <View
                        pointerEvents={isActive ? 'none' : 'auto'}
                        className="flex-row items-center justify-between gap-3 px-3 pt-3">
                        <View className="flex flex-1 flex-col gap-1">
                          <View className="flex flex-row items-center gap-2">
                            <Avatar size={24} borderRadius={8} player={frame.homePlayer1} />
                            <Text
                              numberOfLines={1}
                              className={`${
                                frame.homePlayer1 ? 'text-text-1' : 'text-theme-red'
                              } flex-1 text-left font-saira-medium text-lg`}>
                              {getPlayerName(frame.homePlayer1)}
                            </Text>
                          </View>
                          {frame.homePlayer2 && (
                            <View className="flex flex-row items-center gap-2">
                              <Avatar size={24} borderRadius={8} player={frame.homePlayer2} />
                              <Text
                                numberOfLines={1}
                                className={`${
                                  frame.homePlayer2 ? 'text-text-1' : 'text-theme-red'
                                } flex-1 text-left font-saira-medium text-lg`}>
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
                              className={`${
                                frame.awayPlayer1 ? 'text-text-1' : 'text-theme-red'
                              } flex-1 text-right font-saira-medium text-lg`}>
                              {getPlayerName(frame.awayPlayer1)}
                            </Text>
                            <Avatar size={24} borderRadius={8} player={frame.awayPlayer1} />
                          </View>
                          {frame.awayPlayer2 && (
                            <View className="flex flex-row items-center gap-2">
                              <Text
                                numberOfLines={1}
                                className={`${
                                  frame.awayPlayer2 ? 'text-text-1' : 'text-theme-red'
                                } flex-1 text-right font-saira-medium text-lg`}>
                                {getPlayerName(frame.awayPlayer2)}
                              </Text>
                              <Avatar size={24} borderRadius={8} player={frame.awayPlayer2} />
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

            {/* Add Frame */}
          </ScrollView>
          {!activeFrameId && (
            <View className="border-t border-border-color p-6 pb-8">
              <CTAButton
                text="Add Frame"
                type="yellow"
                disabled={submitting || saving}
                callbackFn={addFrame}
              />

              {frames.length > 0 && (
                <View className="">
                  <View className="mt-4">
                    <CTAButton
                      text={saving ? 'Saving Results...' : 'Save Results'}
                      type="success"
                      callbackFn={handleSave}
                      disabled={saving || submitting}
                      loading={saving}
                    />
                  </View>

                  <View className="mt-4">
                    <CTAButton
                      text={submitting ? 'Submitting...' : 'Submit Final Result'}
                      type="success"
                      callbackFn={handleSubmit}
                      disabled={submitting}
                      loading={submitting}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
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
        {/* Fixed Header */}
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

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 180, paddingTop: 80, paddingHorizontal: 24 }}>
          {/* Your selectable items */}
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
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  editableContainer: {
    overflow: 'hidden',
  },
  summaryContainer: {
    overflow: 'hidden',
  },
});

export default SubmitResultsScreen;
