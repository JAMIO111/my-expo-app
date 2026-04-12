// hooks/useSubscription.js
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('activesubscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      setSubscription(data ?? null);
    } catch (error) {
      console.error('[useSubscription] fetch error:', error?.message);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Realtime — update UI instantly when subscription row changes
    // e.g. after verify-receipt upserts the new subscription
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'UserSubscriptions',
        },
        (payload) => {
          console.log('[useSubscription] realtime update:', payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Derived helpers for clean UI/access checks
  const tier = subscription?.product_id
    ? subscription.product_id.split('.').at(-2) // 'pro' | 'core'
    : null;

  const interval = subscription?.product_id
    ? subscription.product_id.split('.').at(-1) // 'monthly' | 'annual'
    : null;

  const expiresAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription, // raw DB row
    isLoading,
    isActive: !!subscription, // boolean for access gates
    isPro: tier === 'pro', // pro-tier specific features
    isCore: tier === 'core', // core-tier specific features
    tier, // 'pro' | 'core' | null
    interval, // 'monthly' | 'annual' | null
    expiresAt, // Date object
    daysRemaining, // number
    refetch: fetchSubscription, // call after restore purchases
  };
};
