import { StyleSheet, Text, View } from 'react-native';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import PlayerCard from './PlayerCard';

const PlayersList = ({ team, context, fixtureId }) => {
  const { data: players, isLoading, error } = useTeamPlayers(team?.id);

  const sortedPlayers = players?.slice().sort((a, b) => a.surname.localeCompare(b.surname));

  return (
    <View className="gap-3">
      {isLoading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text>Error: {error.message}</Text>
      ) : (
        sortedPlayers?.map((mappedPlayer) => (
          <PlayerCard
            key={mappedPlayer.id}
            team={team}
            player={mappedPlayer}
            context={context}
            fixtureId={fixtureId}
          />
        ))
      )}
    </View>
  );
};

export default PlayersList;

const styles = StyleSheet.create({});
