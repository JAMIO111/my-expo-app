import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import Podium3D from '@components/Podium';
import { Stack, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamLogo from '@components/TeamLogo';

const index = () => {
  const { data, statKey, type, title } = useLocalSearchParams();
  console.log('Data:', data);
  const parsedData = JSON.parse(data);
  const sortedData = parsedData.sort((a, b) => b[statKey] - a[statKey]);
  console.log('Parsed Data:', parsedData);
  console.log('Sorted Data:', sortedData);
  console.log('Stat Key:', statKey);
  console.log('Type:', type);
  console.log('Title:', title);

  const getValue =
    typeof statKey === 'function' ? statKey : (item) => item[statKey] ?? item.stats?.[statKey] ?? 0;

  return (
    <SafeViewWrapper useBottomInset={false} topColor="bg-brand-dark">
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader backgroundColor="bg-brand-dark" title={title} />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 items-center justify-center bg-brand-dark pt-8">
        <Podium3D data={parsedData.slice(0, 3)} statKey={statKey} type={type} />
        <View className="w-full flex-1 rounded-t-3xl border border-theme-gray-6 bg-bg-grouped-1 px-5 pt-5">
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
            className="w-full flex-1 bg-bg-grouped-1">
            {parsedData?.map((item, index) => (
              <View
                key={index}
                className="mb-2 w-full flex-row items-center justify-between gap-5 rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-3 shadow shadow-theme-gray-6">
                <Text className="h-10 w-10 rounded bg-bg-grouped-3 p-2 text-center font-saira text-2xl text-text-1">
                  {index + 1}
                </Text>
                {type === 'player' ? (
                  <Image source={require('@assets/avatar.jpg')} className="h-14 w-14 rounded" />
                ) : (
                  <TeamLogo
                    thickness={2}
                    color1={item.crest.color1}
                    color2={item.crest.color2}
                    size={45}
                    type={item.crest.type}
                  />
                )}
                <View className="flex-1 items-center justify-start">
                  <Text className="w-full text-left font-saira-semibold text-xl text-text-1">
                    {type === 'player' ? `${item.first_name} ${item.surname}` : item.display_name}
                  </Text>
                  <Text className="w-full text-left font-saira-semibold text-xl text-text-2">
                    {item.team_name}
                  </Text>
                </View>
                <Text
                  style={{ lineHeight: 50 }}
                  className="pr-2 text-center font-saira-bold text-4xl text-text-1">
                  {getValue(item)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({
  trapazoid1: {
    width: 80,
    height: 50,
    backgroundColor: 'blue',
    transform: [{ skewY: '20deg' }],
  },
});
