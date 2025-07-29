import { useState } from 'react';
import { Text, View, ScrollView, Image } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import NavBar from '@components/NavBar2';
import CustomHeader from '@components/CustomHeader';
import { useRouter } from 'expo-router';
import SlidingTabButton from '@components/SlidingTabButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import BadgeList from '@components/BadgeList';
import { usePlayerStats } from '@hooks/usePlayerStats';
import { calculateLevel } from '@lib/helperFunctions';
import PlayerStats from '@components/PlayerStats';

const ProfilePage = () => {
  const router = useRouter();
  const { user, player, currentRole } = useUser();
  const { data: playerStats, isLoading: isStatsLoading } = usePlayerStats(player?.id);
  const [view, setView] = useState('left');
  console.log('Debug User:', user);
  console.log('Debug Player:', player);
  console.log('Player stats:', playerStats);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <Stack.Screen
                options={{
                  header: () => (
                    <SafeViewWrapper useBottomInset={false}>
                      <CustomHeader
                        title="My Profile"
                        showBack={false}
                        rightIcon="settings-outline"
                        onRightPress={() => router.push('/settings')}
                      />
                    </SafeViewWrapper>
                  ),
                }}
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView className="mt-16 flex-1 bg-bg-grouped-1">
        <View className="flex-1 bg-bg-grouped-1 pt-5">
          <View className="mb-4 items-center p-2 ">
            <View className="rounded-full border-8 border-brand p-2">
              <View className="rounded-full border border-brand-light">
                <Image source={require('@assets/avatar.jpg')} className="h-40 w-40 rounded-full" />
              </View>
            </View>
          </View>
          <View className="mb-6">
            <Text
              style={{ lineHeight: 38 }}
              className="text-center font-saira-semibold text-4xl text-text-1">
              {player?.first_name} {player?.surname}
            </Text>
            <Text className="text-center font-saira text-xl text-text-2">
              {player?.nickname} | {getAgeInYearsAndDays(player?.dob).years} |{' '}
              {currentRole?.team?.display_name || 'No Team'}
            </Text>
          </View>
          <View className="px-5">
            <View className="mb-6 flex-row items-center justify-around gap-2 rounded-2xl bg-brand p-4 shadow">
              <View className="flex-1 items-center">
                <Ionicons name="trophy-outline" size={24} color="white" />
                <Text className="text-center font-saira text-xl text-gray-300">Level</Text>
                <Text className="text-center font-saira-semibold text-2xl text-white">
                  {calculateLevel(player?.xp).level}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Ionicons name="star-outline" size={24} color="white" />
                <Text className="text-center font-saira text-xl text-gray-300">Points</Text>
                <Text className="text-center font-saira-semibold text-2xl text-white">
                  {player?.xp}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Ionicons name="globe-outline" size={24} color="white" />
                <Text className="text-center font-saira text-xl text-gray-300">Rank</Text>
                <Text className="text-center font-saira-semibold text-2xl text-white">#23</Text>
              </View>
            </View>
          </View>
          <View className="rounded-t-3xl bg-bg-grouped-2 pt-4">
            <SlidingTabButton option1="Badges" option2="Stats" onChange={setView} />
            <View className="p-3">
              <View style={{ display: view === 'left' ? 'flex' : 'none' }}>
                <BadgeList />
              </View>
              <View style={{ display: view === 'right' ? 'flex' : 'none' }}>
                <PlayerStats playerId={player?.id} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <NavBar />
    </SafeViewWrapper>
  );
};

export default ProfilePage;
