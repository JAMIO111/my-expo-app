import { StyleSheet, Text, View } from 'react-native';
import { useDivisions } from '@hooks/useDivisions';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';

const DivisionsList = ({ districtId }) => {
  const { currentRole } = useUser();
  const { data: divisions } = useDivisions(districtId);
  console.log('Divisions:', divisions);

  return (
    <View className="items-center justify-center gap-3 p-3">
      <Text className="w-full px-2 text-left font-saira-medium text-2xl text-white">
        {currentRole?.district?.name} Divisions
      </Text>
      {divisions?.map((division) => (
        <View
          className="w-full flex-row items-center justify-between rounded-xl border border-theme-gray-5 bg-bg-grouped-2 p-3"
          key={division.id}>
          <View>
            <Text className="font-saira-semibold text-xl text-text-1">{division.name}</Text>
            <Text className="font-saira-medium text-lg text-text-1">Tier {division?.tier}</Text>
          </View>
          <Ionicons
            name="chevron-forward-outline"
            size={22}
            color="gray"
            onPress={() => router.push(`/divisions/${division.id}`)}
          />
        </View>
      ))}
    </View>
  );
};

export default DivisionsList;

const styles = StyleSheet.create({});
