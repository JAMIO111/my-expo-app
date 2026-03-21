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
      homePlayer: '',
      awayPlayer: '',
      winner: null,
      lag_won: null,
      break_dish: null,
      reverse_dish: null,
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
        if (key === 'homePlayer' || key === 'awayPlayer') {
          const validPlayers = [
            key === 'homePlayer' ? value : f.homePlayer,
            key === 'awayPlayer' ? value : f.awayPlayer,
          ];

          ['winner', 'lag_won', 'break_dish', 'reverse_dish'].forEach((field) => {
            if (!validPlayers.includes(updated[field])) {
              updated[field] = null;
            }
          });
        }

        // 2. If winner changes → clear dish stats
        if (key === 'winner' && previousValue !== value) {
          updated.break_dish = null;
          updated.reverse_dish = null;
        }

        // 3. Make break and reverse mutually exclusive
        if (key === 'break_dish' && previousValue !== value) {
          updated.reverse_dish = null;
        }

        if (key === 'reverse_dish' && previousValue !== value) {
          updated.break_dish = null;
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
    setConfirmDeleteModalVisible(false);
  };

  useEffect(() => {
    if (existingResults && existingResults.length > 0 && frames.length === 0) {
      const mappedFrames = existingResults.map((result, i) => ({
        id: result.id, // actual DB ID (for updates, if needed)
        tempId: `${result.id}`, // still use tempId for UI interaction
        homePlayer: result.home_player.id,
        awayPlayer: result.away_player.id,
        winner: result.winner_id,
        lag_won: result.lag_winner_id,
        break_dish: result.break_dish_winner_id,
        reverse_dish: result.reverse_dish_winner_id,
      }));

      setFrames(mappedFrames); // Reverse to show latest first
    }
  }, [existingResults]);

  const homeScore = frames.filter((f) => f.winner === f.homePlayer).length;
  const awayScore = frames.filter((f) => f.winner === f.awayPlayer).length;

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
          <View className="relative mb-2 flex-row items-start justify-center p-3">
            <View className="absolute left-0 z-50">
              <View className="rounded-full border border-border-color">
                <TeamLogo
                  size={60}
                  color1={fixtureDetails?.homeTeam?.crest?.color1}
                  color2={fixtureDetails?.homeTeam?.crest?.color2}
                  type={fixtureDetails?.homeTeam?.crest?.type}
                  thickness={fixtureDetails?.homeTeam?.crest?.thickness}
                />
              </View>
            </View>
            <View
              style={{ backgroundColor: fixtureDetails?.homeTeam?.crest?.color1 }}
              className="ml-10 flex-1 items-center justify-center border border-theme-gray-4 py-1">
              <Text className={`${homeTextColor} mt-1 font-saira-semibold text-2xl`}>
                {fixtureDetails?.homeTeam?.abbreviation}
              </Text>
            </View>
            <Text className="rounded-b-2xl border-x-2 border-bg-grouped-1 bg-bg-3 p-3 font-saira-medium text-2xl text-text-1">
              {homeScore} - {awayScore}
            </Text>
            <View className="absolute right-0 z-50">
              <View className="rounded-full border border-border-color">
                <TeamLogo
                  size={60}
                  color1={fixtureDetails?.awayTeam?.crest?.color1}
                  color2={fixtureDetails?.awayTeam?.crest?.color2}
                  type={fixtureDetails?.awayTeam?.crest?.type}
                  thickness={fixtureDetails?.awayTeam?.crest?.thickness}
                />
              </View>
            </View>
            <View
              style={{ backgroundColor: fixtureDetails?.awayTeam?.crest?.color1 }}
              className="mr-10 flex-1 items-center justify-center border border-theme-gray-4 py-1">
              <Text className={`${awayTextColor} mt-1 font-saira-semibold text-2xl`}>
                {fixtureDetails?.awayTeam?.abbreviation}
              </Text>
            </View>
          </View>

          {/* Frames */}
          {frames
            .slice()
            .reverse()
            .map((frame, i) => {
              const isActive = frame.tempId === activeFrameId;
              const index = frames.length - i;
              const homePlayer = homePlayers?.data?.find((p) => p.id === frame.homePlayer);
              const awayPlayer = awayPlayers?.data?.find((p) => p.id === frame.awayPlayer);
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
                        <Picker
                          selectedValue={frame.homePlayer}
                          onValueChange={(val) => updateFrame(frame.tempId, 'homePlayer', val)}
                          style={{
                            fontSize: Platform.OS === 'android' ? 14 : undefined,
                            borderRadius: 16,
                            backgroundColor: '#00000009',
                          }}
                          itemStyle={{ fontSize: 14, fontFamily: 'Saira-medium' }}
                          className="h-8">
                          <Picker.Item label="Select" value="" />
                          {Array.isArray(homePlayers?.data) &&
                            homePlayers.data.map((p) => (
                              <Picker.Item
                                key={p.id}
                                label={`${p.first_name} ${p.surname}`}
                                value={p.id}
                              />
                            ))}
                        </Picker>
                      </View>
                      <View className="flex-1">
                        <Picker
                          selectedValue={frame.awayPlayer}
                          onValueChange={(val) => updateFrame(frame.tempId, 'awayPlayer', val)}
                          style={{
                            fontSize: Platform.OS === 'android' ? 14 : undefined,
                            borderRadius: 16,
                            backgroundColor: '#00000009',
                            borderColor: 'gray',
                          }}
                          itemStyle={{ fontSize: 14, fontFamily: 'Saira-medium' }}
                          className="h-8">
                          <Picker.Item label="Select" value="" />
                          {Array.isArray(awayPlayers?.data) &&
                            awayPlayers.data.map((p) => (
                              <Picker.Item
                                key={p.id}
                                label={`${p.first_name} ${p.surname}`}
                                value={p.id}
                              />
                            ))}
                        </Picker>
                      </View>
                    </View>

                    {frame.homePlayer && frame.awayPlayer && (
                      <View className="flex-col items-center justify-center gap-3">
                        <View className="flex-row items-center justify-evenly">
                          <Pressable
                            style={{
                              height: 50,
                              width: 50,
                            }}
                            onPress={() =>
                              updateFrame(
                                frame.tempId,
                                'winner',
                                frame.winner === frame.homePlayer ? null : frame.homePlayer
                              )
                            }
                            className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                              frame.winner === frame.homePlayer
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.winner === frame.homePlayer && (
                              <Ionicons name="trophy-outline" size={36} color="white" />
                            )}
                          </Pressable>
                          <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                            Select Winner
                          </Text>
                          <Pressable
                            style={{
                              height: 50,
                              width: 50,
                            }}
                            onPress={() =>
                              updateFrame(
                                frame.tempId,
                                'winner',
                                frame.winner === frame.awayPlayer ? null : frame.awayPlayer
                              )
                            }
                            className={`items-center justify-center rounded-2xl border ${
                              frame.winner === frame.awayPlayer
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.winner === frame.awayPlayer && (
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
                                'lag_won',
                                frame.lag_won === frame.homePlayer ? null : frame.homePlayer
                              )
                            }
                            className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                              frame.lag_won === frame.homePlayer
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.lag_won === frame.homePlayer && (
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
                                'lag_won',
                                frame.lag_won === frame.awayPlayer ? null : frame.awayPlayer
                              )
                            }
                            className={`items-center justify-center rounded-2xl border ${
                              frame.lag_won === frame.awayPlayer
                                ? 'border-brand bg-brand-light'
                                : 'border-border-color bg-bg-grouped-2'
                            }`}>
                            {frame.lag_won === frame.awayPlayer && (
                              <Ionicons name="radio-button-off-outline" size={36} color="white" />
                            )}
                          </Pressable>
                        </View>
                        {frame.winner !== null && (
                          <View className="flex-row items-center justify-evenly">
                            {frame.winner === frame.homePlayer ? (
                              <Pressable
                                style={{
                                  height: 50,
                                  width: 50,
                                }}
                                onPress={() =>
                                  updateFrame(
                                    frame.tempId,
                                    'break_dish',
                                    frame.break_dish === frame.homePlayer ? null : frame.homePlayer
                                  )
                                }
                                className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                  frame.break_dish === frame.homePlayer
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
                                }`}>
                                {frame.break_dish === frame.homePlayer && (
                                  <Ionicons name="triangle-outline" size={36} color="white" />
                                )}
                              </Pressable>
                            ) : (
                              <View style={{ width: 50 }} />
                            )}
                            <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                              Break Dish
                            </Text>
                            {frame.winner === frame.awayPlayer ? (
                              <Pressable
                                style={{
                                  height: 50,
                                  width: 50,
                                }}
                                onPress={() =>
                                  updateFrame(
                                    frame.tempId,
                                    'break_dish',
                                    frame.break_dish === frame.awayPlayer ? null : frame.awayPlayer
                                  )
                                }
                                className={`items-center justify-center rounded-2xl border ${
                                  frame.break_dish === frame.awayPlayer
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
                                }`}>
                                {frame.break_dish === frame.awayPlayer && (
                                  <Ionicons name="triangle-outline" size={36} color="white" />
                                )}
                              </Pressable>
                            ) : (
                              <View style={{ width: 50 }} />
                            )}
                          </View>
                        )}
                        {frame.winner !== null && (
                          <View className="flex-row items-center justify-evenly">
                            {frame.winner === frame.homePlayer ? (
                              <Pressable
                                style={{
                                  height: 50,
                                  width: 50,
                                }}
                                onPress={() =>
                                  updateFrame(
                                    frame.tempId,
                                    'reverse_dish',
                                    frame.reverse_dish === frame.homePlayer
                                      ? null
                                      : frame.homePlayer
                                  )
                                }
                                className={`h-15 w-15 items-center justify-center rounded-2xl border ${
                                  frame.reverse_dish === frame.homePlayer
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
                                }`}>
                                {frame.reverse_dish === frame.homePlayer && (
                                  <Ionicons name="triangle-outline" size={36} color="white" />
                                )}
                              </Pressable>
                            ) : (
                              <View style={{ width: 50 }} />
                            )}
                            <Text className="flex-1 text-center font-saira-medium text-xl text-text-1">
                              Reverse Dish
                            </Text>
                            {frame.winner === frame.awayPlayer ? (
                              <Pressable
                                style={{
                                  height: 50,
                                  width: 50,
                                }}
                                onPress={() =>
                                  updateFrame(
                                    frame.tempId,
                                    'reverse_dish',
                                    frame.reverse_dish === frame.awayPlayer
                                      ? null
                                      : frame.awayPlayer
                                  )
                                }
                                className={`items-center justify-center rounded-2xl border ${
                                  frame.reverse_dish === frame.awayPlayer
                                    ? 'border-brand bg-brand-light'
                                    : 'border-border-color bg-bg-grouped-2'
                                }`}>
                                {frame.reverse_dish === frame.awayPlayer && (
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
                            onPress={() => setConfirmDeleteModalVisible(true)}
                            className="rounded-2xl border border-theme-red-hc bg-theme-red/85 p-3"
                            hitSlop={10}>
                            <Ionicons name="trash-outline" size={30} color="white" />
                          </Pressable>
                          <ConfirmModal
                            visible={confirmDeleteModalVisible}
                            onConfirm={() => deleteFrame(frame.tempId)}
                            onCancel={handleCancel}
                            title="Delete Frame?"
                            type="cancel"
                            message={`Are you sure you want to delete frame ${frame.indexOf}.`}
                          />
                        </>
                      )}
                      <View className="flex-1">
                        <CTAButton
                          text="Confirm Frame"
                          type="yellow"
                          callbackFn={() => {
                            if (
                              frame.homePlayer &&
                              frame.awayPlayer &&
                              (frame.winner === frame.homePlayer ||
                                frame.winner === frame.awayPlayer)
                            ) {
                              markComplete(frame.tempId);
                            } else {
                              Toast.show({
                                type: 'error',
                                text1: 'Error!',
                                text2: 'Ensure both players are selected and a winner is chosen.',
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
                        {frame.lag_won === frame.homePlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons
                              name="radio-button-off-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.reverse_dish === frame.homePlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons
                              style={{ transform: [{ rotate: '180deg' }] }}
                              name="triangle-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.break_dish === frame.homePlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons name="triangle-outline" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.winner === frame.homePlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
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
                        {frame.winner === frame.awayPlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons name="trophy" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.break_dish === frame.awayPlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons name="triangle-outline" size={20} color={trophyColor} />
                          </View>
                        )}
                        {frame.reverse_dish === frame.awayPlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
                            <Ionicons
                              style={{ transform: [{ rotate: '180deg' }] }}
                              name="triangle-outline"
                              size={20}
                              color={trophyColor}
                            />
                          </View>
                        )}
                        {frame.lag_won === frame.awayPlayer && (
                          <View className="items-center justify-center rounded-lg bg-bg-2 p-2">
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
