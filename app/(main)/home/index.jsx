import { Stack } from 'expo-router';
import {
  StyleSheet,
  Text,
  Image,
  Touchable,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useUser } from 'contexts/UserProvider';
import LoadingSplash from 'components/LoadingSplash';
import HorizontalScrollUpcomingFixtures from 'components/HorizontalScrollUpcomingFixtures';
import CTAButton from 'components/CTAButton';
import ResultsHomeCard from 'components/ResultsHomeCard';
import LeagueHomeCard from 'components/LeagueHomeCard';
import FixturesHomeCard from 'components/FixturesHomeCard';
import TeamLogo from 'components/TeamLogo';

const Home = () => {
  const { player } = useUser();
  console.log('User:', player);
  if (!player) {
    return <LoadingSplash />;
  }
  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          header: () => (
            <View className="bg-brand h-16 flex-row items-center justify-center">
              <Text className="font-michroma text-2xl font-bold text-white">Break</Text>
              <Image
                source={require('../../../assets/Break-Room-Logo-1024-Background.png')}
                className="mx-1 h-12 w-12"
                resizeMode="contain"
              />
              <Text className="font-michroma text-2xl font-bold text-white">Room</Text>
            </View>
          ),
        }}
      />

      <ScrollView
        className="bg-brand flex-1"
        contentContainerStyle={{ allignItems: 'center', justifyContent: 'center' }}>
        <View className="mt-4">
          <View className="w-full items-center justify-center gap-3 p-3 pb-4">
            <View className="w-full items-center justify-between">
              <Text className="w-full text-left text-xl font-bold text-white">
                {player.team.name} Fixtures
              </Text>
              <HorizontalScrollUpcomingFixtures />
            </View>
            <View className="border-border-color my-2 h-1 w-full items-center justify-between border-b"></View>
            <FixturesHomeCard />
            <ResultsHomeCard />
            <LeagueHomeCard />
          </View>
          <View className="bg-background-dark w-full gap-2 p-3 pb-10">
            <TeamLogo type="Diagonal Stripe" />
            <TeamLogo type="Vertical Stripe" />
            <TeamLogo type="Horizontal Stripe" />
            <TeamLogo type="Spots" />
            <TeamLogo type="Solids" />

            <CTAButton text="League Rules" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({});
