import { StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';

const ResultCard = () => {
  return (
    <View className="bg-bg-2 h-16 w-full flex-row items-center justify-center gap-2 rounded-xl px-3">
      <View className="flex-1 flex-row items-center justify-end gap-3">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-text-1 flex-shrink text-sm font-medium">
          Shankhouse B Team
        </Text>
        <TeamLogo size={25} color1="blue" color2="yellow" type="Horizontal Stripe" thickness="2" />
      </View>
      <Text className="text-text-1 bg-bg-grouped-3 min-w-20 rounded-md px-2 text-center text-xl font-bold">
        5 - 4
      </Text>
      <View className="flex-1 flex-row items-center justify-start gap-3">
        <TeamLogo size={25} color1="blue" color2="yellow" type="Horizontal Stripe" thickness="2" />
        <Text
          numberOfLines={1}
          ellipsizeMode="middle"
          className="text-text-1 flex-shrink text-sm font-medium">
          Bedlington Station A
        </Text>
      </View>
    </View>
  );
};

export default ResultCard;

const styles = StyleSheet.create({});
