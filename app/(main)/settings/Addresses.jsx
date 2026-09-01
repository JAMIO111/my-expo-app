import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useUser } from '@contexts/UserProvider';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import useAddresses from '@/hooks/useAddresses';
import RotatingLoader from '@components/RotatingLoader';

const Addresses = () => {
  const { currentRole } = useUser();
  const { data: addresses, isLoading } = useAddresses(currentRole?.district?.id);
  console.log('Addresses:', addresses);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="League Venues" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View className="flex-1 justify-between">
          {/* Top Content */}
          <View>
            <MenuContainer>
              <SettingsItem
                title="Add New Venue"
                routerPath="/settings/ManageAddress"
                routerParams={{ mode: 'add', role: currentRole?.type }}
                icon="housePlus"
              />
            </MenuContainer>
            <MenuContainer title="Venues">
              {isLoading ? (
                <View className="flex-1 items-center justify-center gap-5 p-8 py-12">
                  <RotatingLoader />
                  <Text className="font-tektur text-lg text-text-2">Loading venues...</Text>
                </View>
              ) : (
                addresses?.map((address) => (
                  <SettingsItem
                    key={address.id}
                    title={[address.name, address.city, address.postcode]
                      .filter(Boolean)
                      .join(', ')}
                    routerPath="/settings/ManageAddress"
                    routerParams={{ mode: 'edit', role: currentRole?.type, addressId: address.id }}
                  />
                ))
              )}
            </MenuContainer>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Addresses;

const styles = StyleSheet.create({});
