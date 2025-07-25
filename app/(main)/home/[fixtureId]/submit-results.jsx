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
import { useSubmitMatchResults } from '@hooks/useSubmitMatchResults';

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
  const { submitting, submit } = useSubmitMatchResults(fixtureId, existingResults);

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
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => [...prev, newFrame]);
    setActiveFrameId(newFrame.tempId);
  };

  const updateFrame = (tempId, key, value) => {
    setFrames((prev) => prev.map((f) => (f.tempId === tempId ? { ...f, [key]: value } : f)));
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
      }));

      setFrames(mappedFrames); // Reverse to show latest first
    }
  }, [existingResults]);

  const homeScore = frames.filter((f) => f.winner === f.homePlayer).length;
  const awayScore = frames.filter((f) => f.winner === f.awayPlayer).length;

  function getOrdinalSuffix(n) {
    const j = n % 10,
      k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  const handleSubmit = async () => {
    const success = await submit(frames);
    if (success) {
      router.replace(`/home`);
    }
  };

  console.log('Frames: ', frames);

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Submit Results" rightIcon="clipboard-outline" />
            </SafeViewWrapper>
          ),
        }}
      />
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
            className="ml-10 flex-1 items-center justify-center py-1">
            <Text className="mt-1 font-saira-semibold text-2xl text-white">
              {fixtureDetails?.homeTeam?.abbreviation}
            </Text>
          </View>
          <Text className="rounded-b-2xl border-x-2 border-bg-grouped-1 bg-bg-3 p-3 font-saira text-2xl text-text-1">
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
            className="mr-10 flex-1 items-center justify-center py-1">
            <Text className="mt-1 font-saira-semibold text-2xl text-white">
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
                <Text className="text-md mt-2 w-full text-center text-text-2">
                  {index}
                  {getOrdinalSuffix(index)} Frame
                </Text>

                {/* Editable view */}
                <View
                  style={[
                    styles.editableContainer,
                    {
                      height: isActive ? 'auto' : 0,
                      opacity: isActive ? 1 : 0,
                      paddingVertical: isActive ? 12 : 0,
                    },
                  ]}>
                  <View className="flex-row space-x-2 px-3">
                    <View className="flex-1">
                      <Picker
                        selectedValue={frame.homePlayer}
                        onValueChange={(val) => updateFrame(frame.tempId, 'homePlayer', val)}
                        style={{ fontSize: Platform.OS === 'android' ? 14 : undefined }}
                        itemStyle={{ fontSize: 14 }}
                        className="h-8 bg-white">
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
                        style={{ fontSize: Platform.OS === 'android' ? 14 : undefined }}
                        itemStyle={{ fontSize: 14 }}
                        className="h-8 bg-white">
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
                    <View className="mb-5 mt-3 flex-row items-center justify-evenly px-5">
                      <Pressable
                        onPress={() => updateFrame(frame.tempId, 'winner', frame.homePlayer)}
                        className={`h-9 w-9 items-center justify-center rounded-md border ${
                          frame.winner === frame.homePlayer
                            ? 'border-brand bg-brand-light'
                            : 'border-border-color bg-bg-grouped-2'
                        }`}>
                        {frame.winner === frame.homePlayer && (
                          <Ionicons name="checkmark" size={28} color="white" />
                        )}
                      </Pressable>
                      <Text className="text-lg text-text-1">Select Winner</Text>
                      <Pressable
                        onPress={() => updateFrame(frame.tempId, 'winner', frame.awayPlayer)}
                        className={`h-9 w-9 items-center justify-center rounded-md border ${
                          frame.winner === frame.awayPlayer
                            ? 'border-brand bg-brand-light'
                            : 'border-border-color bg-bg-grouped-2'
                        }`}>
                        {frame.winner === frame.awayPlayer && (
                          <Ionicons name="checkmark" size={28} color="white" />
                        )}
                      </Pressable>
                    </View>
                  )}
                  <View className="flex-row items-center justify-between px-6">
                    {isActive && (
                      <>
                        <Pressable
                          onPress={() => setConfirmDeleteModalVisible(true)}
                          className="rounded-2xl border border-theme-red-hc bg-theme-red/85 p-2"
                          hitSlop={10}>
                          <Ionicons name="trash-outline" size={34} color="white" />
                        </Pressable>
                        <ConfirmModal
                          visible={confirmDeleteModalVisible}
                          onConfirm={() => deleteFrame(frame.tempId)}
                          onCancel={handleCancel}
                          title="Delete Frame?"
                          message={`Are you sure you want to delete frame ${frame.indexOf}.`}
                        />
                      </>
                    )}
                    <View className="flex-1 p-4">
                      <CTAButton
                        text="Confirm Frame"
                        type="success"
                        callbackFn={() => {
                          if (
                            frame.homePlayer &&
                            frame.awayPlayer &&
                            (frame.winner === frame.homePlayer || frame.winner === frame.awayPlayer)
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
                  pointerEvents={isActive ? 'none' : 'auto'}
                  className="flex-row items-center justify-between px-3 py-2">
                  <View className="w-6 items-center justify-center">
                    {frame.winner === frame.homePlayer && (
                      <Ionicons name="trophy" size={20} color={trophyColor} />
                    )}
                  </View>
                  <Text
                    className={`${
                      frame.homePlayer ? 'text-text-1' : 'text-theme-red'
                    } flex-1 text-right font-medium`}>
                    {homePlayer
                      ? `${homePlayer.first_name} ${homePlayer.surname}`
                      : 'Select Player'}
                  </Text>
                  <Text className="mx-2 text-xs text-text-2">vs</Text>
                  <Text
                    className={`${
                      frame.awayPlayer ? 'text-text-1' : 'text-theme-red'
                    } flex-1 text-left font-medium`}>
                    {awayPlayer
                      ? `${awayPlayer.first_name} ${awayPlayer.surname}`
                      : 'Select Player'}
                  </Text>
                  <View className="w-6 items-center justify-center">
                    {frame.winner === frame.awayPlayer && (
                      <Ionicons name="trophy" size={20} color={trophyColor} />
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })}

        {/* Add Frame */}
        {!activeFrameId && (
          <CTAButton text="Add Frame" type="info" disabled={submitting} callbackFn={addFrame} />
        )}
        {frames.length > 0 && !activeFrameId && (
          <View className="mt-4">
            <CTAButton
              text={submitting ? 'Submitting...' : 'Submit Results'}
              type="success"
              callbackFn={handleSubmit}
              disabled={submitting}
            />
          </View>
        )}
      </ScrollView>
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
