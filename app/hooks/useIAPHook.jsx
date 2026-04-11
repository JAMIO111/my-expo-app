import { useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useIAP } from 'react-native-iap';
import { handlePurchaseError } from '@lib/helperFunctions';
import { supabase } from '@/lib/supabase';

// Derives tier and interval from the SKU string
// e.g. 'com.jdigital.breakroom.pro.monthly' → { tier: 'pro', interval: 'monthly' }
const parseSku = (sku) => {
  const parts = sku.split('.');
  const interval = parts.at(-1); // 'monthly' | 'annual'
  const tier = parts.at(-2); // 'pro' | 'core'
  return { tier, interval };
};

const normalizeSubscriptions = (rawSubscriptions) => {
  return rawSubscriptions.map((sub) => {
    const { tier, interval } = parseSku(sub.id);

    // --- Price ---
    // Both platforms expose a top-level displayPrice, but on Android
    // the richer data lives inside subscriptionOfferDetailsAndroid
    let displayPrice = sub.displayPrice ?? '';
    let price = sub.price ?? null;
    let currency = sub.currency ?? '';

    if (Platform.OS === 'android' && sub.subscriptionOfferDetailsAndroid?.length) {
      // Grab the base plan offer (no offerTags = no free-trial offer)
      const basePlan =
        sub.subscriptionOfferDetailsAndroid.find((o) => !o.offerTags?.length) ??
        sub.subscriptionOfferDetailsAndroid[0];

      const pricingPhase = basePlan?.pricingPhasesAndroid?.pricingPhaseList?.at(-1);
      if (pricingPhase) {
        displayPrice = pricingPhase.formattedPrice ?? displayPrice;
        price = pricingPhase.priceAmountMicros
          ? Number(pricingPhase.priceAmountMicros) / 1_000_000
          : price;
        currency = pricingPhase.priceCurrencyCode ?? currency;
      }
    }

    if (Platform.OS === 'ios' && sub.subscriptionInfoIOS) {
      currency = sub.subscriptionInfoIOS.currency ?? currency;
    }

    return {
      // identifiers
      sku: sub.id,
      tier, // 'pro' | 'core'
      interval, // 'monthly' | 'annual'
      // display
      displayPrice, // e.g. '£1.99'
      price, // e.g. 1.99
      currency, // e.g. 'GBP'
      title: sub.title,
      description: sub.description,
      // keep the raw object for purchase requests
      raw: sub,
    };
  });
};

const useIAPHook = () => {
  const {
    connected,
    subscriptions,
    availablePurchases,
    getAvailablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
    isLoading,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      console.log('[IAP] onPurchaseSuccess:', {
        transactionId: purchase.transactionId,
        productId: purchase.productId,
        platform: purchase.platform,
      });

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error('No active session');

        // Stale transaction guard — re-delivered unfinished transactions
        // from previous sessions fire onPurchaseSuccess on mount
        const idempotencyId =
          purchase.platform === 'ios' ? purchase.transactionId : purchase.purchaseToken;

        const { data: existing } = await supabase
          .from('UserSubscriptions')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('original_transaction_id', idempotencyId)
          .maybeSingle();

        if (existing?.status === 'active') {
          console.log('[IAP] Already active — finishing silently');
          await finishTransaction({ purchase });
          return;
        }

        // Send full purchase object — edge function reads
        // purchase.platform, purchase.purchaseToken, purchase.productId directly
        const response = await supabase.functions.invoke('verify-receipt', {
          body: { purchase, userId: session.user.id },
        });

        // Defensive parse — supabase-js can return data as string
        const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

        console.log('[IAP] verify-receipt response:', data);

        if (response.error) {
          throw new Error(`Edge function error: ${response.error.message}`);
        }

        if (!data?.valid) {
          throw new Error(`Receipt invalid: ${data?.error ?? JSON.stringify(data)}`);
        }

        // ✅ Verified — safe to finish
        await finishTransaction({ purchase });
        console.log('[IAP] Purchase complete:', data.productId, data.status);
      } catch (error) {
        // ❌ Don't finish — unfinished transactions replay on next launch
        console.error('[IAP] Verification error:', error?.message);
        Alert.alert(
          'Activation Failed',
          'Your payment was taken but we could not activate your plan. Please restore your purchases.',
          [
            { text: 'Restore Purchases', onPress: () => restorePurchases() },
            { text: 'Dismiss', style: 'cancel' },
          ]
        );
      }
    },
    onPurchaseError: (error) => {
      console.log(
        'IAP onPurchaseError:',
        JSON.stringify({
          code: error.code,
          message: error.message,
        })
      );
      handlePurchaseError(error);
    },
  });

  useEffect(() => {
    if (connected) {
      fetchProducts({
        skus: [
          'com.jdigital.breakroom.pro.monthly',
          'com.jdigital.breakroom.pro.annual',
          'com.jdigital.breakroom.core.monthly',
          'com.jdigital.breakroom.core.annual',
        ],
        type: 'subs',
      });
      getAvailablePurchases(); // fetch what the user already owns
    }
  }, [connected]);

  const normalizedSubscriptions = normalizeSubscriptions(subscriptions ?? []);

  const getActiveSubscription = () => {
    if (!availablePurchases?.length) return null;

    if (Platform.OS === 'android') {
      return availablePurchases.find((p) => p.autoRenewingAndroid === true) ?? null;
    } else {
      return (
        [...availablePurchases].sort((a, b) => b.transactionDate - a.transactionDate)[0] ?? null
      );
    }
  };

  const activePurchase = getActiveSubscription();

  // Match the active purchase back to a normalised plan
  const currentSubscription = activePurchase
    ? (normalizedSubscriptions.find((s) => s.sku === activePurchase.productId) ?? null)
    : null;

  const handleSubscribe = async (plan) => {
    console.log('Subscribing to plan:', plan?.sku);
    if (!plan) return;

    try {
      await requestPurchase({
        request: {
          apple: { sku: plan.sku },
          google: {
            skus: [plan.sku],
            subscriptionOffers:
              plan.raw.subscriptionOfferDetailsAndroid?.map((offer) => ({
                sku: plan.sku,
                offerToken: offer.offerToken,
              })) ?? [],
          },
        },
        type: 'subs',
      });
    } catch (e) {
      console.log('[IAP] requestPurchase threw:', e?.message, e?.code);
    }
  };

  const restorePurchases = async () => {
    try {
      // getAvailablePurchases populates the availablePurchases state,
      // it doesn't return the array — read from state after calling it
      await getAvailablePurchases();

      // Small delay to let state update after the call
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!availablePurchases?.length) {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('No active session');

      let restoredCount = 0;
      let failedCount = 0;

      for (const purchase of availablePurchases) {
        try {
          console.log('[IAP] Restoring purchase:', {
            productId: purchase.productId,
            transactionId: purchase.transactionId,
            platform: purchase.platform,
          });

          const response = await supabase.functions.invoke('verify-receipt', {
            body: { purchase, userId: session.user.id },
          });

          const data =
            typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

          if (response.error || !data?.valid) {
            console.warn('[IAP] Restore verify failed for:', purchase.productId, data?.error);
            failedCount++;
            continue;
          }

          await finishTransaction({ purchase });
          restoredCount++;
          console.log('[IAP] Restored:', purchase.productId, data.status);
        } catch (purchaseError) {
          console.error('[IAP] Error restoring purchase:', purchaseError?.message);
          failedCount++;
        }
      }

      // Show result to user
      if (restoredCount > 0) {
        Alert.alert(
          'Purchases Restored',
          `Successfully restored ${restoredCount} purchase${restoredCount > 1 ? 's' : ''}.`
        );
      } else if (failedCount > 0) {
        Alert.alert(
          'Restore Failed',
          'We could not restore your purchases. Please contact support if this continues.'
        );
      } else {
        Alert.alert('Nothing to Restore', 'No active subscriptions were found for this account.');
      }
    } catch (error) {
      console.error('[IAP] Restore failed:', error?.message);
      Alert.alert(
        'Restore Failed',
        'Something went wrong while restoring your purchases. Please try again.'
      );
    }
  };

  return {
    subscriptions: normalizedSubscriptions, // ✅ clean, normalised array
    currentSubscription, // ✅ normalised active plan or null
    handleSubscribe,
    restorePurchases,
    isLoading,
  };
};

export default useIAPHook;
