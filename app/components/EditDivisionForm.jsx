import { View, Text, Switch, ScrollView, Pressable, Image, useColorScheme } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import CustomTextInput from './CustomTextInput';
import CTAButton from './CTAButton';
import { supabase } from '@lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';
import Ionicons from '@expo/vector-icons/Ionicons';
import { trophyIcons } from '@lib/badgeIcons';
import BottomSheetWrapper from '@/components/BottomSheetWrapper';
import { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import colors from '@lib/colors';
import Heading from './Heading';
import CustomDropdown from './CustomDropdown';

const EditDivisionForm = ({ competition, division, closeModal }) => {
  console.log('Editing Division:', division);
  const bottomSheetRef = useRef();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  const [selectedRewardType, setSelectedRewardType] = useState(null); // 'winner' or 'runnerUp'
  const [winnerReward, setWinnerReward] = useState(null);
  const [runnerUpReward, setRunnerUpReward] = useState(null);
  const [name, setName] = useState(division?.name || '');
  const [groupName, setGroupName] = useState(division?.group_name || '');
  const [maxCompetitors, setMaxCompetitors] = useState(division?.max_competitors?.toString() || '');
  const [midSeasonTransfers, setMidSeasonTransfers] = useState(
    division?.mid_season_transfers || false
  );
  const [adminApprovalRequired, setAdminApprovalRequired] = useState(
    division?.admin_approval_required || false
  );
  const [drawsAllowed, setDrawsAllowed] = useState(competition?.draws_allowed || false);
  const [scoringSystem, setScoringSystem] = useState(competition?.scoring_system || 'points');
  const [pointsForWin, setPointsForWin] = useState(competition?.points_for_win?.toString() || '');
  const [pointsForDraw, setPointsForDraw] = useState(
    competition?.points_for_draw?.toString() || ''
  );
  const [pointsForLoss, setPointsForLoss] = useState(
    competition?.points_for_loss?.toString() || ''
  );
  const [legs, setLegs] = useState(competition?.round_robin_cycles?.toString() || '');
  const [bestOf, setBestOf] = useState(competition?.best_of?.toString() || '');
  const [promotions, setPromotions] = useState(division?.promotion_spots?.toString() || '');
  const [relegations, setRelegations] = useState(division?.relegation_spots?.toString() || '');
  const [bonusMatch, setBonusMatch] = useState(competition?.special_match || false);
  const [bonusMatchName, setBonusMatchName] = useState(competition?.special_match_name || '');
  const [bonusMatchAbbreviation, setBonusMatchAbbreviation] = useState(
    competition?.bonus_match_abbreviation || ''
  );

  const queryClient = useQueryClient();

  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));
  const winnerTrophy = trophyIconMap[winnerReward];
  const runnerUpTrophy = trophyIconMap[runnerUpReward];

  useEffect(() => {
    if (!division) return;
    setName(division.name || '');
    setGroupName(division.group_name || '');
    setMaxCompetitors(division.max_competitors?.toString() || '');
    setPromotions(division.promotion_spots?.toString() || '');
    setRelegations(division.relegation_spots?.toString() || '');
    setMidSeasonTransfers(division.mid_season_transfers || false);
    setAdminApprovalRequired(division.admin_approval_required || false);
  }, [division]);

  useEffect(() => {
    if (!competition) return;

    setDrawsAllowed(competition.draws_allowed || false);
    setScoringSystem(competition.scoring_system || 'points');

    setPointsForWin(competition.points_for_win?.toString() || '');
    setPointsForDraw(competition.points_for_draw?.toString() || '');
    setPointsForLoss(competition.points_for_loss?.toString() || '');

    setLegs(competition.round_robin_cycles?.toString() || '');
    setBestOf(competition.best_of?.toString() || '');

    setBonusMatch(competition.special_match || false);
    setBonusMatchName(competition.special_match_name || '');
    setBonusMatchAbbreviation(competition.special_match_abbreviation || '');

    setWinnerReward(competition.winner_reward || null);
    setRunnerUpReward(competition.runner_up_reward || null);
  }, [competition]);

  const handleSave = async () => {
    if (!scoringSystem) {
      closeModal();
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Scoring system is required',
      });
      return;
    }
    try {
      const { error } = await supabase.rpc('update_division_and_propagate', {
        // --- division ---
        p_division_id: division.id,
        p_name: name,
        p_group_name: groupName,
        p_promotion_spots: Number(promotions),
        p_relegation_spots: Number(relegations),
        p_max_competitors: Number(maxCompetitors),
        p_admin_approval_required: adminApprovalRequired,
        p_mid_season_transfers: midSeasonTransfers,

        // --- competition ---
        p_competition_id: competition.id,
        p_round_robin_cycles: Number(legs),
        p_best_of: Number(bestOf),
        p_special_match: bonusMatch,
        p_special_match_name: bonusMatch ? bonusMatchName : null,
        p_special_match_abbreviation: bonusMatch ? bonusMatchAbbreviation : null,

        p_draws_allowed: drawsAllowed, // you need this state
        p_scoring_system: scoringSystem, // e.g. 'points'

        p_points_for_win: scoringSystem === 'points' ? Number(pointsForWin) : null,
        p_points_for_draw:
          scoringSystem === 'points' && drawsAllowed ? Number(pointsForDraw) : null,
        p_points_for_loss: scoringSystem === 'points' ? Number(pointsForLoss) : null,

        p_winner_reward: winnerReward ?? null,
        p_runner_up_reward: runnerUpReward ?? null,
      });

      if (error) throw error;

      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: 'Division & competition updated',
      });

      queryClient.invalidateQueries(['Divisions', division.district]);
      queryClient.invalidateQueries(['Competitions', { districtId: division.district }]);
      queryClient.invalidateQueries([
        'Competitions',
        { divisionId: division.id, competitionType: 'league' },
      ]);

      closeModal();
    } catch (err) {
      console.log('RAW ERROR:', err);
      console.log('MESSAGE:', err?.message);

      if (err?.message === 'NO_CHANGES_DETECTED') {
        closeModal();
        return;
      }

      let text1 = 'Error';
      let text2 = 'Failed to update';
      let type = 'error';

      switch (err?.message) {
        case 'TOP_TIER_PROMOTION_MODIFICATION_NOT_ALLOWED':
          type = 'info';
          text1 = 'Update Not Allowed';
          text2 = 'Cannot modify promotion spots for top tier';
          break;

        case 'BOTTOM_TIER_RELEGATION_MODIFICATION_NOT_ALLOWED':
          type = 'info';
          text1 = 'Update Not Allowed';
          text2 = 'Cannot modify relegation spots for bottom tier';
          break;

        case 'MAX_COMPETITORS_BELOW_ACTIVE_MEMBERS':
          type = 'info';
          text1 = 'Invalid Max Competitors';
          text2 = 'Max competitors below active members';
          break;

        case 'NEGATIVE_POINTS_NOT_ALLOWED':
          text2 = 'Points cannot be negative';
          break;

        case 'INVALID_POINTS_HIERARCHY':
          text1 = 'Invalid Points Hierarchy';
          text2 = 'Win > Draw > Loss must hold';
          break;

        case 'INVALID_POINTS_HIERARCHY_NO_DRAWS':
          text1 = 'Invalid Points Hierarchy';
          text2 = 'Win must be greater than loss';
          break;

        case 'EVEN_BEST_OF_REQUIRES_DRAWS':
          text2 = 'Draws must be enabled if Best of X frames is even';
          break;

        case 'INVALID_SCORING_SYSTEM':
          text2 = 'Invalid scoring system';
          break;

        case 'DIVISION_NOT_FOUND':
          text2 = 'Division not found';
          break;
      }

      Toast.show({
        type,
        text1,
        text2,
      });
    } finally {
      closeModal();
    }
  };

  const openSheet = (type) => {
    setSelectedRewardType(type);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  const selectReward = (reward) => {
    setSelectedReward(reward);
    closeSheet();
  };

  const updateReward = (reward) => {
    const value = reward?.key ?? null;

    if (selectedRewardType === 'winner') {
      setWinnerReward(value);
    } else if (selectedRewardType === 'runnerUp') {
      setRunnerUpReward(value);
    }
  };

  return (
    <View className="flex-1 gap-4 bg-bg-1 pb-16">
      <ScrollView contentContainerStyle={{ gap: 8 }} className="flex-1 gap-4 bg-bg-2">
        <View className="gap-4 bg-bg-1 p-5">
          <Heading text="Division Settings" />
          <CustomTextInput
            value={name}
            onChangeText={setName}
            title="Division Name"
            placeholder="e.g. Super League"
            leftIconName="trophy-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <CustomTextInput
            value={groupName}
            onChangeText={setGroupName}
            title="Group Name"
            placeholder="e.g. Thursday Teams"
            leftIconName="layers-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <CustomTextInput
            value={maxCompetitors}
            onChangeText={setMaxCompetitors}
            title="Max Competitors"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="people-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <View className="flex-row items-center gap-4">
            <View className="flex-1">
              <CustomTextInput
                title="Promotions"
                value={promotions}
                onChangeText={setPromotions}
                keyboardType="numeric"
                titleColor="text-text-1"
                placeholder="e.g. 3"
                leftIconName="caret-up-outline"
                iconColor="#34C757"
                clearButtonMode="never"
              />
            </View>
            <View className="flex-1">
              <CustomTextInput
                value={relegations}
                onChangeText={setRelegations}
                title="Relegations"
                placeholder="e.g. 3"
                iconColor="#FF3B30"
                leftIconName="caret-down-outline"
                titleColor="text-text-1"
                keyboardType="numeric"
                clearButtonMode="never"
              />
            </View>
          </View>
          <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 px-1 py-3">
            <View className="flex-1 items-start justify-center gap-1">
              <Text className="font-saira-medium text-xl text-text-1">Mid-Season Transfers</Text>
              <Text className="font-saira text-xs text-text-2">
                If disabled, players will not be able to join teams in this division after the
                season has started.
              </Text>
            </View>
            <Switch
              className="w-16"
              value={midSeasonTransfers}
              onValueChange={setMidSeasonTransfers}
              trackColor={{ false: '#E5E7EB', true: '#800080' }}
              thumbColor={midSeasonTransfers ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 px-1 py-3">
            <View className="flex-1 items-start justify-center gap-1">
              <Text className="font-saira-medium text-xl text-text-1">Admin Approval Required</Text>
              <Text className="font-saira text-xs text-text-2">
                If enabled, all join requests for teams in this division will require admin
                approval.
              </Text>
            </View>
            <Switch
              className="w-16"
              value={adminApprovalRequired}
              onValueChange={setAdminApprovalRequired}
              trackColor={{ false: '#E5E7EB', true: '#800080' }}
              thumbColor={adminApprovalRequired ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View className="gap-4 bg-bg-1 p-5">
          <Heading text="Default League Settings" />
          <Text className="pb-2 pl-1 font-saira text-xs italic text-text-2">
            These are the default settings for this division's league competitions. They will be
            applied to any future competitions initiated for this division. Adjusting these settings
            will not affect existing competitions for this division.
          </Text>

          <CustomTextInput
            value={legs.toString()}
            onChangeText={(text) => setLegs(Number(text))}
            title="Number of Legs"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="repeat-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <CustomTextInput
            value={bestOf.toString()}
            onChangeText={(text) => setBestOf(Number(text))}
            title="Best of X Frames"
            keyboardType="numeric"
            placeholder="e.g. 20"
            leftIconName="layers-outline"
            iconColor="purple"
            autoCapitalize="words"
            titleColor="text-text-1"
          />
          <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 px-1 py-3">
            <View className="flex-1 items-start justify-center gap-1">
              <Text className="font-saira-medium text-xl text-text-1">Draws Allowed</Text>
              <Text className="font-saira text-xs text-text-2">
                If disabled users will not be able to complete a fixture as a draw.
              </Text>
            </View>
            <Switch
              className="w-16"
              value={drawsAllowed}
              onValueChange={setDrawsAllowed}
              trackColor={{ false: '#E5E7EB', true: '#800080' }}
              thumbColor={drawsAllowed ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          <CustomDropdown
            title="Point Scoring System"
            titleColor="text-text-1"
            leftIconName="layers-outline"
            iconColor="purple"
            placeholder="Select Scoring System"
            value={scoringSystem}
            onChange={setScoringSystem}
            options={[
              {
                label: 'Frames Won',
                value: 'frames_won',
                subLabel: 'League table ordered by total frames won',
              },
              {
                label: 'Points for Result',
                value: 'points',
                subLabel: 'Points rewarded for win/draw/loss',
              },
              {
                label: 'Frame Difference',
                value: 'frame_diff',
                subLabel: 'League table ordered by frame difference',
              },
            ]}
          />
          {scoringSystem === 'points' ? (
            <View className="mb-6 gap-4">
              <CustomTextInput
                value={pointsForWin}
                onChangeText={setPointsForWin}
                title="Points for a Win"
                placeholder="e.g. 3"
                leftIconName="caret-up-outline"
                iconColor="#34C757"
                keyboardType="numeric"
                clearButtonMode="never"
                titleColor="text-text-1"
              />
              <CustomTextInput
                value={pointsForDraw}
                onChangeText={setPointsForDraw}
                title="Points for a Draw"
                placeholder="e.g. 1"
                leftIconName="caret-forward-outline"
                iconColor="#FBBF24"
                keyboardType="numeric"
                clearButtonMode="never"
                titleColor="text-text-1"
              />
              <CustomTextInput
                value={pointsForLoss}
                onChangeText={setPointsForLoss}
                title="Points for a Loss"
                placeholder="e.g. 0"
                leftIconName="caret-down-outline"
                iconColor="#EF4444"
                keyboardType="numeric"
                clearButtonMode="never"
                titleColor="text-text-1"
              />
            </View>
          ) : null}
          <View className="flex-row items-center justify-between gap-5 rounded-xl bg-bg-1 px-1 py-3">
            <View className="flex-1 items-start justify-center gap-1">
              <Text className="font-saira-medium text-xl text-text-1">Enable Bonus Frame</Text>
              <Text className="font-saira text-xs text-text-2">
                1 frame per fixture seperate from the league standings e.g. Captain's Cup, Bonus
                Round, etc.
              </Text>
            </View>
            <Switch
              className="w-16"
              value={bonusMatch}
              onValueChange={setBonusMatch}
              trackColor={{ false: '#E5E7EB', true: '#800080' }}
              thumbColor={bonusMatch ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          {bonusMatch && (
            <View className="gap-4">
              <CustomTextInput
                value={bonusMatchName.toString()}
                onChangeText={setBonusMatchName}
                title="Bonus Match Name"
                keyboardType="default"
                placeholder="e.g. Captain's Cup"
                leftIconName="flame-outline"
                iconColor="purple"
                autoCapitalize="words"
                titleColor="text-text-1"
              />
              <CustomTextInput
                value={bonusMatchAbbreviation.toString()}
                onChangeText={setBonusMatchAbbreviation}
                title="Bonus Match Abbreviation"
                keyboardType="default"
                placeholder="e.g. CC"
                leftIconName="pricetag-outline"
                iconColor="purple"
                autoCapitalize="characters"
                titleColor="text-text-1"
                maxLength={3}
              />
            </View>
          )}
        </View>

        <View className="gap-4 bg-bg-1 p-4 pb-8">
          <Heading text="Competition Awards" />
          <View style={{ minHeight: 280 }} className="flex-row items-stretch justify-around gap-5">
            <Pressable
              onPress={() => openSheet('winner')}
              className="flex-1 flex-col items-center justify-end rounded-2xl border-2 border-dashed border-theme-gray-4">
              <View className="flex-1 flex-col items-center justify-end">
                {winnerReward === null ? (
                  <View className="h-30 w-30 mb-4 flex-1 items-center justify-center rounded-2xl">
                    <Ionicons name="add" size={120} color="#000000" />
                  </View>
                ) : (
                  <Image source={winnerTrophy?.icon} className="h-30 w-30 mb-4" />
                )}
                <Text className="ml-2 font-saira-medium text-xl text-text-1">
                  {winnerReward ? winnerTrophy?.name : 'No Reward'}
                </Text>
                <Text className="ml-2 pb-3 font-saira-medium text-lg text-text-2">WINNER</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => openSheet('runnerUp')}
              className="flex-1 flex-col items-center justify-end rounded-2xl border-2 border-dashed border-theme-gray-4">
              <View className="flex-1 flex-col items-center justify-end">
                {runnerUpReward === null ? (
                  <View className="mb-4 flex-1 items-center justify-center rounded-2xl">
                    <Ionicons name="add" size={120} color="#000000" />
                  </View>
                ) : (
                  <Image source={runnerUpTrophy?.icon} className="h-30 w-30 mb-4" />
                )}
                <Text className="ml-2 font-saira-medium text-xl text-text-1">
                  {runnerUpReward ? runnerUpTrophy?.name : 'No Reward'}
                </Text>
                <Text className="ml-2 pb-3 font-saira-medium text-lg text-text-2">RUNNER UP</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View className="px-5">
        <CTAButton type="yellow" text="Save Changes" callbackFn={handleSave} />
      </View>
      <BottomSheetWrapper
        marginTop={50}
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['100%']}>
        {/* Header */}
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
          <Text style={{ lineHeight: 40, fontSize: 24 }} className="font-saira-medium text-text-1">
            Choose {selectedRewardType === 'winner' ? "Winner's" : "Runner-up's"} award
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Grid of rewards */}
        <BottomSheetScrollView
          className="bg-bg-grouped-1"
          contentContainerStyle={{
            paddingBottom: 200,
            paddingTop: 80,
            paddingHorizontal: 16,
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
          {trophyIcons?.map((reward, idx) => {
            const isSelected =
              selectedRewardType === 'winner'
                ? winnerReward === reward.key
                : selectedRewardType === 'runnerUp'
                  ? runnerUpReward === reward.key
                  : false;
            return (
              <Pressable
                key={idx}
                onPress={() => {
                  updateReward(reward);
                  closeSheet();
                }}
                className={`rounded-2xl bg-bg-grouped-2 ${
                  isSelected ? 'border-2 border-brand' : 'shadow-sm'
                }`}
                style={{
                  width: '48%',
                  marginBottom: 20,
                  alignItems: 'center',
                }}>
                <Image
                  source={reward.icon}
                  style={{ width: 80, height: 120, resizeMode: 'contain' }}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    lineHeight: 24,
                    fontSize: 16,
                    marginVertical: 8,
                  }}
                  className="font-saira-medium text-text-1">
                  {reward.name}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              updateReward(null);
              closeSheet();
            }}
            className={`${
              selectedRewardType === 'winner'
                ? winnerReward === null
                : selectedRewardType === 'runnerUp'
                  ? runnerUpReward === null
                  : false
                    ? 'border-2 border-brand'
                    : 'shadow-sm'
            } w-full flex-row items-center justify-center gap-4 rounded-2xl bg-bg-grouped-2 p-6`}
            style={{
              width: '100%',
              marginBottom: 20,
              alignItems: 'center',
            }}>
            <Ionicons name="ban-outline" size={60} color="red" />
            <Text
              style={{
                textAlign: 'center',
                lineHeight: 60,
                fontSize: 36,
                marginVertical: 0,
              }}
              className="font-saira-medium text-text-1">
              No Reward
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </View>
  );
};

export default EditDivisionForm;
