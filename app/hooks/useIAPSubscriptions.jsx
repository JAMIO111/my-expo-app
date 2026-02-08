import { useEffect, useState } from 'react';
import { initConnection, endConnection, fetchProducts } from 'react-native-iap';
import { normalizeSubscription } from '@lib/helperFunctions';

const subscriptionIds = [
  'com.jdigital.breakroom.pro.annual',
  'com.jdigital.breakroom.pro.monthly',
  'com.jdigital.breakroom.core.annual',
  'com.jdigital.breakroom.core.monthly',
];

export const useIAPSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        await initConnection();

        const products = await fetchProducts({
          skus: subscriptionIds,
          type: 'subs',
        });

        const normalized = products.map(normalizeSubscription);

        if (mounted) setPlans(normalized);
      } catch (e) {
        console.error(e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      endConnection();
    };
  }, []);

  return { plans, loading, error };
};
