import { StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';

const ProfileCreation5 = () => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
        }}
      />
      <View className="flex-1 bg-bg-grouped-1">
        <View className="p-5">
          <Text className="mb-4 font-delagothic text-6xl font-bold text-text-1">
            Let's get you affiliated.
          </Text>
          <Text className="font-saira text-2xl text-text-2">
            Would you like to create a new team or join an existing one?
          </Text>
        </View>
        <View className="flex-1 items-center justify-center p-5">
          <View className="overflow-hidden rounded-2xl shadow-lg">
            <Image
              source={require('@assets/pool-player-cartoon.jpg')}
              className="h-60 w-60 rounded-2xl"
              resizeMode="cover"
            />
          </View>
        </View>

        <View className="justify-end gap-5 rounded-t-3xl bg-bg-grouped-2 p-6 pb-16 pt-10">
          <CTAButton
            type="info"
            text="Create a new team"
            callbackFn={() =>
              router.push({
                pathname: '/(main)/onboarding/profile-creation-team-code',
                params: { isNewTeam: true },
              })
            }
          />
          <View>
            <CTAButton
              type="success"
              text="Join existing team"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/profile-creation-team-code',
                  params: { isNewTeam: false },
                })
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation5;

const styles = StyleSheet.create({});
