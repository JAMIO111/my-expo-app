import { Pressable, StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MyTeamCard = ({ role, onPress }) => {
  return (
    <View className={`relative w-full rounded-3xl border border-theme-gray-4 bg-bg-grouped-2 p-5`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-2">
          <View className="flex-row items-center gap-5">
            <TeamLogo {...role?.team?.crest} size={26} />
            <Text className="pt-2 font-saira-semibold text-3xl text-text-1">
              {role?.team?.display_name}
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Ionicons name="location-outline" size={26} color="#6B7280" />
            <Text className="font-saira-medium text-lg text-text-1">
              {role?.team?.division?.district?.name} - {role?.team?.division?.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Ionicons name="star-outline" size={26} color="#6B7280" />
            <Text className="font-saira text-lg text-text-2">Captain: John Dryden</Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Ionicons name="person-outline" size={26} color="#6B7280" />
            <Text className="font-saira text-lg text-text-2">7 Active Members</Text>
          </View>
        </View>
      </View>
      <Pressable
        onPress={onPress}
        className="absolute right-3 top-3 h-12 w-12 items-center justify-center rounded-2xl border border-theme-red bg-theme-red/70">
        <Ionicons name="log-out-outline" size={24} color="#fff" />
      </Pressable>
    </View>
  );
};

export default MyTeamCard;

const styles = StyleSheet.create({});
