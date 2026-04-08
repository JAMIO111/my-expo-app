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
import Avatar from '@components/Avatar';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import LoadingScreen from '@components/LoadingScreen';

const ApproveResults = () => {
  const { player } = useUser();
  const [disputedFrames, setDisputedFrames] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const { fixtureId } = useLocalSearchParams();
  const { data: results, isLoading } = useResultsByFixture(fixtureId);
  const { data: fixtureDetails, isLoading: fixtureLoading } = useFixtureDetails(fixtureId);
  console.log('fixtureDetails in ApproveResults:', fixtureDetails);

  const handleApproveResults = async () => {
    setQueryLoading(true);
    try {
      const { error } = await supabase
        .from('Fixtures')
        .update({ approved: true, approved_at: new Date().toISOString(), approved_by: player?.id })
        .eq('id', fixtureId)
        .select();

      if (error) {
        throw error;
      }
      console.log('Results approved successfully'); // Show success toast or redirect
      Toast.show({
        type: 'success',
        text1: 'Results Approved',
        text2: 'The results have been successfully approved.',
      });
      console.log('navigating to home');
      router.back();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Approval Failed',
        text2: 'An error occurred while approving the results. Please try again.',
      });
      console.error('Error approving results:', error);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDisputeResults = async () => {
    setQueryLoading(true);
    try {
      const { error } = await supabase.rpc('update_disputed_frames', {
        p_fixture_id: fixtureId,
        p_frames: disputedFrames,
      });
      if (error) {
        throw error;
      }
      Toast.show({
        type: 'success',
        text1: 'Results Disputed',
        text2: 'The selected frames have been disputed and the home team has been notified.',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Dispute Failed',
        text2: 'An error occurred while disputing the results. Please try again.',
      });
      console.error('Error disputing results:', error);
    } finally {
      setQueryLoading(false);
    }
  };

  return (
    <SafeViewWrapper
      bottomColor={isLoading || fixtureLoading ? 'bg-brand' : 'bg-bg-grouped-1'}
      topColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`Approve Results`} />
            </SafeViewWrapper>
          ),
        }}
      />
      {isLoading || fixtureLoading ? (
        <LoadingScreen />
      ) : (
        <View className="mt-16 flex-1 bg-bg-grouped-1">
          <View className="gap-2 border-b border-separator bg-bg-grouped-2 px-5 py-3">
            <View className="flex-row items-center justify-start gap-2">
              {fixtureDetails?.competitor_type === 'team' ? (
                <TeamLogo
                  size={36}
                  type={fixtureDetails?.homeTeam?.crest?.type}
                  color1={fixtureDetails?.homeTeam?.crest?.color1}
                  color2={fixtureDetails?.homeTeam?.crest?.color2}
                  thickness={fixtureDetails?.homeTeam?.crest?.thickness}
                />
              ) : (
                <Avatar size={36} borderRadius={18} player={fixtureDetails?.homePlayer} />
              )}
              <Text className="ml-3 pt-1 font-saira-medium text-2xl text-text-1">
                {fixtureDetails?.competitor_type === 'team'
                  ? fixtureDetails?.homeTeam?.abbreviation
                  : `(${fixtureDetails?.homePlayer?.nickname})`}
              </Text>
              <Text
                numberOfLines={1}
                className="flex-1 pt-1 text-left font-saira-medium text-2xl text-text-2">
                {fixtureDetails?.competitor_type === 'team'
                  ? fixtureDetails?.homeTeam?.display_name
                  : `${fixtureDetails?.homePlayer?.first_name} ${fixtureDetails?.homePlayer?.surname}`}
              </Text>
              <Text className="pt-3 text-center font-saira-bold text-3xl text-text-1">
                {results.filter((result) => result.winner_side === 'home').length}
              </Text>
            </View>
            <View className="flex-row items-center justify-start gap-2">
              {fixtureDetails?.competitor_type === 'team' ? (
                <TeamLogo
                  size={36}
                  type={fixtureDetails?.awayTeam?.crest?.type}
                  color1={fixtureDetails?.awayTeam?.crest?.color1}
                  color2={fixtureDetails?.awayTeam?.crest?.color2}
                  thickness={fixtureDetails?.awayTeam?.crest?.thickness}
                />
              ) : (
                <Avatar size={36} borderRadius={18} player={fixtureDetails?.awayPlayer} />
              )}
              <Text className="ml-3 pt-1 font-saira-medium text-2xl text-text-1">
                {fixtureDetails?.competitor_type === 'team'
                  ? fixtureDetails?.awayTeam?.abbreviation
                  : `(${fixtureDetails?.awayPlayer?.nickname})`}
              </Text>

              <Text
                numberOfLines={1}
                className="flex-1 pt-1 text-left font-saira-medium text-2xl text-text-2">
                {fixtureDetails?.competitor_type === 'team'
                  ? fixtureDetails?.awayTeam?.display_name
                  : `${fixtureDetails?.awayPlayer?.first_name} ${fixtureDetails?.awayPlayer?.surname}`}
              </Text>
              <Text className="pt-3 text-center font-saira-bold text-3xl text-text-1">
                {results.filter((result) => result.winner_side === 'away').length}
              </Text>
            </View>
          </View>
          <ScrollView className="flex-1">
            <ConfirmFramesList
              results={results}
              isLoading={isLoading}
              disputedFrames={disputedFrames}
              setDisputedFrames={setDisputedFrames}
            />
          </ScrollView>
          <View className="gap-3 p-4 pb-0">
            {disputedFrames.length > 0 && (
              <CTAButton
                loading={queryLoading}
                type="error"
                text={`Dispute ${disputedFrames.length > 1 ? `${disputedFrames.length}${' '}` : ''}Result${disputedFrames.length > 1 ? 's' : ''}`}
                callbackFn={handleDisputeResults}
              />
            )}
            {disputedFrames.length === 0 && (
              <>
                <CTAButton
                  loading={queryLoading}
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
      )}
    </SafeViewWrapper>
  );
};

export default ApproveResults;

const styles = StyleSheet.create({});
