import { Text, View, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import NavBar from '@components/NavBar2';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import CachedImage from '@components/CachedImage';
import Heading from '@components/Heading';
import { isBirthdayToday } from '@lib/helperFunctions';
import CustomHeader from '@components/CustomHeader';

const ProfilePage = () => {
  const router = useRouter();
  const { player } = useUser();

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}`;
  };

  const { years, days } = getAgeInYearsAndDays(player?.dob);

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <StatusBar style="light" backgroundColor="#000" />
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useTopInset={false} useBottomInset={false}>
              <CustomHeader title="My Profile" showBack={false} />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-bg-grouped-1 p-5">
        <View className="flex-1 bg-bg-grouped-1">
          <View className="mb-2 items-center p-2 ">
            {player?.avatar_url ? (
              <View className="overflow-hidden rounded-3xl bg-text-2 p-1">
                <CachedImage
                  avatarUrl={player?.avatar_url}
                  userId={player?.id}
                  width={150}
                  height={150}
                  borderRadius={16}
                />
              </View>
            ) : (
              <View
                style={{ width: 150, height: 150 }}
                className="items-center justify-center rounded-2xl border border-brand-light bg-brand-light">
                <Text style={{ lineHeight: 130 }} className="font-saira-medium text-6xl text-white">
                  {getInitials(player?.first_name, player?.surname)}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View className="w-full pt-8">
          <Heading text="Personal Details" />
          <View className="gap-2.5 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Full Name</Text>
              <View className="flex-row items-center gap-3">
                <Text className="font-saira-semibold text-lg text-text-1">
                  {player?.first_name} {player?.surname}
                </Text>
              </View>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Nickname</Text>
              <View className="flex-row items-center gap-3">
                <Text className="font-saira-semibold text-lg text-text-1">{player?.nickname}</Text>
              </View>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Date of Birth</Text>
              <View className="flex-row items-center gap-3">
                {isBirthdayToday(player?.dob) && (
                  <Image
                    source={require('@assets/birthday-cake.png')}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                )}
                <Text className="font-saira-semibold text-lg text-text-1">
                  {new Date(player?.dob).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </Text>
              </View>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between ">
              <Text className="font-saira-medium text-xl text-text-2">Age</Text>
              <Text className="font-saira-semibold text-lg text-text-1">{`${years} Years ${days} days`}</Text>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Member Since</Text>
              <Text className="font-saira-semibold text-lg text-text-1">
                {new Date(player?.created_at).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <NavBar type="onboarding" />
    </SafeViewWrapper>
  );
};

export default ProfilePage;
