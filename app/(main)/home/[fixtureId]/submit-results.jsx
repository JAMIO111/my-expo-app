import { useState } from 'react';
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
import { handleSubmitResults } from '@lib/helperFunctions';

const SubmitResultsScreen = () => {
  const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
  const router = useRouter();
  const { fixtureId } = useLocalSearchParams();
  const { data: fixtureDetails, isLoading } = useFixtureDetails(fixtureId);
  const trophyColor = colorScheme === 'dark' ? '#FFD700' : '#EBB30A';
  const homePlayers = ['John Dryden', 'Peter Johnson', 'Michael Johnson'];
  const awayPlayers = [
    'Jamie Dryden',
    'Fredrich Steenberg',
    'Joshua Robinson',
    'Samantha MacAllister',
  ];

  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [frames, setFrames] = useState([]);
  const [activeFrameId, setActiveFrameId] = useState(null);

  const addFrame = () => {
    const newFrame = {
      id: Date.now().toString(),
      homePlayer: '',
      awayPlayer: '',
      winner: null,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => [newFrame, ...prev]);
    setActiveFrameId(newFrame.id);
  };

  const updateFrame = (id, key, value) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const markComplete = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(null);
  };

  const activateFrame = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFrameId(id);
  };

  const deleteFrame = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFrames((prev) => prev.filter((f) => f.id !== id));
    setActiveFrameId(null);
    setConfirmDeleteModalVisible(false);
  };

  const handleCancel = () => {
    console.log('Cancelled');
    setConfirmDeleteModalVisible(false);
  };

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

  console.log('Fixture Details hew:', fixtureDetails);

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
            <Text className="text-2xl font-bold text-white">
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
            <Text className="font-saira text-2xl font-bold text-white">
              {fixtureDetails?.awayTeam?.abbreviation}
            </Text>
          </View>
        </View>

        {/* Frames */}
        {frames.map((frame, i) => {
          const isActive = frame.id === activeFrameId;
          const index = frames.length - i;

          return (
            <Pressable
              key={frame.id}
              onPress={() => {
                if (!activeFrameId || activeFrameId === frame.id) {
                  activateFrame(frame.id);
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
                      onValueChange={(val) => updateFrame(frame.id, 'homePlayer', val)}
                      style={{ fontSize: Platform.OS === 'android' ? 14 : undefined }}
                      itemStyle={{ fontSize: 14 }}
                      className="h-8 bg-white">
                      <Picker.Item label="Select" value="" />
                      {homePlayers.map((p) => (
                        <Picker.Item key={p} label={p} value={p} />
                      ))}
                    </Picker>
                  </View>
                  <View className="flex-1">
                    <Picker
                      selectedValue={frame.awayPlayer}
                      onValueChange={(val) => updateFrame(frame.id, 'awayPlayer', val)}
                      style={{ fontSize: Platform.OS === 'android' ? 14 : undefined }}
                      itemStyle={{ fontSize: 14 }}
                      className="h-8 bg-white">
                      <Picker.Item label="Select" value="" />
                      {awayPlayers.map((p) => (
                        <Picker.Item key={p} label={p} value={p} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {frame.homePlayer && frame.awayPlayer && (
                  <View className="mb-5 mt-3 flex-row items-center justify-evenly px-5">
                    <Pressable
                      onPress={() => updateFrame(frame.id, 'winner', frame.homePlayer)}
                      className={`h-9 w-9 items-center justify-center rounded-md border ${
                        frame.winner === frame.homePlayer
                          ? 'border-brand bg-brand-light'
                          : 'border-border-color bg-background'
                      }`}>
                      {frame.winner === frame.homePlayer && (
                        <Ionicons name="checkmark" size={28} color="white" />
                      )}
                    </Pressable>
                    <Text className="text-lg text-text-1">Select Winner</Text>
                    <Pressable
                      onPress={() => updateFrame(frame.id, 'winner', frame.awayPlayer)}
                      className={`h-9 w-9 items-center justify-center rounded-md border ${
                        frame.winner === frame.awayPlayer
                          ? 'border-brand bg-brand-light'
                          : 'border-border-color bg-background'
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
                        <Ionicons name="trash-outline" size={40} color="white" />
                      </Pressable>
                      <ConfirmModal
                        visible={confirmDeleteModalVisible}
                        onConfirm={() => deleteFrame(frame.id)}
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
                          markComplete(frame.id);
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
                  {frame.homePlayer || 'Select Player'}
                </Text>
                <Text className="mx-2 text-xs text-text-2">vs</Text>
                <Text
                  className={`${
                    frame.awayPlayer ? 'text-text-1' : 'text-theme-red'
                  } flex-1 text-left font-medium`}>
                  {frame.awayPlayer || 'Select Player'}
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
        {!activeFrameId && <CTAButton text="Add Frame" type="info" callbackFn={addFrame} />}
        {frames.length > 0 && !activeFrameId && (
          <View className="mt-4">
            <CTAButton
              text="Submit Results"
              type="success"
              callbackFn={() =>
                handleSubmitResults({
                  fixtureId,
                  frames,
                  homeTeamId: fixtureDetails?.homeTeam?.id,
                  awayTeamId: fixtureDetails?.awayTeam?.id,
                  divisionId: fixtureDetails?.division?.id,
                  seasonId: fixtureDetails?.season?.id,
                })
              }
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
