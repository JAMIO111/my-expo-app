import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@lib/supabase';
import { useUser } from '@contexts/UserProvider';
import { normalizeSubscription } from '@lib/helperFunctions';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getAvailablePurchases,
} from 'react-native-iap';

// Shared across hook instances — one connection per app session
let initPromise = null;

const SUBSCRIPTION_SKUS = [
  'com.jdigital.breakroom.pro.annual',
  'com.jdigital.breakroom.pro.monthly',
  'com.jdigital.breakroom.core.annual',
  'com.jdigital.breakroom.core.monthly',
];

const getPurchaseKey = (purchase) =>
  purchase.transactionId || purchase.transactionReceipt || purchase.purchaseToken;

export const useIAP = () => {
  const { user } = useUser();

  const userRef = useRef(user);
  const processedPurchases = useRef(new Set());
  const purchaseQueueRef = useRef(null);
  const pendingPurchaseRef = useRef(null);
  const purchaseInitiatedRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // ── Current subscription state (merged from useCurrentSubscriptions) ──
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [currentSubscriptionLoading, setCurrentSubscriptionLoading] = useState(false);
  const [currentSubscriptionError, setCurrentSubscriptionError] = useState(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────

  const initIAP = useCallback(async () => {
    if (initPromise) return initPromise;

    initPromise = initConnection()
      .then((result) => {
        setConnected(result);
        return result;
      })
      .catch((err) => {
        console.warn('IAP init error:', err);
        initPromise = null;
        setConnected(false);
        throw err;
      });

    return initPromise;
  }, []);

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  const getProducts = useCallback(
    async ({ skus = [], type = 'in-app' }) => {
      setLoading(true);

      try {
        await initIAP();

        const items = await fetchProducts({
          skus,
          type: type === 'in-app' ? 'in-app' : 'subs',
        });

        const normalized = items.map(normalizeSubscription);

        if (type === 'in-app') setProducts(normalized);
        else setSubscriptions(normalized);

        return normalized;
      } catch (err) {
        console.warn('Failed to fetch products:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [initIAP]
  );

  // ─────────────────────────────────────────────
  // PURCHASE
  // ─────────────────────────────────────────────

  const purchase = useCallback(
    ({ sku, type = 'subs' }) => {
      return new Promise(async (resolve, reject) => {
        purchaseInitiatedRef.current = true;
        pendingPurchaseRef.current = { resolve, reject };

        setLoading(true);

        try {
          await initIAP();

          await requestPurchase({
            request: {
              apple: { sku, quantity: 1 },
              google: { skus: [sku] },
            },
            type,
          });
        } catch (err) {
          console.warn('requestPurchase failed:', err);
          purchaseInitiatedRef.current = false;
          pendingPurchaseRef.current = null;
          setLoading(false);
          reject(err);
        }
      });
    },
    [initIAP]
  );

  // ─────────────────────────────────────────────
  // VERIFY
  // ─────────────────────────────────────────────

  const verifyPurchase = useCallback(async (purchase) => {
    const uid = userRef.current?.id;

    if (!uid) {
      console.warn('No user available for verification');
      return null;
    }

    const isApple = !!purchase.transactionReceipt;

    const payload = isApple
      ? {
          user_id: uid,
          platform: 'apple',
          transaction_id: purchase.originalTransactionIdentifierIOS ?? purchase.transactionId,
        }
      : {
          user_id: uid,
          platform: 'google',
          product_id: purchase.productId ?? purchase.productIds?.[0],
          purchase_token: purchase.purchaseToken ?? purchase.dataAndroid,
          package_name:
            purchase.packageNameAndroid ?? purchase.packageName ?? purchase.androidPackageName,
        };

    console.log('Verify payload:', JSON.stringify(payload));

    const { data, error } = await supabase.functions.invoke('verify-receipt', {
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    if (error) {
      const context = error?.context;
      if (context) {
        try {
          const body = await context.json();
          console.error('Edge function actual error:', JSON.stringify(body));
        } catch {
          const text = await context.text();
          console.error('Edge function actual error (text):', text);
        }
      }
      throw error;
    }

    return data;
  }, []);

  // ─────────────────────────────────────────────
  // FETCH CURRENT SUBSCRIPTION
  // Checks the store for existing purchases, verifies the active one
  // against the backend, and updates currentSubscription state.
  // ─────────────────────────────────────────────

  const fetchCurrentSubscription = useCallback(async () => {
    setCurrentSubscriptionLoading(true);
    setCurrentSubscriptionError(null);

    try {
      await initIAP();

      const purchases = await getAvailablePurchases();
      console.log('Available purchases:', purchases);

      if (!purchases || purchases.length === 0) {
        setCurrentSubscription(null);
        return null;
      }

      // Find the most recent subscription purchase matching our SKUs
      const subscriptionPurchase = purchases.find((p) => SUBSCRIPTION_SKUS.includes(p.productId));

      if (!subscriptionPurchase) {
        setCurrentSubscription(null);
        return null;
      }

      // Verify against backend and update DB
      const result = await verifyPurchase(subscriptionPurchase);

      if (result?.success) {
        const normalized = {
          productId: result.productId,
          status: result.status,
          platform: !!subscriptionPurchase.transactionReceipt ? 'ios' : 'android',
          transactionId: subscriptionPurchase.transactionId,
          purchaseDate: subscriptionPurchase.transactionDate,
        };
        setCurrentSubscription(normalized);
        return normalized;
      }

      setCurrentSubscription(null);
      return null;
    } catch (err) {
      console.warn('Error fetching current subscription:', err);
      setCurrentSubscriptionError(err.message || 'Unknown error');
      setCurrentSubscription(null);
      return null;
    } finally {
      setCurrentSubscriptionLoading(false);
    }
  }, [initIAP, verifyPurchase]);

  // ─────────────────────────────────────────────
  // PURCHASE LISTENERS
  // Only removes listeners on user change — never kills the connection.
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id) return;

    const purchaseUpdate = purchaseUpdatedListener((purchase) => {
      if (!purchaseInitiatedRef.current) {
        console.log('Ignoring stale purchase from previous session:', getPurchaseKey(purchase));
        return;
      }
      console.log('Purchase received from store:', purchase);
      purchaseQueueRef.current = purchase;
    });

    const purchaseError = purchaseErrorListener((err) => {
      console.warn('Purchase listener error:', err);

      if (pendingPurchaseRef.current) {
        pendingPurchaseRef.current.reject(err);
        pendingPurchaseRef.current = null;
      }

      purchaseInitiatedRef.current = false;
      setLoading(false);
    });

    return () => {
      purchaseUpdate.remove();
      purchaseError.remove();
    };
  }, [user?.id]);

  // ─────────────────────────────────────────────
  // CONNECTION TEARDOWN
  // Empty deps — only fires on true component unmount.
  // ─────────────────────────────────────────────

  useEffect(() => {
    return () => {
      endConnection();
      initPromise = null;
      setConnected(false);
    };
  }, []);

  // ─────────────────────────────────────────────
  // PROCESS QUEUE
  // On successful verification, refreshes currentSubscription
  // so UI updates immediately after a new purchase completes.
  // ─────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!purchaseInitiatedRef.current) return;

      const pending = purchaseQueueRef.current;
      const uid = userRef.current?.id;

      if (!pending || !uid) return;

      const key = getPurchaseKey(pending);

      if (processedPurchases.current.has(key)) {
        purchaseQueueRef.current = null;
        return;
      }

      try {
        const result = await verifyPurchase(pending);

        if (result?.success) {
          await finishTransaction({ purchase: pending });

          processedPurchases.current.add(key);
          purchaseQueueRef.current = null;
          purchaseInitiatedRef.current = false;

          // Update currentSubscription immediately after new purchase
          setCurrentSubscription({
            productId: result.productId,
            status: result.status,
            platform: !!pending.transactionReceipt ? 'ios' : 'android',
            transactionId: pending.transactionId,
            purchaseDate: pending.transactionDate,
          });

          if (pendingPurchaseRef.current) {
            pendingPurchaseRef.current.resolve(result);
            pendingPurchaseRef.current = null;
          }

          setLoading(false);
          console.log('IAP verified and finished:', result);
        }
      } catch (err) {
        console.warn('Verify failed — will retry:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [verifyPurchase]);

  // ─────────────────────────────────────────────
  // RESTORE
  // Full restore — verifies all available purchases against backend.
  // Also refreshes currentSubscription when done.
  // ─────────────────────────────────────────────

  const restorePurchases = useCallback(async () => {
    setLoading(true);

    try {
      await initIAP();
      const purchases = await getAvailablePurchases();

      for (const p of purchases) {
        const key = getPurchaseKey(p);

        if (processedPurchases.current.has(key)) continue;

        try {
          const result = await verifyPurchase(p);

          if (result?.success) {
            await finishTransaction({ purchase: p });
            processedPurchases.current.add(key);
          }
        } catch (err) {
          console.warn('Restore verify failed for', key, ':', err);
        }
      }

      // Refresh currentSubscription after restore sweep
      await fetchCurrentSubscription();

      return purchases;
    } catch (err) {
      console.warn('Restore failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [initIAP, verifyPurchase, fetchCurrentSubscription]);

  // ─────────────────────────────────────────────
  // AUTO INIT + FETCH CURRENT SUBSCRIPTION
  // Fetch current subscription once connection is ready and user is present.
  // ─────────────────────────────────────────────

  useEffect(() => {
    initIAP();
  }, [initIAP]);

  useEffect(() => {
    if (!user?.id) return;
    fetchCurrentSubscription();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ intentionally omit fetchCurrentSubscription from deps —
  //   we only want this to run when the user logs in/changes,
  //   not every time verifyPurchase or initIAP references change.

  // ─────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────

  return {
    // connection
    connected,
    loading,

    // products
    products,
    subscriptions,
    getProducts,

    // purchasing
    purchase,
    restorePurchases,

    // current subscription
    currentSubscription,
    currentSubscriptionLoading,
    currentSubscriptionError,
    fetchCurrentSubscription,

    // misc
    initIAP,
  };
};
