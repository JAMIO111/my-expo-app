import TeamStatsPage from '@/components/TeamStatsPage';
import { useLocalSearchParams } from 'expo-router';

const index = () => {
  const { userId } = useLocalSearchParams();
  return <TeamStatsPage teamId={userId} />;
};

export default index;
