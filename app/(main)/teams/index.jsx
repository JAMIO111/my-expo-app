import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import PlayersList from '@components/PlayersList';
import Heading from '@components/Heading';
import LoadingSplash from '@components/LoadingSplash';
import TeamLogo from '@components/TeamLogo';
import CustomHeader from '@components/CustomHeader';
import CTAButton from '@components/CTAButton';
import StatCard from '@components/StatCard';
import NavBar from '@components/NavBar';
import SafeViewWrapper from '@components/SafeViewWrapper';

const index = () => {
  const { user, player, loading } = useUser();

  if (loading || !player)
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

  console.log('Debug Player:', player);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={false} title={player?.team?.name || 'Team'} />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView className="mt-16 flex-1 bg-bg-1" contentContainerStyle={{ flexGrow: 1 }}>
        <Image source={require('@assets/cover-photo.jpg')} style={{ width: '100%', height: 200 }} />
        <View className=" w-full flex-row items-center justify-start gap-6 border-b border-separator bg-bg-grouped-2 pl-5">
          <View className="items-center justify-center gap-2">
            <View className="rounded-full border border-separator">
              <TeamLogo
                size={60}
                color1="blue"
                color2="yellow"
                type="Horizontal Stripe"
                thickness="2"
              />
            </View>
            <Text className=" rounded-lg bg-bg-grouped-3 px-4 py-1 text-lg font-semibold text-text-1">
              {player.team?.abbreviation}
            </Text>
          </View>
          <View className="max-w-full py-5">
            <Text className="max-w-xs text-3xl font-extrabold text-text-1">
              {player?.team?.name}
            </Text>
            <Text className="max-w-xs text-lg font-medium text-text-2">
              {player?.team.display_name}
            </Text>
            <Text className="text-md max-w-xs font-medium text-text-3">
              Shankhouse Club, Cramlington Shankhouse Club, Cramlington
            </Text>
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
          <CTAButton type="success" text="View All Stats" icon={null} callbackFn={() => {}} />
          <View className="">
            <Heading text="Roster" />
            <PlayersList team={player.team} context="teams" />
          </View>
        </View>
      </ScrollView>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
