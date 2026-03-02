import { StyleSheet, Text, View } from 'react-native';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import PlayerCard from './PlayerCard';

const PlayersList = ({ team, context, fixtureId }) => {
  const { data: players, isLoading, error } = useTeamPlayers(team?.id);

  const rolePriority = {
    captain: 0,
    vice_captain: 1,
  };

  const sortedPlayers = players?.slice().sort((a, b) => {
    const roleA = rolePriority[a.role?.toLowerCase()] ?? 2;
    const roleB = rolePriority[b.role?.toLowerCase()] ?? 2;

    // First sort by role priority
    if (roleA !== roleB) {
      return roleA - roleB;
    }

    // Then alphabetically by surname
    return a.surname.localeCompare(b.surname);
  });

  console.log('PlayersList - Sorted Players:', sortedPlayers);

  return (
    <View className="gap-2">
      {isLoading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text>Error: {error.message}</Text>
      ) : sortedPlayers?.length === 0 ? (
        <View className="items-center justify-center rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-4 py-7">
          <Text className="font-saira text-xl text-text-2">
            No players registered to this team.
          </Text>
        </View>
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
