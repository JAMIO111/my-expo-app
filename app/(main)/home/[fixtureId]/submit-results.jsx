import { useState, useEffect } from 'react';
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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import CTAButton from '@components/CTAButton';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import Toast from 'react-native-toast-message';
import ConfirmModal from '@components/ConfirmModal';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import { useColorScheme } from 'react-native';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useSaveMatchResults } from '@hooks/useSaveMatchResults';
import { supabase } from '@/lib/supabase';
import { getContrastColor } from '@lib/helperFunctions';

const SubmitResultsScreen = () => {
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const [frameToDelete, setFrameToDelete] = useState(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { fixtureId } = useLocalSearchParams();
  const { data: existingResults } = useResultsByFixture(fixtureId);
  const { data: fixtureDetails, isLoading } = useFixtureDetails(fixtureId);
  console.log('Fixture Details:', fixtureDetails);
  console.log('ExistingResults:', existingResults);
  const trophyColor = colorScheme === 'dark' ? '#FFD700' : '#EBB30A';
  const homePlayers = useTeamPlayers(fixtureDetails?.homeTeam?.id);
  const awayPlayers = useTeamPlayers(fixtureDetails?.awayTeam?.id);
  const { saving, save } = useSaveMatchResults(fixtureId, existingResults);
  const [submitting, setSubmitting] = useState(false);

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [frames, setFrames] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);

  const addFrame = () => {
    const newFrame = {
      tempId: Date.now().toString(),
      homePlayers: [],
      awayPlayers: [],
      winnerSide: null,
      lagWon: null,
      breakDish: null,
      reverseDish: null,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameId(newFrame.tempId);
  };

  const updateFrame = (tempId, key, value) => {
    setFrames((prev) =>
      prev.map((f) => {
        if (f.tempId !== tempId) return f;

        const updated = { ...f };
        const previousValue = f[key];
        updated[key] = value;

        // 1. If players change → validate dependent fields
        if (key === 'homePlayers' || key === 'awayPlayers') {
          const home = key === 'homePlayers' ? value : f.homePlayers;
          const away = key === 'awayPlayers' ? value : f.awayPlayers;

          // if no players, reset results
          if (home.length === 0 || away.length === 0) {
            updated.winnerSide = null;
            updated.breakDish = null;
            updated.reverseDish = null;
            updated.lagWon = null;
          }
        }

        // 2. If winner changes → clear dish stats
        if (key === 'winnerSide' && previousValue !== value) {
          updated.breakDish = null;
          updated.reverseDish = null;
        }

        // 3. Make break and reverse mutually exclusive
        if (key === 'breakDish' && previousValue !== value) {
          updated.reverseDish = null;
        }

        if (key === 'reverseDish' && previousValue !== value) {
          updated.breakDish = null;
        }

        return updated;
      })
    );
  };

  const markComplete = (tempId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(null);
  };

  const activateFrame = (tempId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(tempId);
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

  useEffect(() => {
    if (existingResults && existingResults.length > 0 && frames.length === 0) {
      const mappedFrames = existingResults?.map((result) => {
        const homePlayers = [result.home_player_1, result.home_player_2].filter(Boolean);

        const awayPlayers = [result.away_player_1, result.away_player_2].filter(Boolean);

        return {
          id: result.id,
          tempId: `${result.id}`,

          homePlayers: homePlayers?.map((p) => p.id),
          awayPlayers: awayPlayers?.map((p) => p.id),

          winnerSide: result.winner_side || null,

          breakDish: result.break_dish ? result.winner_side : null,
          reverseDish: result.reverse_dish ? result.winner_side : null,
          lagWon: result.lag_won || null, // if you add this later
        };
      });

      setFrames(mappedFrames); // Reverse to show latest first
    }
  }, [existingResults]);

  const homeScore = frames.filter((f) => f.winnerSide === 'home').length;
  const awayScore = frames.filter((f) => f.winnerSide === 'away').length;

  const homeTextColor = getContrastColor(fixtureDetails?.homeTeam?.crest?.color1 || '#FFF');
  const awayTextColor = getContrastColor(fixtureDetails?.awayTeam?.crest?.color1 || '#FFF');

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
      router.replace(`/home`);
    }
  };

  const handleSubmit = async () => {
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
      router.replace('/home');
    }

    setSubmitting(false);
  };

  console.log('Frames: ', frames);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-bg-2">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Submit Results" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="flex-1 bg-bg-1">
        <ScrollView className="mt-16 flex-1 bg-bg-grouped-1 p-4">
          {/* Match Score */}
          <View className="mb-4 rounded-3xl bg-bg-1 p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              {/* HOME */}
              <View className="flex-1 items-center">
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

              {/* SCORE */}
              <View className="mx-3 flex-row items-center justify-center gap-3 rounded-2xl bg-bg-2 px-4 pb-2 pt-4 shadow-sm">
                <Text className="font-saira-bold text-3xl text-text-1">{homeScore}</Text>
                <Text className="mb-2 text-text-2">vs</Text>
                <Text className="font-saira-bold text-3xl text-text-1">{awayScore}</Text>
              </View>

              {/* AWAY */}
              <View className="flex-1 items-center">
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
              const isDoubles = frame.homePlayers.length === 2 || frame.awayPlayers.length === 2;
              const homePlayer = homePlayers?.data?.find((p) => p.id === frame.homePlayers[0]);
              const awayPlayer = awayPlayers?.data?.find((p) => p.id === frame.awayPlayers[0]);
              const homeSelected = frame.homePlayers
                .map((id) => homePlayers?.data?.find((p) => p.id === id))
                .filter(Boolean);
              const awaySelected = frame.awayPlayers
                .map((id) => awayPlayers?.data?.find((p) => p.id === id))
                .filter(Boolean);
              return (
                <Pressable
                  key={frame.tempId}
                  onPress={() => {
                    if (!activeFrameId || activeFrameId === frame.tempId) {
                      activateFrame(frame.tempId);
                    }
                  }}
                  className="mb-3 overflow-hidden rounded-2xl bg-bg-grouped-2"
                  style={styles.cardContainer}>
                  <Text
                    className={`mt-3 w-full px-5 ${isActive ? 'text-left' : 'text-center'} font-saira-medium text-xl text-text-2`}>
                    {index}
                    {getOrdinalSuffix(index)} Frame
                  </Text>

                  {/* Editable view */}
                  <View
                    className="flex flex-col gap-5"
                    style={[
                      styles.editableContainer,
                      {
                        height: isActive ? 'auto' : 0,
                        opacity: isActive ? 1 : 0,
                        paddingVertical: isActive ? 6 : 0,
                        paddingHorizontal: isActive ? 16 : 0,
                      },
                    ]}>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        {[0, 1].map((index) => (
                          <Picker
                            key={index}
                            selectedValue={frame.homePlayers[index] || ''}
                            onValueChange={(val) => {
                              const updated = [...frame.homePlayers];
                              updated[index] = val || null;

                              // remove empty trailing player
                              const cleaned = updated.filter(Boolean);

                              updateFrame(frame.tempId, 'homePlayers', cleaned);
                            }}>
                            <Picker.Item
                              label={index === 0 ? 'Player 1' : 'Player 2 (optional)'}
                              value=""
                            />
                            {(homePlayers?.data || []).map((p) => (
                              <Picker.Item
                                key={p.id}
                                label={`${p.first_name} ${p.surname}`}
                                value={p.id}
                              />
                            ))}
                          </Picker>
                        ))}
                      </View>
                      <View className="flex-1">
                        {[0, 1].map((index) => (
                          <Picker
                            key={index}
                            selectedValue={frame.awayPlayers[index] || ''}
                            onValueChange={(val) => {
                              const updated = [...frame.awayPlayers];
                              updated[index] = val || null;

                              // remove empty trailing player
                              const cleaned = updated.filter(Boolean);

                              updateFrame(frame.tempId, 'awayPlayers', cleaned);
                            }}>
                            <Picker.Item
                              label={index === 0 ? 'Player 1' : 'Player 2 (optional)'}
                              value=""
                            />
                            {(awayPlayers?.data || []).map((p) => (
                              <Picker.Item
                                key={p.id}
                                label={`${p.first_name} ${p.surname}`}
                                value={p.id}
                              />
                            ))}
                          </Picker>
                        ))}
                      </View>
                    </View>

                    {frame.homePlayers.length >= 1 && frame.awayPlayers.length >= 1 && (
                      <View className="flex-col items-center justify-center gap-3">
                        <View className="flex-row items-center justify-evenly">
                          <Pressable
                            onPress={() =>
                              updateFrame(
                                frame.tempId,
                                'winnerSide',
                                frame.winnerSide === 'home' ? null : 'home'
                              )
                            }
                            className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                              frame.winnerSide === 'home'
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.winnerSide === 'home' && (
                              <Ionicons name="trophy-outline" size={36} color="white" />
                            )}
                          </Pressable>
                          <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                            Select Winner
                          </Text>
                          <Pressable
                            onPress={() =>
                              updateFrame(
                                frame.tempId,
                                'winnerSide',
                                frame.winnerSide === 'away' ? null : 'away'
                              )
                            }
                            className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                              frame.winnerSide === 'away'
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
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
                              updateFrame(
                                frame.tempId,
                                'lagWon',
                                frame.lagWon === 'home' ? null : 'home'
                              )
                            }
                            className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                              frame.lagWon === 'home'
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.lagWon === 'home' && (
                              <Ionicons name="radio-button-off-outline" size={36} color="white" />
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
                              updateFrame(
                                frame.tempId,
                                'lagWon',
                                frame.lagWon === 'away' ? null : 'away'
                              )
                            }
                            className={`items-center justify-center rounded-2xl border ${
                              frame.lagWon === 'away'
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.lagWon === 'away' && (
                              <Ionicons name="radio-button-off-outline" size={36} color="white" />
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
                                  updateFrame(
                                    frame.tempId,
                                    'breakDish',
                                    frame.breakDish ? false : true
                                  )
                                }
                                className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                  frame.breakDish && frame.winnerSide === 'home'
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
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
                                  updateFrame(
                                    frame.tempId,
                                    'breakDish',
                                    frame.breakDish ? false : true
                                  )
                                }
                                className={`items-center justify-center rounded-2xl border ${
                                  frame.breakDish && frame.winnerSide === 'away'
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
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
                                  updateFrame(
                                    frame.tempId,
                                    'reverseDish',
                                    frame.reverseDish ? false : true
                                  )
                                }
                                className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                  frame.reverseDish && frame.winnerSide === 'home'
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
                                }`}>
                                {frame.reverseDish && frame.winnerSide === 'home' && (
                                  <Ionicons name="triangle-outline" size={36} color="white" />
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
                                  updateFrame(
                                    frame.tempId,
                                    'reverseDish',
                                    frame.reverseDish ? false : true
                                  )
                                }
                                className={`items-center justify-center rounded-2xl border ${
                                  frame.reverseDish && frame.winnerSide === 'away'
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
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
                          <ConfirmModal
                            visible={confirmDeleteModalVisible && frameToDelete === frame.tempId}
                            onConfirm={() => deleteFrame(frame.tempId)}
                            onCancel={handleCancel}
                            title="Delete Frame?"
                            type="cancel"
                            message={`Are you sure you want to delete frame ${index}.`}
                          />
                        </>
                      )}
                      <View className="flex-1">
                        <CTAButton
                          text="Confirm Frame"
                          type="yellow"
                          callbackFn={() => {
                            if (
                              frame.homePlayers.length >= 1 &&
                              frame.awayPlayers.length >= 1 &&
                              frame.homePlayers.length === frame.awayPlayers.length &&
                              frame.homePlayers.length <= 2 &&
                              frame.awayPlayers.length <= 2 &&
                              frame.winnerSide !== null
                            ) {
                              markComplete(frame.tempId);
                            } else {
                              Toast.show({
                                type: 'error',
                                text1: 'Error!',
                                text2:
                                  'Ensure both players are selected, the number of players is equal, and a winner is chosen. Each team can have a maximum of 2 players.',
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
                    <View
                      pointerEvents={isActive ? 'none' : 'auto'}
                      className="flex-row items-center justify-between px-3 py-2">
                      <Text
                        className={`${
                          frame.homePlayer ? 'text-text-1' : 'text-theme-red'
                        } flex-1 text-right text-lg font-medium`}>
                        {homePlayer
                          ? `${homePlayer.first_name} ${homePlayer.surname}`
                          : 'Select Player'}
                      </Text>
                      <Text className="mx-2 text-center text-sm text-text-2">vs</Text>
                      <Text
                        className={`${
                          frame.awayPlayer ? 'text-text-1' : 'text-theme-red'
                        } flex-1 text-left text-lg font-medium`}>
                        {awayPlayer
                          ? `${awayPlayer.first_name} ${awayPlayer.surname}`
                          : 'Select Player'}
                      </Text>
                    </View>
                    <View className="flex flex-1 flex-row items-center gap-5">
                      <View className="flex flex-1 flex-row items-center justify-end gap-2">
                        {frame.lagWon === 'home' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons
                              name="radio-button-off-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.reverseDish && frame.winnerSide === 'home' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons
                              style={{ transform: [{ rotate: '180deg' }] }}
                              name="triangle-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.breakDish && frame.winnerSide === 'home' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons name="triangle-outline" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.winnerSide === 'home' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons name="trophy" size={20} color={trophyColor} />
                          </View>
                        )}
                      </View>
                      <View
                        style={{
                          width: 1,
                          height: 30,
                          backgroundColor: '#999',
                        }}
                      />
                      <View className="flex flex-1 flex-row items-center justify-start gap-2">
                        {frame.winnerSide === 'away' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons name="trophy" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.breakDish && frame.winnerSide === 'away' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons name="triangle-outline" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.reverseDish && frame.winnerSide === 'away' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons
                              style={{ transform: [{ rotate: '180deg' }] }}
                              name="triangle-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.lagWon === 'away' && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2 shadow-sm">
                            <Ionicons
                              name="radio-button-off-outline"
                              size={20}
                              color={trophyColor}
                            />
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
        <View className="rounded-t-3xl bg-bg-2 p-5">
          {!activeFrameId && (
            <CTAButton
              text="Add Frame"
              type="yellow"
              disabled={submitting || saving}
              callbackFn={addFrame}
            />
          )}
          {frames.length > 0 && !activeFrameId && (
            <View className="mt-4">
              <CTAButton
                text={saving ? 'Saving Results...' : 'Save Results'}
                type="success"
                callbackFn={handleSave}
                disabled={saving || submitting}
                loading={saving}
              />
            </View>
          )}
          <View className="mt-">
            <CTAButton
              text={submitting ? 'Submitting...' : 'Submit Final Result'}
              type="success"
              callbackFn={handleSubmit}
              disabled={submitting}
              loading={submitting}
            />
          </View>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    overflow: 'hidden',
  },
  editableContainer: {
    overflow: 'hidden',
  },
  summaryContainer: {
    overflow: 'hidden',
  },
});

export default SubmitResultsScreen;
