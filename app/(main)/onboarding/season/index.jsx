import { View, ScrollView, Text, Pressable, useColorScheme } from 'react-native';
import { useRef, useState } from 'react';
import NavBar from '@components/NavBar2';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import LeagueTable from '@components/LeagueTable';
import UpcomingFixtureCard from '@components/UpcomingFixtureCard';
import { useUpcomingFixtures } from '@hooks/useUpcomingFixtures';
import DropdownFilterButton from '@components/DropdownFilterButton';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import colors from '@lib/colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { UpcomingFixtureSkeleton } from '@components/Skeletons';

const Season = () => {
  const { player, currentRole, setCurrentRole, roles } = useUser();
  const { data: nextMatch, isLoading } = useUpcomingFixtures(currentRole?.team?.id, {
    nextOnly: false,
  });
  const bottomSheetRef = useRef(null);
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme] || colors.light; // Fallback to light theme if colorScheme is undefined
  console.log('Next Match:', nextMatch);
  const [tempRole, setTempRole] = useState(null);
  const teamRoles = roles?.filter((r) => r.type !== 'admin' && r.team);

  const openSheet = () => {
    setTempRole(currentRole);
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <>
      <SafeViewWrapper topColor="bg-brand" bottomColor="bg-brand">
        <StatusBar style="light" backgroundColor="#000" />
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useTopInset={false} useBottomInset={false}>
                <CustomHeader
                  title="Season Overview"
                  showBack={false}
                  rightIcon="clipboard-outline"
                />
              </SafeViewWrapper>
            ),
          }}
        />
        <ScrollView
          className="flex-1 bg-brand-dark"
          contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start' }}>
          <View
            style={{ height: 64 }}
            className="w-full items-center justify-center bg-brand-dark p-3">
            <DropdownFilterButton
              text={
                `${currentRole?.team?.display_name} - ${currentRole?.team?.division?.district.name}` ||
                'Select Team'
              }
              callbackFn={() => {
                openSheet();
              }}
            />
          </View>
          <View className="w-full items-center justify-center bg-bg-grouped-1 p-5">
            {!isLoading ? (
              <UpcomingFixtureCard fixture={nextMatch?.[0]} inactive />
            ) : (
              <View className="w-72 rounded-2xl border border-theme-gray-5">
                <UpcomingFixtureSkeleton />
              </View>
            )}
          </View>
          <LeagueTable
            season={currentRole?.activeSeason?.id}
            division={currentRole?.team?.division?.id}
          />
        </ScrollView>
        <NavBar type="onboarding" />
      </SafeViewWrapper>
      <BottomSheetWrapper
        ref={bottomSheetRef}
        initialIndex={-1}
        snapPoints={['10%']}
        footerComponent={(props) => (
          <BottomSheetFooter {...props}>
            <View
              style={{ paddingBottom: 80 }}
              className="w-full gap-5 rounded-t-3xl bg-bg-grouped-3 p-6">
              <CTAButton
                icon={<Ionicons name="swap-horizontal-outline" size={24} color="#fff" />}
                text="Switch View"
                type="brand"
                callbackFn={() => {
                  console.log('Switching view to:', tempRole);
                  setCurrentRole(tempRole);
                  closeSheet();
                }}
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
            Select team view
          </Text>
          <Pressable className="p-2" onPress={closeSheet}>
            <Ionicons name="close" size={24} color={themeColors.primaryText} />
          </Pressable>
        </BottomSheetView>

        {/* Scrollable content with top padding to avoid overlap */}
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 240, paddingTop: 80, paddingHorizontal: 32 }}>
          {/* Your content goes here */}
          {teamRoles.map((r) => (
            <Pressable
              className="mb-3 flex-row items-center justify-between"
              key={r.id}
              onPress={() => setTempRole(r)}>
              <Text
                className={`font-saira text-2xl ${
                  tempRole?.id === r.id ? 'text-text-1' : 'text-text-2'
                }`}>
                {r.team?.display_name}
              </Text>
              <Ionicons
                size={24}
                color={themeColors.primaryText}
                name={tempRole?.id === r.id ? 'checkbox' : 'square-outline'}
              />
            </Pressable>
          ))}
        </BottomSheetScrollView>
      </BottomSheetWrapper>
    </>
  );
};

export default Season;
