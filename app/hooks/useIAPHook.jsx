import { useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { useIAP, ErrorCode } from 'react-native-iap';
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
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const purchaseLock = useRef(false);
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
        setIsSubscribing(false);
      } catch (error) {
        setIsSubscribing(false);
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
      setIsSubscribing(false);
      console.log(
        'IAP onPurchaseError:',
        JSON.stringify({
          code: error.code,
          message: error.message,
        })
      );
      // User dismissed the payment sheet — silent, no alert needed
      if (error.code === ErrorCode.UserCancelled) return;

      switch (error.code) {
        // ── Network / Connectivity ─────────────────────────────────────────────
        case ErrorCode.NetworkError:
          Alert.alert('No Connection', 'Please check your internet connection and try again.');
          break;

        case ErrorCode.ServiceDisconnected:
        case ErrorCode.ConnectionClosed:
          Alert.alert('Store Disconnected', 'Lost connection to the store. Please try again.');
          break;

        case ErrorCode.RemoteError:
          Alert.alert('Store Error', 'The store returned an error. Please try again in a moment.');
          break;

        // ── Store / Billing Availability ───────────────────────────────────────
        case ErrorCode.BillingUnavailable:
        case ErrorCode.IapNotAvailable:
          Alert.alert(
            'Store Unavailable',
            Platform.OS === 'android'
              ? 'Google Play billing is unavailable. Please check your Play Store account.'
              : 'The App Store is currently unavailable. Please try again later.'
          );
          break;

        case ErrorCode.ActivityUnavailable:
          Alert.alert(
            'Cannot Open Store',
            'The payment screen could not be opened. Please try again.'
          );
          break;

        case ErrorCode.FeatureNotSupported:
          Alert.alert('Not Supported', 'Subscriptions are not supported on this device.');
          break;

        // ── Product / SKU Issues ───────────────────────────────────────────────
        case ErrorCode.ItemUnavailable:
        case ErrorCode.SkuNotFound:
          Alert.alert(
            'Plan Unavailable',
            'This plan is not currently available. Please try again later.'
          );
          break;

        case ErrorCode.EmptySkuList:
        case ErrorCode.QueryProduct:
          Alert.alert(
            'Could Not Load Plans',
            'Failed to load subscription plans. Please restart the app and try again.'
          );
          break;

        case ErrorCode.SkuOfferMismatch:
          Alert.alert(
            'Plan Mismatch',
            'There was a mismatch with the selected plan. Please try selecting it again.'
          );
          break;

        // ── Ownership ──────────────────────────────────────────────────────────
        case ErrorCode.AlreadyOwned:
          Alert.alert(
            'Already Subscribed',
            'It looks like you already have this plan. Try restoring your purchases.',
            [
              { text: 'Restore Purchases', onPress: () => restorePurchases() },
              { text: 'Dismiss', style: 'cancel' },
            ]
          );
          break;

        case ErrorCode.ItemNotOwned:
          Alert.alert('Not Subscribed', 'No active subscription was found for this plan.');
          break;

        // ── Payment Flow ───────────────────────────────────────────────────────
        case ErrorCode.DeferredPayment:
          Alert.alert(
            'Approval Pending',
            'Your purchase is waiting for approval (e.g. Ask to Buy). You will be notified once confirmed.'
          );
          break;

        case ErrorCode.Pending:
          Alert.alert(
            'Purchase Pending',
            'Your purchase is being processed. Please wait and check back shortly.'
          );
          break;

        case ErrorCode.Interrupted:
          Alert.alert(
            'Purchase Interrupted',
            'Your purchase was interrupted. No payment was taken — please try again.'
          );
          break;

        case ErrorCode.UserError:
          Alert.alert(
            'Payment Not Allowed',
            'Your device is not authorised to make payments. Check your payment method or parental control settings.'
          );
          break;

        // ── Receipt / Transaction Validation ──────────────────────────────────
        case ErrorCode.ReceiptFailed:
        case ErrorCode.TransactionValidationFailed:
        case ErrorCode.PurchaseVerificationFailed:
          Alert.alert(
            'Verification Failed',
            'We could not verify your purchase. Please contact support — you will not be charged.'
          );
          break;

        case ErrorCode.NotEnded:
        case ErrorCode.ReceiptFinishedFailed:
        case ErrorCode.PurchaseVerificationFinishFailed:
          Alert.alert(
            'Transaction Incomplete',
            'Your purchase completed but could not be finalised. Please restore purchases or contact support.',
            [
              { text: 'Restore Purchases', onPress: () => restorePurchases() },
              { text: 'Dismiss', style: 'cancel' },
            ]
          );
          break;

        // ── Developer / Config Errors (should never surface in production) ─────
        case ErrorCode.DeveloperError:
        case ErrorCode.InitConnection:
        case ErrorCode.NotPrepared:
        case ErrorCode.AlreadyPrepared:
        case ErrorCode.SyncError:
          console.error('[IAP Config Error]', { code: error.code, message: error.message });
          Alert.alert('Something Went Wrong', 'An unexpected error occurred. Please try again.');
          break;

        // ── Catch-all ──────────────────────────────────────────────────────────
        case ErrorCode.PurchaseError:
        case ErrorCode.ServiceError:
        case ErrorCode.Unknown:
        default:
          Alert.alert(
            'Something Went Wrong',
            'An unexpected error occurred. Please try again or contact support if the problem persists.'
          );
          console.error('[IAP Error]', {
            code: error.code,
            message: error.message,
            platform: Platform.OS,
          });
          break;
      }
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

    if (purchaseLock.current) {
      Alert.alert('Purchase In Progress', 'Please wait for the current purchase to complete.');
      return;
    }

    try {
      purchaseLock.current = true;
      setIsSubscribing(true);
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
    } finally {
      purchaseLock.current = false;
    }
  };

  const restorePurchases = async () => {
    setIsRestoring(true);
    try {
      const purchases = await getAvailablePurchases();

      const list = purchases || availablePurchases || [];

      if (!list.length) {
        Alert.alert('No Purchases Found', 'No previous purchases were found for this account.');
        setIsRestoring(false);
        return { restoredCount: 0, failedCount: 0 };
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) throw new Error('No active session');

      let restoredCount = 0;
      let failedCount = 0;

      for (const purchase of list) {
        try {
          const response = await supabase.functions.invoke('verify-receipt', {
            body: { purchase, userId: session.user.id },
          });

          const data =
            typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

          if (response.error || !data?.valid) {
            failedCount++;
            continue;
          }

          await finishTransaction({ purchase });
          restoredCount++;
        } catch {
          failedCount++;
        }
      }

      Alert.alert(
        'Restore Complete',
        `Restored ${restoredCount} purchase(s). ${
          failedCount ? `${failedCount} failed to restore.` : ''
        }`
      );

      setIsRestoring(false);
      return { restoredCount, failedCount };
    } catch (error) {
      console.error('[IAP] Restore failed:', error?.message);
      throw error;
    } finally {
      setIsRestoring(false);
    }
  };

  return {
    subscriptions: normalizedSubscriptions, // ✅ clean, normalised array
    currentSubscription, // ✅ normalised active plan or null
    handleSubscribe,
    isSubscribing,
    restorePurchases,
    isRestoring,
    isLoading,
  };
};

export default useIAPHook;
