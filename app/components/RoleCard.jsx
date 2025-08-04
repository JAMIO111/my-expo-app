import { StyleSheet, Text, View, Pressable } from 'react-native';
import IonIcon from '@expo/vector-icons/Ionicons';

const RoleCard = ({ title, description, onPress, icon }) => {
  return (
    <Pressable
      onPress={onPress}
      className="mb-5 flex-row items-center justify-between gap-2 rounded-xl border border-theme-gray-5 bg-bg-grouped-2 px-4 py-3 shadow-lg">
      <View className="flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="font-saira-medium text-xl text-text-2">
          {title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="font-saira-bold text-2xl text-text-1">
          {description}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <IonIcon name={icon} size={40} color="gray" />

        <IonIcon name="chevron-forward-outline" size={24} color="gray" />
      </View>
    </Pressable>
  );
};

export default RoleCard;

const styles = StyleSheet.create({});
