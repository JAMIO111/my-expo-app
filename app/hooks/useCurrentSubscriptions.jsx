import { useEffect, useState, useCallback } from 'react';
import RNIap, { getAvailablePurchases, initConnection, endConnection } from 'react-native-iap';

export const useCurrentSubscriptions = (validateReceiptOnServer) => {
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iapInitialized, setIapInitialized] = useState(false);

  const fetchCurrentSubscription = useCallback(async () => {
    if (!iapInitialized) return; // Wait until initConnection finishes

    setLoading(true);
    setError(null);

    try {
      const purchases = await getAvailablePurchases();
      console.log('Available purchases:', purchases);

      if (!purchases || purchases.length === 0) {
        setCurrentSubscription(null);
        return;
      }

      const subscriptionPurchase = purchases.find((p) =>
        [
          'com.jdigital.breakroom.pro.annual',
          'com.jdigital.breakroom.pro.monthly',
          'com.jdigital.breakroom.core.annual',
          'com.jdigital.breakroom.core.monthly',
        ].includes(p.productId)
      );

      if (!subscriptionPurchase) {
        setCurrentSubscription(null);
        return;
      }

      if (validateReceiptOnServer) {
        const validated = await validateReceiptOnServer(subscriptionPurchase.transactionReceipt);
        setCurrentSubscription(validated);
      } else {
        setCurrentSubscription({
          productId: subscriptionPurchase.productId,
          transactionId: subscriptionPurchase.transactionId,
          purchaseDate: subscriptionPurchase.transactionDate,
          platform: subscriptionPurchase.transactionReceipt?.length ? 'ios' : 'android',
        });
      }
    } catch (err) {
      console.warn('Error fetching current subscription', err);
      setError(err.message || 'Unknown error');
      setCurrentSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [iapInitialized, validateReceiptOnServer]);

  // Initialize IAP connection on mount
  useEffect(() => {
    const initIAP = async () => {
      try {
        await initConnection();
        setIapInitialized(true);
      } catch (err) {
        console.warn('IAP init error', err);
      }
    };

    initIAP();

    // Clean up on unmount
    return () => {
      endConnection();
    };
  }, []);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const restorePurchases = useCallback(async () => {
    await fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  return { currentSubscription, loading, error, restorePurchases };
};
