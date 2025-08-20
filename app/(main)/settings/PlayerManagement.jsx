import { StyleSheet, Text, View, ScrollView, Image, useColorScheme } from 'react-native';
import { useState } from 'react';
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
  const { player, currentRole, isLoading } = useUser();
  const router = useRouter();
  const { data: currentPlayers, isLoading: isLoadingPlayers } = useTeamPlayers(
    currentRole?.team?.id
  );
  const { data: PendingPlayers } = usePlayerInvitesAndRequests(currentRole?.team?.id);

  const invitedPlayers = PendingPlayers?.filter((player) => player.status === 'invited');
  const requestedPlayers = PendingPlayers?.filter((player) => player.status === 'requested');

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Player Management" />
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
            <Text className="pb-1 pl-2 font-saira-medium text-2xl text-text-1">
              Current Players
            </Text>
            <MenuContainer>
              {currentPlayers?.map((player, index) => (
                <SettingsItem
                  key={player.id}
                  player={player}
                  routerPath={`/settings/${player.id}?status=${player.status}`}
                  iconBGColor="gray"
                  title={`${player.first_name} ${player.surname}`}
                  lastItem={currentPlayers.length - 1 === index}
                />
              ))}
            </MenuContainer>
            {invitedPlayers && (
              <>
                <Text className="pb-1 pl-2 font-saira-medium text-2xl text-text-1">
                  Invited Players
                </Text>
                <MenuContainer>
                  {invitedPlayers?.map((player, index) => (
                    <SettingsItem
                      key={player.id}
                      player={player}
                      routerPath={`/settings/${player.id}?status=${player.status}`}
                      iconBGColor="gray"
                      title={`${player.first_name} ${player.surname}`}
                      lastItem={invitedPlayers.length - 1 === index}
                    />
                  ))}
                </MenuContainer>
              </>
            )}
            {requestedPlayers && (
              <>
                <Text className="pb-1 pl-2 font-saira-medium text-2xl text-text-1">
                  Join Requests
                </Text>
                <MenuContainer>
                  {requestedPlayers?.map((player, index) => (
                    <SettingsItem
                      key={player.id}
                      player={player}
                      routerPath={`/settings/${player.id}?status=${player.status}`}
                      iconBGColor="gray"
                      title={`${player.first_name} ${player.surname}`}
                      lastItem={invitedPlayers.length - 1 === index}
                    />
                  ))}
                </MenuContainer>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PlayerManagement;

const styles = StyleSheet.create({});
