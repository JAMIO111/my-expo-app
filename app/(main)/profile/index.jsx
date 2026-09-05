import { Text, View, ScrollView, Image, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import NavBar from '@components/NavBar2';
import CustomHeader from '@components/CustomHeader';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Cog } from 'lucide-react-native';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import { calculateLevel } from '@lib/helperFunctions';
import CachedImage from '@components/CachedImage';
import { useGlobalRank } from '@hooks/useGlobalRank';
import Heading from '@components/Heading';
import useRecentBadges from '@hooks/useRecentBadges';
import { badgeIcons } from '@lib/badgeIcons';
import {
  LockKeyholeOpen,
  Trophy,
  Star,
  ChartNoAxesCombined,
  ClipboardClock,
  Award,
} from 'lucide-react-native';
import CTAButton from '@components/CTAButton';
import PlayerProfileHeader from '@components/PlayerProfileHeader';

const ProfilePage = () => {
  const router = useRouter();
  const { player, currentRole } = useUser();
  const { data: globalRank, isLoading: isGlobalRankLoading } = useGlobalRank(player?.id);
  const { data: recentBadges, isLoading: isRecentBadgesLoading } = useRecentBadges(player?.id);

  console.log('Recent Badges:', recentBadges);

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

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
                        rightIcon={Cog}
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

      <ScrollView className="mt-16 flex-1 bg-brand">
        <View className="flex-1 bg-bg-grouped-1 pb-8">
          <PlayerProfileHeader playerProfile={player} currentTeam={currentRole?.team} />
          <Pressable className="mt-8 px-5" onPress={() => router.push('/profile/leaderboard')}>
            <View style={{ borderRadius: 20 }} className="mb-6 bg-brand-dark p-2 shadow-sm">
              <View
                style={{ borderRadius: 18 }}
                className="flex-row items-center justify-around gap-2 bg-brand p-2 pt-3 shadow">
                <View className="flex-1 items-center">
                  <Star size={24} color="white" />
                  <Text className="text-center font-saira text-lg text-text-on-brand">XP</Text>
                  <Text className="text-center font-saira-semibold text-2xl text-white">
                    {player?.xp}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Trophy size={24} color="white" />
                  <Text className="text-center font-saira text-lg text-text-on-brand">Level</Text>
                  <Text className="text-center font-saira-semibold text-2xl text-white">
                    {calculateLevel(player?.xp).level}
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Ionicons name="earth" size={24} color="white" />
                  <Text className="text-center font-saira text-lg text-text-on-brand">Rank</Text>
                  <Text className="text-center font-saira-semibold text-2xl text-white">
                    {isGlobalRankLoading ? '...' : (globalRank?.rank ?? 'N/A')}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
          <View className="mb-8 mt-2 flex-row items-center justify-between gap-5 px-5">
            <View className="flex-1">
              <CTAButton
                type="brand"
                text="View Rankings"
                callbackFn={() => router.push('/profile/leaderboard')}
                icon={<Ionicons name="podium" size={19} color="white" />}
              />
            </View>
            <View className="flex-1">
              <CTAButton
                type="yellow"
                text="View Stats"
                callbackFn={() => router.push('/profile/stats')}
                lucideIcon={<ChartNoAxesCombined size={24} color="black" />}
              />
            </View>
          </View>
          <Heading text="Recently Earned Badges" className="mx-4 mb-2" />
          <View
            style={{ borderRadius: 28 }}
            className="mx-4 gap-2 border border-theme-gray-4 bg-bg-1 py-3">
            {recentBadges && recentBadges?.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 20, paddingRight: 20 }}
                className="flex-row px-6 py-3">
                {recentBadges.map((badge) => {
                  const fullKey = `${badge?.Badges?.key}-${badge?.tier}`;
                  console.log(
                    'Badge:',
                    badge,
                    'Full Key:',
                    fullKey,
                    'Icon Source:',
                    badgeIcons[fullKey]
                  );
                  const iconSource = badgeIcons[fullKey];
                  return (
                    <Pressable
                      onPress={() => router.push('/profile/badges')}
                      className="flex-1 items-center rounded-2xl border border-theme-gray-5 bg-bg-2 shadow-sm"
                      key={badge.id}>
                      <Image
                        source={iconSource}
                        className="h-36 w-28 rounded-xl"
                        resizeMode="contain"
                      />
                      <View
                        style={{
                          borderBottomLeftRadius: 14,
                          borderBottomRightRadius: 14,
                        }}
                        className="mt-2 flex-row items-center gap-2 border-t border-theme-gray-4 bg-bg-1 p-2 py-1">
                        <LockKeyholeOpen size={16} color="#444" />
                        <Text
                          className="text-center font-tektur-semibold text-text-2"
                          numberOfLines={2}
                          ellipsizeMode="tail">
                          {new Date(badge?.unlocked_at).toLocaleDateString()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="items-center justify-center p-6">
                <Ionicons name="ribbon-outline" size={70} color="#909" />

                <Text className="mt-5 text-center font-saira-medium text-2xl text-text-1">
                  No recent badges unlocked.
                </Text>
                <Text className="text-center font-saira text-lg text-text-2">
                  Keep playing to earn your first!
                </Text>
              </View>
            )}
            <View className="px-3">
              <CTAButton
                text="See all Badges"
                type="brand"
                callbackFn={() => router.push('/profile/badges')}
                lucideIcon={<Award size={24} color="white" />}
              />
            </View>
          </View>
          <View
            style={{ borderRadius: 28 }}
            className="mx-4 mt-4 gap-2 border border-theme-gray-4 bg-bg-1 p-3">
            <CTAButton
              text="View Match History"
              type="brand"
              callbackFn={() => router.push('/profile/frames')}
              lucideIcon={<ClipboardClock size={24} color="white" />}
            />
          </View>
        </View>
      </ScrollView>
      <NavBar />
    </SafeViewWrapper>
  );
};

export default ProfilePage;
