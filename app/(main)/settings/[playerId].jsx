import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import { useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import useUserProfile from '@/hooks/useUserProfile';
import Avatar from '@components/Avatar';
import { isBirthdayToday, getAgeInYearsAndDays } from '@lib/helperFunctions';

const PlayerId = () => {
  const { currentRole, player } = useUser();
  const { playerId, status } = useLocalSearchParams();
  console.log('Player ID:', playerId);
  console.log('Player Status:', status);
  const { data: playerProfile, isLoading, error } = useUserProfile?.(playerId);

  const { years, days } = getAgeInYearsAndDays(playerProfile?.dob);

  const relevantDate = status === 'active' ? playerProfile?.joined_at : playerProfile?.requested_at;

  const promoteToCaptain = () => {
    // Logic to promote the player to captain
  };

  const acceptRequest = () => {
    // Logic to accept the player request
  };

  const denyRequest = () => {
    // Logic to deny the player request
  };

  const revokeInvite = () => {
    // Logic to revoke the player invite
  };

  const removePlayer = () => {
    // Logic to remove the player from the team
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title={`${playerProfile?.first_name} ${playerProfile?.surname}`} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1">
        <Text
          className={`${status === 'active' ? 'border-theme-green bg-theme-green/30 text-black' : status === 'invited' ? 'border-theme-teal bg-theme-teal/30 text-black' : status === 'requested' ? 'border-theme-purple bg-theme-purple/30 text-black' : ''} border-b-2 p-3 text-center font-saira-medium text-2xl`}>
          {status === 'active' && 'Active Player'}
          {status === 'requested' && 'Awaiting Approval'}
          {status === 'invited' && 'Invite Sent'}
        </Text>
        <ScrollView
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
          className="flex-1 bg-bg-grouped-1 p-5">
          <View className="mt-4 items-center">
            <View className="overflow-hidden rounded-2xl border-2 border-text-1">
              <Avatar player={playerProfile} size={150} borderRadius={12} />
            </View>
            <Text
              style={{ lineHeight: 40 }}
              className="mt-6 font-saira-semibold text-4xl text-text-1">
              {playerProfile?.first_name} {playerProfile?.surname}
            </Text>
            <Text className="mt-2 font-saira-medium text-3xl text-text-2">
              {playerProfile?.nickname}
            </Text>
          </View>
          <View className="mt-6 gap-2.5 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Team</Text>
              <Text className="font-saira-semibold text-lg text-text-1">
                {playerProfile?.team_name}
              </Text>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">League</Text>
              <Text className="font-saira-semibold text-lg text-text-1">
                {playerProfile?.district_name} - {playerProfile?.division_name}
              </Text>
            </View>

            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">Date of Birth</Text>
              <View className="flex-row items-center gap-3">
                {playerProfile?.dob && isBirthdayToday(playerProfile.dob) && (
                  <Image
                    source={require('@assets/birthday-cake.png')}
                    className="h-6 w-6"
                    resizeMode="contain"
                  />
                )}
                <Text className="font-saira-semibold text-lg text-text-1">
                  {playerProfile?.dob
                    ? new Date(playerProfile.dob).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })
                    : 'Birthday Unavailable'}
                </Text>
              </View>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between ">
              <Text className="font-saira-medium text-xl text-text-2">Age</Text>
              <Text className="font-saira-semibold text-lg text-text-1">
                {playerProfile?.dob ? `${years} Years ${days} days` : 'Age Unavailable'}
              </Text>
            </View>
            <View className="border-t border-theme-gray-5"></View>
            <View className="w-full flex-row items-center justify-between">
              <Text className="font-saira-medium text-xl text-text-2">
                {status === 'active'
                  ? 'Member Since'
                  : status === 'invited'
                    ? 'Invited On'
                    : 'Requested On'}
              </Text>
              <Text className="font-saira-semibold text-lg text-text-1">
                {new Date(relevantDate).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View className="mt-8 w-full gap-5">
            {status !== 'invited' && (
              <CTAButton
                text={status === 'active' ? 'Promote to Captain' : 'Accept Request'}
                type="success"
                onPress={
                  status === 'active'
                    ? promoteToCaptain
                    : status === 'requested'
                      ? acceptRequest
                      : null
                }
              />
            )}
            <CTAButton
              text={
                status === 'active'
                  ? 'Remove Player'
                  : status === 'requested'
                    ? 'Deny Request'
                    : 'Revoke Invite'
              }
              type="error"
              onPress={
                status === 'active'
                  ? removePlayer
                  : status === 'requested'
                    ? denyRequest
                    : status === 'invited'
                      ? revokeInvite
                      : null
              }
            />
          </View>
        </ScrollView>
      </View>
    </SafeViewWrapper>
  );
};

export default PlayerId;

const styles = StyleSheet.create({});
