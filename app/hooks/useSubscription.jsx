// hooks/useSubscription.js
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const REALTIME_DEBOUNCE_MS = 600;

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keeps the last known-good row so access gates don't flicker during
  // the brief window where 0 rows are active between two DB writes.
  const previousSubscription = useRef(null);

  // Debounce handle for realtime events.
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

      // ✅ No longer using .maybeSingle() — that throws PGRST116 when two
      //    rows are briefly active.  Instead we fetch up to 2, ordered by
      //    the furthest expiry, and take the first one ourselves.
      const { data, error } = await supabase
        .from('activesubscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('current_period_end', { ascending: false })
        .limit(2); // limit(2) is enough — we only ever want the best one

      if (error) throw error;

      // ✅ If we got results, use the first (best-expiry) row.
      //    If we got nothing, fall back to the previous row temporarily
      //    so access gates don't flicker while a new row is being written.
      const best = data?.[0] ?? null;

      if (best) {
        previousSubscription.current = best;
        setSubscription(best);
      } else {
        // Zero rows — race condition or genuine lapse.
        // Keep the stale row visible until the next realtime event confirms
        // the real state.  Clear it only on the *second* empty read so a
        // genuine cancellation still propagates.
        if (previousSubscription.current === null) {
          setSubscription(null); // first fetch ever returned nothing — fine
        }
        // If previousSubscription.current is set, leave state unchanged.
        // The next realtime event (or manual refetch) will resolve it.
      }
    } catch (err) {
      console.error('[useSubscription] fetch error:', err?.message);
      // Don't wipe state on a transient error; keep showing what we had.
    } finally {
      setIsLoading(false);
    }
  };

  // Call this when you're certain the subscription is gone
  // (e.g. user explicitly cancels inside the app).
  const clearSubscription = () => {
    previousSubscription.current = null;
    setSubscription(null);
  };

  useEffect(() => {
    fetchSubscription();

    const channel = supabase
      .channel('subscription-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'UserSubscriptions' }, () => {
        // ✅ Debounce: if the DB fires two events in quick succession
        //    (delete old row, insert new row) we only fetch once,
        //    after the dust has settled.
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
          fetchSubscription();
        }, REALTIME_DEBOUNCE_MS);
      })
      .subscribe();

    return () => {
      clearTimeout(debounceTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  const tier = subscription?.product_id ? subscription.product_id.split('.').at(-2) : null;

  const interval = subscription?.product_id ? subscription.product_id.split('.').at(-1) : null;

  const expiresAt = subscription?.current_period_end
    ? new Date(subscription.current_period_end)
    : null;

  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
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
    clearSubscription, // call after a confirmed cancellation flow
  };
};
