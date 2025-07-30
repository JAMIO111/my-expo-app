import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import IonIcon from '@expo/vector-icons/Ionicons';
import SafeViewWrapper from '@components/SafeViewWrapper';
import BrandHeader from '@components/BrandHeader';

const RoleSelect = () => {
  const router = useRouter();
  const { roles, currentRole, setCurrentRole } = useUser();
  console.log('Available roles:', roles);

  // Use current role to show context-specific UI
  if (currentRole?.type === 'player') {
    console.log('Team:', currentRole.team);
  }

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
      <BrandHeader />
      <View className={`flex-1 items-stretch justify-center bg-brand p-5`}>
        <Text
          style={{ lineHeight: 40 }}
          className="mb-1 px-2 font-saira-bold text-4xl text-text-on-brand">
          Select Your Role.
        </Text>
        <Text className="mb-10 px-2  font-saira text-xl text-text-on-brand-2">
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
            <View className="mb-5 flex-row items-center justify-between gap-2 rounded-xl border border-theme-gray-5 bg-bg-grouped-2 px-4 py-3 shadow-lg">
              <View className="flex-1 gap-1">
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="font-saira-medium text-xl text-text-2">
                  {role.type.charAt(0).toUpperCase() + role.type.slice(1)}
                </Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className="font-saira-bold text-2xl text-text-1">
                  {role.team?.display_name || role.district?.name}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <IonIcon
                  name={role?.type === 'admin' ? 'shield' : 'people'}
                  size={28}
                  color="gray"
                />
                <IonIcon name="chevron-forward-outline" size={24} color="gray" />
              </View>
            </View>
          </Pressable>
        ))}
        <Text className="mb-10 px-2 font-saira text-lg text-text-on-brand-2">
          You can easily switch views later by changing your role in the settings.
        </Text>
      </View>
    </SafeViewWrapper>
  );
};

export default RoleSelect;

const styles = StyleSheet.create({});
