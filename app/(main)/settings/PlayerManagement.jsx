import { StyleSheet, Text, View, ScrollView, useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import SettingsItem from '@components/SettingsItem';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import { usePlayerInvitesAndRequests } from '@hooks/usePlayerInvitesAndRequests';

const PlayerManagement = () => {
  const colorScheme = useColorScheme();
  const { player, currentRole } = useUser();
  const router = useRouter();
  const { data: currentPlayers, isLoading: isLoadingPlayers } = useTeamPlayers(
    currentRole?.team?.id
  );
  const { data: PendingPlayers } = usePlayerInvitesAndRequests({ teamId: currentRole?.team?.id });
  console.log('Pending Players:', PendingPlayers);
  console.log('Current Players:', currentPlayers);

  const invitedPlayers = PendingPlayers?.filter(
    (player) =>
      player.status !== 'active' && player.status !== 'left' && player?.invited_by !== null
  );
  const requestedPlayers = PendingPlayers?.filter(
    (player) =>
      player.status !== 'active' && player.status !== 'left' && player?.requested_by !== null
  );
  console.log('Invited Players:', invitedPlayers);
  console.log('Requested Players:', requestedPlayers);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Manage Roster" />
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
            <MenuContainer title="Current Players">
              {currentPlayers?.map((player, index) => (
                <SettingsItem
                  key={player.id}
                  player={player}
                  routerPath="/settings/PlayerActions"
                  routerParams={{ playerId: player.id }}
                  iconBGColor="gray"
                  title={`${player.first_name} ${player.surname}`}
                  lastItem={currentPlayers.length - 1 === index}
                />
              ))}
            </MenuContainer>
            {requestedPlayers?.length > 0 && (
              <MenuContainer title="Join Requests">
                {requestedPlayers?.map((player, index) => (
                  <SettingsItem
                    key={player.id}
                    player={player}
                    routerPath="/settings/PlayerActions"
                    routerParams={{ playerId: player.id }}
                    iconBGColor="gray"
                    title={`${player.first_name} ${player.surname}`}
                    lastItem={requestedPlayers?.length - 1 === index}
                  />
                ))}
              </MenuContainer>
            )}
            {invitedPlayers?.length > 0 && (
              <MenuContainer title="Invited Players">
                {invitedPlayers?.map((player, index) => {
                  console.log('Invited Player:', player);
                  return (
                    <SettingsItem
                      key={player.id}
                      player={player}
                      routerPath="/settings/PlayerActions"
                      routerParams={{ playerId: player.id }}
                      iconBGColor="gray"
                      title={`${player.first_name} ${player.surname}`}
                      lastItem={invitedPlayers.length - 1 === index}
                    />
                  );
                })}
              </MenuContainer>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PlayerManagement;

const styles = StyleSheet.create({});
