import { StyleSheet, Text, View, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';

const AdminOrPlayer = () => {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
        }}
      />
      <View className="flex-1 bg-brand">
        <View className="p-5">
          <Text className="mb-4 font-delagothic text-6xl font-bold text-text-on-brand">
            Select your role.
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            Would you like proceed as a league admin or a player?
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

        <View className="justify-end gap-5 rounded-t-3xl bg-brand-dark p-6 pb-16 pt-10">
          <CTAButton
            type="white"
            text="I'm a league admin"
            callbackFn={() =>
              router.push({
                pathname: '/(main)/onboarding/unique-code',
                params: { isNewTeam: true },
              })
            }
          />
          <View>
            <CTAButton
              type="yellow"
              text="I'm a player"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/create-join-team',
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

export default AdminOrPlayer;

const styles = StyleSheet.create({});
