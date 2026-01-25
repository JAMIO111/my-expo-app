import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRef } from 'react';
import { useDivisions } from '@hooks/useDivisions';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';

const DivisionsList = ({ districtId }) => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const { data: divisions } = useDivisions(districtId);
  console.log('Divisions:', divisions);

  return (
    <View className="items-center justify-center gap-3 p-3">
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
          className="w-full flex-row items-center justify-between rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-3"
          key={division.id}>
          <View>
            <Text className="font-saira-semibold text-xl text-text-1">{division.name}</Text>
            <Text className="font-saira-medium text-lg text-text-1">Tier {division?.tier}</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={22} color="gray" />
        </Pressable>
      ))}
    </View>
  );
};

export default DivisionsList;

const styles = StyleSheet.create({});
