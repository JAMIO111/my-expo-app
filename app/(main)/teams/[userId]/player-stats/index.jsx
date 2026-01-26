import PlayerStatsPage from '@/components/PlayerStatsPage';
import { useLocalSearchParams } from 'expo-router';

const index = () => {
  const { userId } = useLocalSearchParams();
  return <PlayerStatsPage userId={userId} />;
};

export default index;
