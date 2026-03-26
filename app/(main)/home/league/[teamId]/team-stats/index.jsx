import TeamStatsPage from '@/components/TeamStatsPage';
import { useLocalSearchParams } from 'expo-router';

const index = () => {
  const { teamId } = useLocalSearchParams();
  return <TeamStatsPage teamId={teamId} />;
};

export default index;
