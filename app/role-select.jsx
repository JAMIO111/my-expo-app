import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import IonIcon from '@expo/vector-icons/Ionicons';

const RoleSelect = () => {
  const router = useRouter();
  const { roles, currentRole, setCurrentRole } = useUser();
  console.log('Available roles:', roles);

  // Use current role to show context-specific UI
  if (currentRole?.type === 'player') {
    console.log('Team:', currentRole.team);
  }

  return (
    <View className={`flex-1 items-stretch justify-center bg-brand p-5`}>
      <Text
        style={{ lineHeight: 40 }}
        className="text-text-on-brand mb-1 px-2 font-saira-bold text-4xl">
        Select Your Role.
      </Text>
      <Text className="text-text-on-brand-2 mb-10  px-2 font-saira text-xl">
        This will determine what features and content you have access to and what information is
        shown.
      </Text>

      {roles?.map((role, index) => (
        <Pressable
          key={index}
          onPress={() => {
            setCurrentRole(role);
            router.replace('/(main)/home');
          }}>
          <View className="mb-5 flex-row items-center justify-between gap-2 rounded-lg bg-bg-grouped-2 px-4 py-3">
            <View className="flex-1 gap-1">
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-saira-medium text-lg text-text-2">
                {role.type.charAt(0).toUpperCase() + role.type.slice(1)}
              </Text>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                className="font-saira-bold text-2xl text-text-1">
                {role.team?.name || role.district?.name}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <IonIcon
                name={role?.type === 'admin' ? 'shield' : 'people'}
                size={28}
                color="white"
              />
              <IonIcon name="chevron-forward-outline" size={24} color="gray" />
            </View>
          </View>
        </Pressable>
      ))}
      <Text className="text-text-on-brand-2 mb-10 px-2 font-saira text-lg">
        You can easily switch views later by changing your role in the settings.
      </Text>
    </View>
  );
};

export default RoleSelect;

const styles = StyleSheet.create({});
