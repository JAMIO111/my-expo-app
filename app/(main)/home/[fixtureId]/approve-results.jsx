import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import ConfirmFramesList from '@components/ConfirmFramesList';
import { router, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import TeamLogo from '@components/TeamLogo';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import { useUser } from '@contexts/UserProvider';
import Toast from 'react-native-toast-message';

const ApproveResults = () => {
  const { client: supabase } = useSupabaseClient();
  const [disputedFrames, setDisputedFrames] = useState([]);
  const [approvingResults, setApprovingResults] = useState(false);
  const { fixtureId } = useLocalSearchParams();
  const { data: results, isLoading } = useResultsByFixture(fixtureId);
  const { data: fixtureDetails } = useFixtureDetails(fixtureId);
  const { currentRole, player } = useUser();

  const handleApproveResults = async () => {
    if (
      player?.id !== currentRole?.team?.captain &&
      player?.id !== currentRole?.team?.vice_captain
    ) {
      Toast.show({
        type: 'error',
        text1: 'Action Not Allowed',
        text2: 'Only the captain and vice captain can approve results.',
      });
    } else {
      setApprovingResults(true);
      console.log('Approving results for fixture:', fixtureId);
      console.log('Player ID:', player?.id);
      console.log('Current Role:', currentRole?.activeSeason?.id, currentRole?.team?.division?.id);
      const { data, error } = await supabase.rpc('approve_results_and_update_standings_and_stats', {
        _fixture_id: fixtureId,
        _approver: player?.id,
        _season_id: currentRole?.activeSeason?.id,
        _division_id: currentRole?.team?.division?.id,
        _scoring_mode: 2,
        _points_for_win: 3,
        _points_for_draw: 1,
      });

      if (error) {
        console.error('RPC failed:', error.message);
      } else if (data.success) {
        console.log(data.message); // Show success toast or redirect
        Toast.show({
          type: 'success',
          text1: 'Results Approved',
          text2: 'The results have been successfully approved.',
        });
        console.log('navigating to home');
        router.back();
      } else {
        console.error('Approval failed:', data.message); // Show error toast
      }
      setApprovingResults(false);
    }
  };

  const handleDisputeResults = async () => {
    setDisputedFrames([]);
  };

  return (
    <SafeViewWrapper bottomColor="bg-bg-grouped-1" topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`Approve Results`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1">
        <View className="gap-2 border-b border-separator bg-bg-grouped-2 px-5 py-3">
          <View className="flex-row items-center justify-start gap-5">
            <TeamLogo
              size={30}
              type={fixtureDetails?.homeTeam?.crest?.type}
              color1={fixtureDetails?.homeTeam?.crest?.color1}
              color2={fixtureDetails?.homeTeam?.crest?.color2}
              thickness={fixtureDetails?.homeTeam?.crest?.thickness}
            />
            <Text
              numberOfLines={1}
              className="flex-1 pt-1 text-left font-saira-medium text-2xl text-text-1">
              {fixtureDetails?.homeTeam?.display_name}
            </Text>
            <Text className="pt-3 text-center font-saira-bold text-3xl text-text-1">
              {results.filter((result) => result.home_player.id === result?.winner_id).length}
            </Text>
          </View>
          <View className="flex-row items-center justify-start gap-5">
            <TeamLogo
              size={30}
              type={fixtureDetails?.awayTeam?.crest?.type}
              color1={fixtureDetails?.awayTeam?.crest?.color1}
              color2={fixtureDetails?.awayTeam?.crest?.color2}
              thickness={fixtureDetails?.awayTeam?.crest?.thickness}
            />
            <Text
              numberOfLines={1}
              className="flex-1 pt-1 text-left font-saira-medium text-2xl text-text-1">
              {fixtureDetails?.awayTeam?.display_name}
            </Text>
            <Text className="pt-3 text-center font-saira-bold text-3xl text-text-1">
              {results.filter((result) => result.away_player.id === result?.winner_id).length}
            </Text>
          </View>
        </View>
        <ScrollView className="flex-1">
          <View className=""></View>
          <ConfirmFramesList
            results={results}
            isLoading={isLoading}
            disputedFrames={disputedFrames}
            setDisputedFrames={setDisputedFrames}
          />
        </ScrollView>
        <View className="gap-3 p-4">
          {disputedFrames.length > 0 && (
            <CTAButton
              type="error"
              text={`Dispute ${disputedFrames.length > 1 ? `${disputedFrames.length}${' '}` : ''}Result${disputedFrames.length > 1 ? 's' : ''}`}
              callbackFn={handleDisputeResults}
            />
          )}
          {disputedFrames.length === 0 && (
            <>
              <CTAButton
                loading={approvingResults}
                type="success"
                text="Approve Results"
                callbackFn={handleApproveResults}
              />
              <Text className="text-center font-saira text-lg text-text-2">
                Or tap on 1 or more frames to dispute.
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default ApproveResults;

const styles = StyleSheet.create({});
