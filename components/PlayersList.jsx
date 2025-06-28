import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useTeamPlayers } from 'hooks/useTeamPlayers';
import PlayerCard from './PlayerCard';
import { useUser } from 'contexts/UserProvider';

const PlayersList = () => {
  const { player } = useUser();
  if (!player) {
    return <Text>No team data available</Text>;
  }
  const { data: players, isLoading, error } = useTeamPlayers(player.team.id);

  const sortedPlayers = players?.slice().sort((a, b) => a.surname.localeCompare(b.surname));

  return (
    <View className="bg-background-dark gap-2 px-3">
      {isLoading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text>Error: {error.message}</Text>
      ) : (
        sortedPlayers?.map((player2) => (
          <PlayerCard key={player2.id} team={player.team} player={player2} />
        ))
      )}
    </View>
  );
};

export default PlayersList;

const styles = StyleSheet.create({});
