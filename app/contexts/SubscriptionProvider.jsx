// contexts/SubscriptionProvider.jsx
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const REALTIME_DEBOUNCE_MS = 600;
const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const previousSubscription = useRef(null);
  const debounceTimer = useRef(null);

  const fetchSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        previousSubscription.current = null;
        setSubscription(null);
        return;
      }

      const { data, error } = await supabase
        .from('activesubscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('current_period_end', { ascending: false })
        .limit(2);

      if (error) throw error;

      const best = data?.[0] ?? null;
      if (best) {
        previousSubscription.current = best;
        setSubscription(best);
      } else {
        if (previousSubscription.current === null) {
          setSubscription(null);
        }
      }
    } catch (err) {
      console.error('[SubscriptionProvider] fetch error:', err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSubscription = () => {
    previousSubscription.current = null;
    setSubscription(null);
  };

  useEffect(() => {
    fetchSubscription();

    const channel = supabase
      .channel('subscription-changes') // ✅ safe — only created once
      .on('postgres_changes', { event: '*', schema: 'public', table: 'UserSubscriptions' }, () => {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(fetchSubscription, REALTIME_DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const tier = subscription?.product_id?.split('.')?.at(-2) ?? null;
  const interval = subscription?.product_id?.split('.')?.at(-1) ?? null;
  const expiresAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        isActive: !!subscription,
        isPro: tier === 'pro',
        isCore: tier === 'core',
        tier,
        interval,
        expiresAt,
        daysRemaining,
        refetch: fetchSubscription,
        clearSubscription,
      }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};
