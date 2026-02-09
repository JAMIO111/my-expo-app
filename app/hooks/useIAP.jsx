// hooks/useIAP.js
import { useEffect, useState, useCallback } from 'react';
import { normalizeSubscription } from '@lib/helperFunctions';
import RNIap, {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from 'react-native-iap';

let isInitialized = false; // ensure initConnection only runs once

export const useIAP = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [purchaseListener, setPurchaseListener] = useState(null);
  const [errorListener, setErrorListener] = useState(null);

  // Initialize IAP connection
  const initIAP = useCallback(async () => {
    if (!isInitialized) {
      setLoading(true);
      try {
        const result = await initConnection();
        setConnected(result);
        isInitialized = true;
      } catch (err) {
        console.warn('IAP init error', err);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Fetch products (in-app) or subscriptions
  const getProducts = useCallback(
    async ({ skus = [], type = 'in-app' }) => {
      setLoading(true);
      if (!connected) await initIAP();

      try {
        let items = [];
        if (type === 'in-app') {
          items = await fetchProducts({ skus, type: 'in-app' });
          setProducts(items.map(normalizeSubscription));
        } else if (type === 'subs') {
          items = await fetchProducts({ skus, type: 'subs' });
          setSubscriptions(items.map(normalizeSubscription));
        }
        return items.map(normalizeSubscription);
      } catch (err) {
        console.warn('Failed to fetch products/subscriptions', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connected, initIAP]
  );

  // Request a purchase
  const purchase = useCallback(
    async ({ sku, type = 'subs' }) => {
      setLoading(true);
      if (!connected) await initIAP();

      try {
        await requestPurchase({
          request: {
            apple: { sku, quantity: 1 },
            google: { skus: [sku] },
          },
          type,
        });
      } catch (err) {
        console.warn('Purchase request failed', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [connected, initIAP]
  );

  // Finish transaction
  const completeTransaction = useCallback(async (purchaseObj, isConsumable = false) => {
    setLoading(true);
    try {
      await finishTransaction({ purchase: purchaseObj, isConsumable });
    } catch (err) {
      console.warn('Failed to finish transaction', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for purchase updates
  useEffect(() => {
    const purchaseUpdate = purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase updated', purchase);
      try {
        await finishTransaction({ purchase });
      } catch (err) {
        console.warn('Failed to finish transaction', err);
      }
    });

    const purchaseError = purchaseErrorListener((err) => {
      console.warn('Purchase error', err);
    });

    setPurchaseListener(purchaseUpdate);
    setErrorListener(purchaseError);

    return () => {
      if (purchaseListener) purchaseListener.remove();
      if (errorListener) errorListener.remove();
      endConnection();
      isInitialized = false;
    };
  }, []);

  // Restore previous purchases
  const restorePurchases = useCallback(async () => {
    setLoading(true);
    try {
      const available = await RNIap.getAvailablePurchases();
      return available;
    } catch (err) {
      console.warn('Restore purchases failed', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    connected,
    products,
    subscriptions,
    initIAP,
    getProducts,
    purchase,
    completeTransaction,
    restorePurchases,
    loading,
  };
};
