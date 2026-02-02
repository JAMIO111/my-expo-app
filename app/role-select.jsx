import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import IonIcon from '@expo/vector-icons/Ionicons';
import SafeViewWrapper from '@components/SafeViewWrapper';
import BrandHeader from '@components/BrandHeader';
import TeamLogo from '@components/TeamLogo';
import { ScrollView } from 'react-native-gesture-handler';
import { useColorScheme } from 'nativewind';

const RoleSelect = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { roles, currentRole, setCurrentRole } = useUser();
  console.log('Available roles:', roles);

  // Use current role to show context-specific UI
  if (currentRole?.type === 'player') {
    console.log('Team:', currentRole.team);
  }

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <BrandHeader />
      <View className="flex-1 items-stretch justify-start border-t-2 border-brand-dark bg-bg-grouped-1 p-5">
        <Text style={{ lineHeight: 40 }} className="my-2 px-2 font-saira-bold text-4xl text-text-1">
          Select Your Role.
        </Text>
        <Text className="mb-6 px-2 font-saira text-xl text-text-2">
          This will determine what features and content you have access to and what information is
          shown.
        </Text>
        <ScrollView className="py-3">
          {roles?.map((role, index) => (
            <Pressable
              key={index}
              onPress={() => {
                setCurrentRole(role);
                router.replace('/(main)/home');
              }}>
              <View className="mb-3 flex-row items-center justify-between gap-2 rounded-2xl border border-theme-gray-4 bg-bg-grouped-2 px-4 py-3 shadow-md shadow-theme-gray-5">
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="font-saira-bold text-2xl text-text-1">
                    {role.team?.display_name || role.district?.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    className="font-saira-medium text-xl text-text-2">
                    {role.type.charAt(0).toUpperCase() + role.type.slice(1)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  {role?.type === 'admin' ? (
                    <IonIcon
                      name={role?.type === 'admin' ? 'shield-half-sharp' : 'people'}
                      size={40}
                      color="teal"
                    />
                  ) : (
                    <TeamLogo
                      size={40}
                      type={role?.team?.crest?.type}
                      color1={role?.team?.crest?.color1}
                      color2={role?.team?.crest?.color2}
                      thickness={role?.team?.crest?.thickness}
                    />
                  )}
                  <IonIcon name="chevron-forward-outline" size={24} color="gray" />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <Text className="mb-10 px-2 text-center font-saira text-lg text-text-2">
          You can easily switch views later by changing your role in the settings.
        </Text>
      </View>
    </SafeViewWrapper>
  );
};

export default RoleSelect;

const styles = StyleSheet.create({});
