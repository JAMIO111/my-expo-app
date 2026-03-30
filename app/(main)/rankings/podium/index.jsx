import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Podium3D from '@components/Podium';
import { Stack, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import TeamLogo from '@components/TeamLogo';
import Avatar from '@components/Avatar';
import { getBgClass, getTextClass } from '@lib/helperFunctions';

const index = () => {
  const { data, statKey, type, title, label, percent } = useLocalSearchParams();
  const parsedData = JSON.parse(data);
  const sortedData = parsedData.sort((a, b) => b[statKey] - a[statKey]);

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

      <View className="mt-16 flex-1 items-center justify-center bg-brand-dark px-4 pt-8">
        {/* Podium for top 3 */}
        <Podium3D data={parsedData.slice(0, 3)} statKey={statKey} type={type} label={label} />

        {/* Leaderboard list */}
        <View className="w-full flex-1 rounded-t-3xl bg-bg-grouped-1 px-4 pt-6 shadow-md">
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="w-full flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}>
            {sortedData?.map((item, index) => (
              <View
                key={index}
                className="mb-2 flex-row items-center gap-4 rounded-2xl bg-bg-1 p-3">
                {/* Left rank bar */}
                <View
                  style={{
                    width: 6,
                    alignSelf: 'stretch',
                    borderRadius: 3,
                    backgroundColor:
                      index === 0
                        ? '#FACC15' // gold
                        : index === 1
                          ? '#E5E7FF' // silver
                          : index === 2
                            ? '#B45309' // bronze
                            : '#9CA3AF', // default gray
                  }}
                />

                {/* Rank circle */}
                <View
                  className={`h-10 w-10 items-center justify-center rounded-xl ${getBgClass(
                    index
                  )} shadow-sm`}>
                  <Text className={`font-saira-semibold text-lg ${getTextClass(index)}`}>
                    {index + 1}
                  </Text>
                </View>

                {/* Avatar / Team logo */}
                {type === 'player' ? (
                  <Avatar player={item} size={40} borderRadius={8} />
                ) : (
                  <TeamLogo
                    thickness={2}
                    color1={item.crest.color1}
                    color2={item.crest.color2}
                    size={40}
                    type={item.crest.type}
                  />
                )}

                {/* Name & team */}
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="font-saira-semibold text-lg text-text-1">
                    {type === 'player' ? `${item.first_name} ${item.surname}` : item.display_name}
                  </Text>
                  {item.nickname && (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      className="mt-0.5 font-saira-medium text-text-2">
                      {item.nickname?.toUpperCase() || ''}
                    </Text>
                  )}
                </View>

                {/* Stat */}
                <View className="items-end pr-3">
                  <Text className="pt-2 font-saira-bold text-2xl text-text-1">
                    {`${getValue(item)}${percent ? ' %' : ''}`}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeViewWrapper>
  );
};

export default index;
