import TeamStatsPage from '@/components/TeamStatsPage';
import { useLocalSearchParams } from 'expo-router';

const index = () => {
  const { teamId } = useLocalSearchParams();
  console.log('Team ID in Team Stats Index:', teamId);
  return <TeamStatsPage teamId={teamId} />;
};

export default index;
