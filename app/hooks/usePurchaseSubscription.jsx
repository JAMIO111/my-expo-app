import { requestSubscription } from 'react-native-iap';
import { Platform } from 'react-native';

export const usePurchaseSubscription = () => {
  const purchase = async (sku, currentSku) => {
    if (Platform.OS === 'android' && currentSku) {
      await requestSubscription({
        sku,
        subscriptionOffers: [],
        prorationModeAndroid: 1, // immediate with proration
      });
    } else {
      await requestSubscription({ sku });
    }
  };

  return { purchase };
};
