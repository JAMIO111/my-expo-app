import { StyleSheet, Text, View, ScrollView, Image, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import TeamLogo from '@components/TeamLogo';

const Team = () => {
  const colorScheme = useColorScheme();
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const { player, currentRole, isLoading } = useUser();
  const router = useRouter();
  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Team Management" />
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
            <View className="mb-8 mt-5 items-center">
              <TeamLogo
                size={120}
                type={currentRole?.team?.crest?.type}
                color1={currentRole?.team?.crest?.color1}
                color2={currentRole?.team?.crest?.color2}
                thickness={currentRole?.team?.crest?.thickness}
              />
              <View className="items-center gap-2">
                <Text
                  style={{ lineHeight: 38 }}
                  className="mt-6 text-center font-saira-semibold text-4xl text-text-1">
                  {currentRole?.team?.name || 'No Team'}
                </Text>
                <Text className="rounded-lg border border-separator bg-bg-grouped-2 px-3 pb-1 pt-2 font-saira text-2xl text-text-2">
                  {currentRole?.team?.abbreviation || 'No Nickname'}
                </Text>
              </View>
            </View>

            <MenuContainer>
              <SettingsItem
                routerPath="settings/TeamDetails"
                iconBGColor="gray"
                title="Team Details"
                icon="id-card-outline"
              />
              <SettingsItem
                routerPath="settings/PlayerManagement"
                iconBGColor="gray"
                title="Player Management"
                icon="people-outline"
                lastItem={true}
              />
            </MenuContainer>
          </View>

          {/* Bottom CTA */}
          <View className="my-10">
            <CTAButton
              type="error"
              text={isLeavingTeam ? 'Leaving Team...' : 'Leave Team'}
              callbackFn={async () => {
                setIsLeavingTeam(true);
                const { error } = await supabase
                  .from('TeamPlayers')
                  .delete()
                  .eq('player_id', player.id)
                  .eq('team_id', currentRole?.team?.id);

                if (error) {
                  console.error('Error leaving team:', error.message);
                } else {
                  Toast.show({
                    type: 'success',
                    text1: 'Left Team',
                    text2: 'You have successfully left your team.',
                    props: { colorScheme },
                  });
                  router.replace('/home');
                }
                setIsLeavingTeam(false);
              }}
              disabled={isLeavingTeam}
            />
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Team;

const styles = StyleSheet.create({});
