import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import PlayersList from '@components/PlayersList';
import Heading from '@components/Heading';
import TeamLogo from '@components/TeamLogo';
import CTAButton from '@components/CTAButton';
import StatCard from '@components/StatCard';
import CachedImage from '@components/CachedImage';
import { Dimensions } from 'react-native';
import TrophyCabinet from '@components/TrophyCabinet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTeamAwards } from '@hooks/useTeamAwards';
import { trophyIcons } from '../lib/badgeIcons';

const TeamProfile = ({ context, profile, isLoading }) => {
  if (isLoading || !profile)
    return (
      <>
        <Stack.Screen
          options={{
            header: () => (
              <View className="h-16 flex-row items-center justify-center bg-brand"></View>
            ),
          }}
        />
      </>
    );
  console.log('Team Profile Component - profile prop:', profile.id);
  const { data: teamAwards } = useTeamAwards(profile?.id);

  console.log('Team Awards Data:', teamAwards);

  const { line_1, line_2, city, postcode } = profile?.address || {};
  console.log('Debug Team Profile:', profile);

  const trophyIconMap = Object.fromEntries(trophyIcons.map((t) => [t.key, t]));

  const trophies = teamAwards?.map((award) => {
    const trophyDef = trophyIconMap[award.reward];

    return {
      ...award,
      image: trophyDef?.icon ?? null,
    };
  });

  return (
    <ScrollView className="flex-1 bg-bg-1" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="border-b border-theme-gray-3">
        {profile.cover_image_url && (
          <CachedImage
            avatarUrl={profile.cover_image_url}
            userId={profile?.id}
            width={Dimensions.get('window').width}
            height={(Dimensions.get('window').width * 9) / 16}
            borderRadius={0}
          />
        )}
      </View>
      <View className=" items-items-start w-full flex-row justify-start gap-8 border-b border-theme-gray-5 bg-bg-grouped-2 py-5 pl-5">
        <View className="items-center justify-start gap-4">
          <View className="rounded-full border border-separator">
            <TeamLogo
              size={68}
              color1={profile?.crest?.color1}
              color2={profile?.crest?.color2}
              type={profile?.crest?.type}
              thickness={profile?.crest?.thickness}
            />
          </View>
          <Text className="rounded-lg border border-theme-gray-4 bg-bg-grouped-3 px-4 py-1 font-saira text-lg font-semibold text-text-1">
            {profile?.abbreviation}
          </Text>
        </View>
        <View className="max-w-full items-start justify-between gap-2">
          <View>
            <Text className="mt-2 max-w-xs font-saira text-3xl font-bold text-text-1">
              {profile?.name || 'No Name'}
            </Text>
            <Text className="mb-3 max-w-xs font-saira text-xl font-medium text-text-2">
              {profile?.division?.district?.name} - {profile?.division?.name || 'No Division'}
            </Text>
          </View>
          <View className="gap-1">
            <Text style={{ lineHeight: 20 }} className="max-w-xs font-saira text-lg text-text-2">
              {[line_1, line_2].filter(Boolean).join(', ')}
            </Text>
            <Text style={{ lineHeight: 20 }} className="max-w-xs font-saira text-lg text-text-2">
              {[city, postcode].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      </View>
      <View className="bg-bg-grouped-1 px-3 pb-12 pt-8">
        <Heading text="Team Stats" />
        <View className="mb-8 gap-4">
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard title="Matches Played" value="86" />
              <StatCard title="Win %" value="68%" />
            </View>
            <View className="flex-row gap-3">
              <StatCard title="Wins" value="52" />
              <StatCard title="Losses" value="34" />
            </View>
          </View>
          <CTAButton
            icon={<Ionicons name="podium-outline" size={22} color="white" />}
            type="brand"
            text="View All Stats"
            callbackFn={() => {}}
          />
        </View>
        <Heading text="Team Awards" />
        <TrophyCabinet trophies={trophies || []} />
        <View className="mb-8">
          <Heading text="Team Roster" />
          <PlayersList team={profile} context={context} />
        </View>
      </View>
    </ScrollView>
  );
};

export default TeamProfile;

const styles = StyleSheet.create({});
