import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { useState } from 'react';
import FramesList from '@components/FramesList';
import { useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { Stack } from 'expo-router';
import { useResultsByFixture } from '@hooks/useResultsByFixture';
import { useFixtureDetails } from '@hooks/useFixtureDetails';
import TeamLogo from '@components/TeamLogo';
import supabase from '@lib/supabaseClient';

const ApproveResults = () => {
  const [disputedFrames, setDisputedFrames] = useState([]);
  const { fixtureId } = useLocalSearchParams();
  const { data: results, isLoading } = useResultsByFixture(fixtureId);
  const { data: fixtureDetails } = useFixtureDetails(fixtureId);

  const handleApproveResults = async () => {
    try {
      const { data, error } = await supabase.rpc('update_player_stats_after_fixture', {
        _fixture_id: fixtureId,
      });
      if (error) {
        console.error('RPC error:', error);
      } else {
        console.log('RPC success:', data);
      }
    } catch (e) {
      console.error('Unexpected error:', e);
    }
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
        <ScrollView className="flex-1 py-2">
          <View className=""></View>
          <FramesList
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
              text={`Dispute ${disputedFrames.length > 1 ? disputedFrames.length : ''} Result${disputedFrames.length > 1 ? 's' : ''}`}
              callbackFn={handleDisputeResults}
            />
          )}
          {disputedFrames.length === 0 && (
            <>
              <CTAButton
                loading={true}
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
