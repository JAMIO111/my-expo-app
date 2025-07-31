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

const trophies = [
  { id: 1, name: 'League Champion', image: require('../assets/trophy_1.png') },
  { id: 2, name: 'Perfect Season', image: require('../assets/trophy_2.png') },
  { id: 3, name: 'Top Scorer', image: require('../assets/trophy_3.png') },
  { id: 4, name: 'Best Defense', image: require('../assets/trophy_4.png') },
  { id: 5, name: 'Fair Play Award', image: require('../assets/trophy_5.png') },
  { id: 6, name: 'Most Improved Team', image: require('../assets/trophy_6.png') },
  { id: 7, name: 'Fan Favorite', image: require('../assets/trophy_7.png') },
  { id: 8, name: 'Best Coach', image: require('../assets/trophy_8.png') },
  { id: 9, name: 'Community Impact', image: require('../assets/trophy_9.png') },
];

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

  const { line_1, line_2, city, postcode } = profile?.address || {};
  console.log('Debug Team Profile:', profile);

  return (
    <ScrollView className="flex-1 bg-bg-1" contentContainerStyle={{ flexGrow: 1 }}>
      <View className="border-b border-theme-gray-3">
        <CachedImage
          avatarUrl={profile.cover_image_url}
          userId={profile?.id}
          width={Dimensions.get('window').width}
          height={(Dimensions.get('window').width * 9) / 16}
          borderRadius={0}
        />
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
              {profile?.name}
            </Text>
            <Text className="mb-3 max-w-xs font-saira text-lg font-semibold text-text-2">
              {profile?.division?.district?.name} - {profile?.division?.name}
            </Text>
          </View>
          <View className="gap-1">
            <Text style={{ lineHeight: 20 }} className="max-w-xs font-saira text-lg text-text-3">
              {line_1} {line_2}
            </Text>
            <Text style={{ lineHeight: 20 }} className="max-w-xs font-saira text-lg text-text-3">
              {city} {postcode}
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
          <CTAButton type="brand" text="View All Stats" callbackFn={() => {}} />
        </View>
        <TrophyCabinet trophies={trophies} />
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
