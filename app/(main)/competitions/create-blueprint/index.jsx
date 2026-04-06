import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import CTAButton from '@components/CTAButton';
import { useState } from 'react';

const index = () => {
  const router = useRouter();
  const [selected, setSelected] = useState(null);

  const getCardStyle = (type) => [
    'flex-row items-center bg-bg-1 gap-8 rounded-2xl p-4 border-2',
    selected === type ? 'border-blue-500' : 'border-transparent',
  ];

  const getImageStyle = (type) => [
    'h-20 w-20 rounded-lg border-2',
    selected === type ? 'border-blue-500' : 'border-transparent',
  ];

  const handleContinue = () => {
    if (!selected) {
      Toast.show({
        type: 'info',
        text1: 'Selection Required',
        text2: 'Please select a competition format before continuing.',
      });
      return;
    }
    router.push({
      pathname: '/competitions/create-blueprint/requirements',
      params: { competitionType: selected },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Create a Blueprint" />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <ScrollView
          contentContainerStyle={{
            display: 'flex',
            flexGrow: 1,
            gap: 20,
            paddingTop: 20,
            paddingBottom: 60,
          }}
          className="mt-16 flex-1 bg-brand px-4">
          <View className="flex-1 gap-4">
            <Text className="px-2 font-saira-medium text-xl text-text-on-brand">
              Select a competition format:
            </Text>
            <Pressable onPress={() => setSelected('league')}>
              <View className={getCardStyle('league').join(' ')}>
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-1">League Blueprint</Text>
                  <Text className="mt-2 font-saira text-sm text-text-2">
                    Create a blueprint for a tiered league competition, including divisions,
                    relegations and promotions.
                  </Text>
                </View>
                <Image
                  source={require('@assets/league-icon.png')}
                  className={getImageStyle('league').join(' ')}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => setSelected('knockout')}>
              <View className={getCardStyle('knockout').join(' ')}>
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-1">Knockout Blueprint</Text>
                  <Text className="mt-2 font-saira text-sm text-text-2">
                    Create a blueprint for a straight knockout competition. Configure rounds, legs,
                    bracket generation, and consolation matches.
                  </Text>
                </View>
                <Image
                  source={require('@assets/knockout-icon.png')}
                  className={getImageStyle('knockout').join(' ')}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => setSelected('league-playoff')}>
              <View className={getCardStyle('league-playoff').join(' ')}>
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-1">
                    League & Playoff Blueprint
                  </Text>
                  <Text className="mt-2 font-saira text-sm text-text-2">
                    Create a blueprint for a competition that combines league and playoff formats,
                    including divisions, relegations, promotions, and playoff rounds.
                  </Text>
                </View>
                <Image
                  source={require('@assets/league-playoff-icon.png')}
                  className={getImageStyle('league-playoff').join(' ')}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => setSelected('groups-knockout')}>
              <View className={getCardStyle('groups-knockout').join(' ')}>
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-1">
                    Groups & Knockout Blueprint
                  </Text>
                  <Text className="mt-2 font-saira text-sm text-text-2">
                    Create a blueprint for a competition that combines group stage and knockout
                    formats, including groups, rounds, legs, and aggregate scoring.
                  </Text>
                </View>
                <Image
                  source={require('@assets/groups-knockout-icon.png')}
                  className={getImageStyle('groups-knockout').join(' ')}
                />
              </View>
            </Pressable>
            <Pressable onPress={() => setSelected('round-robin')}>
              <View className={getCardStyle('round-robin').join(' ')}>
                <View className="flex-1">
                  <Text className="font-saira-medium text-xl text-text-1">
                    Round Robin Blueprint
                  </Text>
                  <Text className="mt-2 font-saira text-sm text-text-2">
                    Create a blueprint for a round robin competition, where each competitor plays
                    every other competitor a set number of times.
                  </Text>
                </View>
                <Image
                  source={require('@assets/round-robin-icon.png')}
                  className={getImageStyle('round-robin').join(' ')}
                />
              </View>
            </Pressable>
            {selected && <CTAButton type="yellow" text="Continue" callbackFn={handleContinue} />}
          </View>
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default index;

const styles = StyleSheet.create({});
