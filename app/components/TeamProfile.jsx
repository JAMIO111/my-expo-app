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

const trophies = [
  { id: 3, name: 'Top Scorer', image: require('../assets/trophies/trophy-3-gold.png') },
  { id: 12, name: 'Defensive Wall', image: require('../assets/trophies/trophy-3-silver.png') },
  { id: 2, name: 'Perfect Season', image: require('../assets/trophies/trophy-2-gold.png') },
  { id: 10, name: 'Sportsmanship', image: require('../assets/trophies/trophy-1-silver.png') },
  { id: 4, name: 'Best Defense', image: require('../assets/trophies/trophy-4-gold.png') },
  { id: 15, name: 'Ultimate Fan', image: require('../assets/trophies/trophy-6-silver.png') },
  { id: 5, name: 'Fair Play Award', image: require('../assets/trophies/trophy-5-gold.png') },
  { id: 1, name: 'League Champion', image: require('../assets/trophies/trophy-1-gold.png') },
  { id: 13, name: 'Strategic Genius', image: require('../assets/trophies/trophy-4-silver.png') },
  { id: 7, name: 'Fan Favorite', image: require('../assets/trophies/trophy-7-gold.png') },
  { id: 9, name: 'Community Impact', image: require('../assets/trophies/trophy-9-gold.png') },
  { id: 18, name: 'Legacy Builder', image: require('../assets/trophies/trophy-9-silver.png') },
  { id: 6, name: 'Most Improved Team', image: require('../assets/trophies/trophy-6-gold.png') },
  { id: 14, name: 'Team Spirit', image: require('../assets/trophies/trophy-5-silver.png') },
  {
    id: 16,
    name: 'Leadership Excellence',
    image: require('../assets/trophies/trophy-7-silver.png'),
  },
  { id: 11, name: 'Rising Star', image: require('../assets/trophies/trophy-2-silver.png') },
  { id: 8, name: 'Best Coach', image: require('../assets/trophies/trophy-8-gold.png') },
  { id: 17, name: 'Innovation in Play', image: require('../assets/trophies/trophy-8-silver.png') },
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
            <Text className="mb-3 max-w-xs font-saira text-xl font-medium text-text-2">
              {profile?.division?.district?.name} - {profile?.division?.name}
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
