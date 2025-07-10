import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import PlayersList from '@components/PlayersList';
import Heading from '@components/Heading';
import LoadingSplash from '@components/LoadingSplash';
import TeamLogo from '@components/TeamLogo';
import CTAButton from '@components/CTAButton';
import StatCard from '@components/StatCard';

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
        <LoadingSplash />
      </>
    );

  const { line_1, line_2, city, postcode } = profile?.address || {};

  return (
    <ScrollView className=" flex-1 bg-bg-1" contentContainerStyle={{ flexGrow: 1 }}>
      <Image source={require('@assets/cover-photo.jpg')} style={{ width: '100%', height: 200 }} />
      <View className=" w-full flex-row items-center justify-start gap-6 border-b border-separator bg-bg-grouped-2 py-5 pl-5">
        <View className="items-center justify-center gap-3">
          <View className="rounded-full border border-separator">
            <TeamLogo
              size={60}
              color1={profile?.crest?.color1}
              color2={profile?.crest?.color2}
              type={profile?.crest?.type}
              thickness={profile?.crest?.thickness}
            />
          </View>
          <Text className=" rounded-lg bg-bg-grouped-3 px-4 py-1 font-saira text-lg font-semibold text-text-1">
            {profile?.abbreviation}
          </Text>
        </View>
        <View className="max-w-full items-start justify-between gap-2">
          <View>
            <Text className="max-w-xs font-saira text-3xl font-bold text-text-1">
              {profile?.name}
            </Text>
            <Text className="max-w-xs font-saira text-lg font-semibold text-text-2">
              {profile?.division?.district?.name} - {profile?.division?.name}
            </Text>
          </View>
          <View className="gap-1">
            <Text style={{ lineHeight: 16 }} className="text-md max-w-xs font-saira text-text-3">
              {line_1} {line_2}
            </Text>
            <Text style={{ lineHeight: 16 }} className="text-md max-w-xs font-saira text-text-3">
              {city} {postcode}
            </Text>
          </View>
        </View>
      </View>
      <View className="gap-5 bg-bg-grouped-1 px-3 pb-12 pt-6">
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
        <CTAButton type="success" text="View Team Stats" icon={null} callbackFn={() => {}} />
        <View className="">
          <Heading text="Roster" />
          <PlayersList team={profile} context={context} />
        </View>
      </View>
    </ScrollView>
  );
};

export default TeamProfile;

const styles = StyleSheet.create({});
