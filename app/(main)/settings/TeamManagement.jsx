import { StyleSheet, Text, View, ScrollView, Image, useColorScheme } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import TeamLogo from '@components/TeamLogo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Menu } from 'lucide-react-native';

const Team = () => {
  const colorScheme = useColorScheme();
  const [isLeavingTeam, setIsLeavingTeam] = useState(false);
  const { player, currentRole, isLoading } = useUser();
  const router = useRouter();

  const handleLeaveTeam = async () => {
    if (currentRole?.team?.captain === player.id) {
      Toast.show({
        type: 'error',
        text1: 'Captain cannot leave team',
        text2: 'Please assign a new captain before leaving the team.',
        props: { colorScheme },
      });
      return;
    }

    try {
      setIsLeavingTeam(true);
      const { error } = await supabase
        .from('TeamPlayers')
        .update({ left_at: new Date().toISOString(), status: 'left' })
        .eq('player_id', player.id)
        .eq('team_id', currentRole?.team?.id);

      Toast.show({
        type: 'success',
        text1: 'Left Team',
        text2: 'You have successfully left your team.',
        props: { colorScheme },
      });
      router.replace('/home');
    } catch (error) {
      console.error('Error leaving team:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to leave team',
        text2: error.message,
        props: { colorScheme },
      });
    } finally {
      setIsLeavingTeam(false);
    }
  };

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
        <View className="justify-between">
          {/* Top Content */}
          <View>
            <View className="mb-8 mt-5 flex-row items-center gap-8 rounded-3xl bg-bg-1 p-5">
              <TeamLogo
                size={80}
                type={currentRole?.team?.crest?.type}
                color1={currentRole?.team?.crest?.color1}
                color2={currentRole?.team?.crest?.color2}
                thickness={currentRole?.team?.crest?.thickness}
              />
              <View className="items-start justify-center gap-1">
                <Text
                  style={{ lineHeight: 38 }}
                  className="text-center font-saira-medium text-3xl text-text-1">
                  {currentRole?.team?.name || 'No Team'}
                </Text>
                <Text className="rounded-lg font-saira-medium text-2xl text-text-2">
                  {currentRole?.team?.abbreviation || 'No Nickname'}
                </Text>
              </View>
            </View>

            <MenuContainer>
              <SettingsItem
                routerPath="settings/TeamDetails"
                iconBGColor="gray"
                title="Team Details"
                icon="idCard"
              />
              <SettingsItem
                routerPath="settings/PlayerManagement"
                iconBGColor="green"
                title="Player Management"
                icon="userCog"
                lastItem={true}
              />
            </MenuContainer>
          </View>

          <MenuContainer>
            <SettingsItem
              callbackFn={handleLeaveTeam}
              iconColor="red"
              titleColor="text-[#FF0000]"
              title={isLeavingTeam ? 'Leaving Team...' : 'Leave Team'}
              icon="logout"
              lastItem={true}
              disabled={isLoading || isLeavingTeam}
            />
          </MenuContainer>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Team;

const styles = StyleSheet.create({});
