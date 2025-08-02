import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';

const usePlayerBadges = (playerId) => {
  const { client: supabase } = useSupabaseClient();
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!playerId) return;

    const fetchBadges = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_player_badges', {
        player_id: playerId,
      });

      if (error) {
        setError(error);
        setBadges([]);
      } else {
        setBadges(data || []);
      }

      setIsLoading(false);
    };

    fetchBadges();
  }, [playerId]);

  return { badges, isLoading, error };
};

export default usePlayerBadges;
