import { useEffect, useState } from 'react';
import { getAvailablePurchases } from 'react-native-iap';

export const useActiveSubscription = () => {
  const [active, setActive] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const purchases = await getAvailablePurchases();

        // Grab the most relevant subscription
        const sub = purchases.find((p) => p.productId && p.productId.includes('breakroom'));

        if (!sub || !mounted) return;

        const parts = sub.productId.split('.');

        setActive({
          sku: sub.productId,
          tier: parts[parts.length - 2],
          interval: parts[parts.length - 1],
        });
      } catch (e) {
        console.error('Failed to load active subscription', e);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return active;
};
