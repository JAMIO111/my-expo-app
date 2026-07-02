import { Pressable, StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MyTeamCard = ({ role, onPress }) => {
  return (
    <View className={`relative w-full rounded-3xl bg-bg-grouped-2 p-5 shadow-sm`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-3">
          <View className="flex-row items-center gap-5">
            <TeamLogo {...role?.team?.crest} size={34} />
            <Text className="pt-2 font-saira-semibold text-3xl text-text-1">
              {role?.team?.display_name}
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Ionicons name="location-outline" size={26} color="green" className="px-1" />
            <Text className="font-saira-medium text-lg text-text-1">
              {role?.district?.name} - {role?.division?.name}
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <Ionicons name="people-outline" size={26} color="green" className="px-1" />
            <Text className="font-saira text-lg text-text-2">
              {role?.activeMemberCount ?? 0} Active Members
            </Text>
          </View>
          <View className="flex-row items-center gap-5">
            <View className="h-7 w-10 justify-center rounded border bg-yellow-500 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              <View className="w-full items-center justify-center bg-white px-1">
                <Text style={{ lineHeight: 10, fontSize: 6 }} className="font-saira-medium">
                  Captain
                </Text>
              </View>
            </View>
            <Text className="font-saira text-lg text-text-2">{`${role?.captain?.first_name ?? ''} ${role?.captain?.surname ?? ''}`}</Text>
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
