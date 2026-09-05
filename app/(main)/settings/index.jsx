import { StyleSheet, ScrollView, Alert, View, Text, useColorScheme, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import Avatar from '@components/Avatar';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import NavBar from '@components/NavBar2';
import { useState, useRef } from 'react';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetView, BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import Ionicons from '@expo/vector-icons/Ionicons';
import colors from '@lib/colors';
import TeamLogo from '@components/TeamLogo';
import { ShieldCheck } from 'lucide-react-native';
import CTAButton from '@components/CTAButton';

const index = () => {
  const bottomSheetRef = useRef(null);
  const isAnimatingRef = useRef(false); // ✅ guards rapid open/close taps
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isBottomSheetOpen, setBottomSheetOpen] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];

  const { session, user, player, roles, currentRole, setCurrentRole, isLoading, refetch } =
    useUser();
  const [tempRole, setTempRole] = useState(null);

  console.log('Bottom Sheet index:', bottomSheetRef.current);

  const openSwitchRoleBottomSheet = () => {
    setBottomSheetOpen(true);
    setTempRole(null);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    setBottomSheetOpen(false);
    bottomSheetRef.current?.close();
  };

  const handleSwitchRole = (role) => {
    if (!role) {
      Alert.alert('Error', 'No role selected');
      return;
    }
    setCurrentRole(role);
    router.replace('/(main)/home');
    Toast.show({
      type: 'success',
      text1: 'Role Switched',
      text2: `Your are now logged in as a${role.type === 'admin' ? 'n' : ''} ${role.type} for ${role.type === 'admin' ? role.district.name : role.team.display_name}.`,
      props: { colorScheme },
    });
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      const appUserId = await Purchases.getAppUserID();
      const isAnonymous = await Purchases.isAnonymous();

      if (!isAnonymous) {
        await Purchases.logOut();
      }
      await supabase.auth.signOut();
      Alert.alert('Signed out', 'You have been signed out successfully.');
    } catch (err) {
      Alert.alert('Error signing out', err.message || 'An error occurred while signing out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand" useBottomInset={!isBottomSheetOpen}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Settings" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 40,
        }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <Pressable
          onPress={() => router.push('/settings/PersonalDetails')}
          className="mb-8 w-full flex-row items-center justify-center rounded-3xl bg-bg-1 p-4">
          <Avatar player={player} size={76} borderRadius={14} />
          <View className="ml-6 flex-1 gap-1">
            <Text className="mt-2 font-saira-medium text-3xl text-text-1">
              {player?.first_name} {player?.surname}
            </Text>
            <Text className="font-saira text-text-2">{user?.email}</Text>
          </View>
        </Pressable>
        <Text className="w-full pb-3 pl-1 font-saira-bold text-xl">Your Role</Text>
        <Pressable
          onPress={openSwitchRoleBottomSheet}
          className="mb-8 w-full flex-row items-center justify-between rounded-3xl bg-bg-1 p-4 py-3">
          {currentRole?.type === 'admin' ? (
            <ShieldCheck size={48} color="#333" />
          ) : (
            <TeamLogo
              thickness={currentRole?.team?.crest?.thickness}
              type={currentRole?.team?.crest?.type}
              color1={currentRole?.team?.crest?.color1}
              color2={currentRole?.team?.crest?.color2}
              size={48}
            />
          )}
          <View className="ml-4 flex-1">
            <Text style={{ fontSize: 22 }} className="ml-4 flex-1 font-saira-medium text-text-1">
              {currentRole?.type === 'admin'
                ? currentRole?.district?.name
                : currentRole?.team?.display_name}
            </Text>
            <Text className="ml-4 font-saira text-lg text-text-2">
              {currentRole?.role.charAt(0).toUpperCase() +
                currentRole?.role.slice(1).replace('_', ' ')}
            </Text>
          </View>

          <View className="rounded-full border border-theme-gray-5 p-2">
            <Ionicons name="swap-horizontal" size={20} color={themeColors?.icon} />
          </View>
        </Pressable>
        <MenuContainer title="Your Account">
          <SettingsItem routerPath="/settings/PersonalDetails" title="Edit Profile" icon="user" />
          <SettingsItem
            routerPath="/settings/PlayerPreferences"
            title="Player Preferences"
            icon="settings2"
          />
          {currentRole?.type === 'player' && currentRole?.role === 'captain' && (
            <SettingsItem
              routerPath="/settings/TeamManagement"
              title="Team Management"
              icon="users"
            />
          )}
          <SettingsItem
            routerPath="/settings/SignInAndSecurity"
            title="Sign-in & Security"
            icon="keyRound"
          />
          <SettingsItem routerPath="/settings/Notifications" title="Notifications" icon="bell" />
          <SettingsItem
            routerPath="/settings/Subscriptions"
            title="Subscriptions & Billing"
            icon="wallet"
          />
        </MenuContainer>
        {currentRole?.type === 'admin' && (
          <MenuContainer title="Admin Tools">
            <SettingsItem
              title="League Configuration"
              icon="calendarCog"
              routerPath="/settings/LeagueConfig"
            />
            <SettingsItem iconBGColor="red" title="Rules & Penalties" icon="scale" />
          </MenuContainer>
        )}

        <MenuContainer title="Support">
          <SettingsItem title="How Break Room Works" icon="info" routerPath="/home/help" />
          <SettingsItem title="Help" icon="messageCircleQuestionMark" routerPath="/home/help" />
        </MenuContainer>
        <MenuContainer title="Legal (Boring) Stuff">
          <SettingsItem
            link="https://www.break-room.uk/privacy"
            title="Privacy Policy"
            icon="eye"
          />
          <SettingsItem
            link="https://www.break-room.uk/terms"
            title="Terms of Service"
            icon="fileText"
          />
          <SettingsItem
            link="https://www.break-room.uk/delete-account"
            title="How to Delete Account"
            icon="trash"
          />
        </MenuContainer>
        <MenuContainer>
          <SettingsItem
            iconColor="#FF0000"
            titleColor="text-[#FF0000]"
            title={isSigningOut ? 'Logging Out...' : 'Log Out'}
            icon="logout"
            callbackFn={handleSignOut}
            disabled={isSigningOut}
          />
        </MenuContainer>
        <View className="items-center justify-center">
          <Text className="font-saira text-lg text-text-2">App Version: 1.0.0</Text>
        </View>
      </ScrollView>
      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['20%']}
        onBackdropPress={closeSheet} // ✅ new — lets the parent own the close path
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 140 }}
              className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
              <CTAButton
                text="Switch Role"
                type="brand"
                callbackFn={() => handleSwitchRole(tempRole)}
              />
            </View>
          </BottomSheetFooter>
        )}>
        {/* Fixed Header */}
        <BottomSheetView
          style={{
            paddingHorizontal: 32,
            paddingTop: 8,
            paddingBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            backgroundColor: themeColors.bgGrouped2,
            zIndex: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
            Select Role
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 240, paddingTop: 80, paddingHorizontal: 32 }}>
          {/* Your selectable items */}
          {roles
            ?.filter((r) => r.id !== currentRole?.id)
            .map((r, index) => (
              <Pressable
                className="mb-5 flex-row items-center justify-between"
                key={index}
                onPress={() => setTempRole(r)}>
                <View className="flex-row items-center gap-5">
                  {r.type === 'admin' ? (
                    <ShieldCheck size={40} color={themeColors.primaryText} />
                  ) : (
                    <TeamLogo
                      thickness={r.team?.crest?.thickness}
                      type={r.team?.crest?.type}
                      color1={r.team?.crest?.color1}
                      color2={r.team?.crest?.color2}
                      size={40}
                    />
                  )}
                  <View>
                    <Text
                      className={`font-saira text-2xl ${
                        tempRole?.id === r.id ? 'text-text-2' : 'text-text-2'
                      }`}>
                      {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                    </Text>
                    <Text className="font-saira text-2xl text-text-1">
                      {r.type === 'admin' ? r.district.name : r.team.display_name}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  size={32}
                  color={themeColors.primaryText}
                  name={tempRole?.id === r.id ? 'checkbox' : 'square-outline'}
                />
              </Pressable>
            ))}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
      {!isBottomSheetOpen && <NavBar />}
    </SafeViewWrapper>
  );
};

export default index;

const styles = StyleSheet.create({});
