import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useRef } from 'react';
import { useDivisions } from '@hooks/useDivisions';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import { romanNumerals } from '../lib/badgeIcons';

const DivisionsList = ({ districtId }) => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const { data: divisions } = useDivisions(districtId);
  console.log('Divisions:', divisions);

  return (
    <View className="items-center justify-center gap-3">
      <Text className="w-full px-2 text-left font-saira-medium text-2xl text-white">
        {currentRole?.district?.name} Divisions
      </Text>
      {divisions?.map((division) => (
        <Pressable
          onPress={() => {
            if (hasNavigated.current) return;
            hasNavigated.current = true;
            setTimeout(() => {
              hasNavigated.current = false;
            }, 500); // Reset navigation state after 500ms
            router.push({
              pathname: '/(main)/my-leagues/division-overview',
              params: {
                divisionStr: JSON.stringify(division),
              },
            });
          }}
          className="w-full flex-row items-center justify-between rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-2"
          key={division.id}>
          <View className="flex-row items-center gap-4">
            {romanNumerals[division.tier] && (
              <Image
                source={romanNumerals[division.tier]}
                style={{ width: 40, height: 48 }}
                resizeMode="contain"
              />
            )}
            <Text className="font-saira-semibold text-xl text-text-1">{division.name}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={22} color="gray" />
        </Pressable>
      ))}
    </View>
  );
};

export default DivisionsList;

const styles = StyleSheet.create({});
