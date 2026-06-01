/**
 * RevenueCatProvider.jsx
 *
 * Full-lifecycle RevenueCat context provider for React Native.
 * Uses the official `react-native-purchases` SDK.
 *
 * Install:
 *   npm install react-native-purchases
 *   npx pod-install   # iOS
 *
 * Usage:
 *   <RevenueCatProvider apiKey="appl_..." appUserId="user-123">
 *     <App />
 *   </RevenueCatProvider>
 *
 *   const { customerInfo, purchasePackage, isEntitled } = useRevenueCat();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { useUser } from '@contexts/UserProvider';

// ─── Context ──────────────────────────────────────────────────────────────────

const RevenueCatContext = createContext(null);
RevenueCatContext.displayName = 'RevenueCatContext';

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {string}   props.apiKey            RevenueCat API key for the current platform
 * @param {string}   [props.iosApiKey]       If you pass both keys the provider picks automatically
 * @param {string}   [props.androidApiKey]   Same as above
 * @param {boolean}  [props.debug]           Enables verbose RC logging in dev
 * @param {function} [props.onCustomerInfoChange]
 * @param {function} [props.onError]
 * @param {React.ReactNode} props.children
 */
export function RevenueCatProvider({
  apiKey,
  iosApiKey,
  androidApiKey,
  debug = __DEV__,
  onCustomerInfoChange,
  onError,
  children,
}) {
  const listenerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const { user } = useUser();
  const [userId, setUserId] = useState(user?.id ?? null);

  // Prevent double-init (React Strict Mode / Fast Refresh)
  const initDoneRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleError = useCallback(
    (err) => {
      setError(err);
      onError?.(err);
    },
    [onError]
  );

  const clearError = useCallback(() => setError(null), []);

  const applyCustomerInfo = useCallback(
    (info) => {
      setCustomerInfo(info);
      onCustomerInfoChange?.(info);
    },
    [onCustomerInfoChange]
  );

  // ── SDK init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        if (debug) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        const resolvedKey =
          iosApiKey && androidApiKey
            ? Platform.select({ ios: iosApiKey, android: androidApiKey })
            : apiKey;

        if (!resolvedKey) {
          throw new Error(
            '[RevenueCat] No API key provided. Pass `apiKey` or both `iosApiKey` and `androidApiKey`.'
          );
        }

        // Always configure anonymously — identification happens in the effect below
        await Purchases.configure({ apiKey: resolvedKey });

        listenerRef.current = (info) => {
          if (!cancelled) applyCustomerInfo(info);
        };
        Purchases.addCustomerInfoUpdateListener(listenerRef.current);

        const info = await Purchases.getCustomerInfo();
        const currentUserId = await Purchases.getAppUserID();

        if (!cancelled) {
          applyCustomerInfo(info);
          setUserId(currentUserId);
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) handleError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (listenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(listenerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Identify / deidentify when auth state changes ─────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    if (user?.id) {
      logIn(user.id);
    } else {
      logOut();
    }
  }, [user?.id, isReady]);

  // ── Entitlement check ─────────────────────────────────────────────────────────

  const isEntitled = useCallback(
    (entitlementId) => {
      return !!customerInfo?.entitlements?.active?.[entitlementId];
    },
    [customerInfo]
  );

  // ── Fetch offerings ───────────────────────────────────────────────────────────

  const fetchOfferings = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const result = await Purchases.getOfferings();
      setOfferings(result);
      return result;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError]);

  // ── Purchase a package ────────────────────────────────────────────────────────

  const purchasePackage = useCallback(
    async (pkg) => {
      setIsLoading(true);
      clearError();
      try {
        const { customerInfo: info } = await Purchases.purchasePackage(pkg);
        applyCustomerInfo(info);
        return info;
      } catch (err) {
        // PurchasesErrorCode.purchaseCancelledError — user hit cancel, not a real error
        if (!err.userCancelled) {
          handleError(err);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [applyCustomerInfo, clearError, handleError]
  );

  // ── Purchase a product directly (by product ID) ───────────────────────────────

  const purchaseStoreProduct = useCallback(
    async (storeProduct) => {
      setIsLoading(true);
      clearError();
      try {
        const { customerInfo: info } = await Purchases.purchaseStoreProduct(storeProduct);
        applyCustomerInfo(info);
        return info;
      } catch (err) {
        if (!err.userCancelled) {
          handleError(err);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [applyCustomerInfo, clearError, handleError]
  );

  // ── Restore purchases ─────────────────────────────────────────────────────────

  const restorePurchases = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const info = await Purchases.restorePurchases();
      applyCustomerInfo(info);
      return info;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, clearError, handleError]);

  // ── Log in ────────────────────────────────────────────────────────────────────

  const logIn = useCallback(
    async (newUserId) => {
      setIsLoading(true);
      clearError();
      try {
        const { customerInfo: info, created } = await Purchases.logIn(newUserId);
        applyCustomerInfo(info);
        setUserId(newUserId);
        return { customerInfo: info, created };
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [applyCustomerInfo, clearError, handleError]
  );

  // ── Log out ───────────────────────────────────────────────────────────────────

  const logOut = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const appUserId = await Purchases.getAppUserID();
      const isAnonymous = await Purchases.isAnonymous();

      let info = null;
      if (!isAnonymous) {
        info = await Purchases.logOut();
        applyCustomerInfo(info);
      }
      const anonId = await Purchases.getAppUserID();
      setUserId(anonId);
      return info;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, clearError, handleError]);

  // ── Refresh CustomerInfo ──────────────────────────────────────────────────────

  const refreshCustomerInfo = useCallback(async () => {
    setIsLoading(true);
    clearError();
    try {
      const info = await Purchases.getCustomerInfo();
      applyCustomerInfo(info);
      return info;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo, clearError, handleError]);

  // ── Set attributes (useful for targeting / analytics) ─────────────────────────

  const setAttributes = useCallback(
    async (attributes) => {
      try {
        await Purchases.setAttributes(attributes);
      } catch (err) {
        handleError(err);
      }
    },
    [handleError]
  );

  // ── Context value (memoised to avoid unnecessary re-renders) ──────────────────

  const value = useMemo(
    () => ({
      // State
      isReady,
      isLoading,
      error,
      customerInfo,
      offerings,
      userId,
      // Entitlements
      isPro: !!customerInfo?.entitlements?.active?.isPro,
      isCore: !!customerInfo?.entitlements?.active?.isCore,
      // Actions
      fetchOfferings,
      purchasePackage,
      purchaseStoreProduct,
      restorePurchases,
      logIn,
      logOut,
      refreshCustomerInfo,
      setAttributes,
      clearError,
    }),
    [
      isReady,
      isLoading,
      error,
      customerInfo,
      offerings,
      userId,
      fetchOfferings,
      purchasePackage,
      purchaseStoreProduct,
      restorePurchases,
      logIn,
      logOut,
      refreshCustomerInfo,
      setAttributes,
      clearError,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

// ─── Primary Hook ─────────────────────────────────────────────────────────────

/**
 * Access the full RevenueCat context.
 * Must be called inside a <RevenueCatProvider>.
 */
export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) {
    throw new Error(
      'useRevenueCat() must be used inside <RevenueCatProvider>. ' +
        'Wrap your app (or the relevant subtree) with it.'
    );
  }
  return ctx;
}

// ─── Convenience Hooks ────────────────────────────────────────────────────────

/**
 * Returns current CustomerInfo and a manual refresh function.
 *
 * @example
 *   const { customerInfo, refresh } = useCustomerInfo();
 */
export function useCustomerInfo() {
  const { customerInfo, refreshCustomerInfo } = useRevenueCat();
  return { customerInfo, refresh: refreshCustomerInfo };
}

/**
 * Returns available offerings and a fetch trigger.
 *
 * @example
 *   const { offerings, fetch } = useOfferings();
 *   useEffect(() => { fetch(); }, []);
 */
export function useOfferings() {
  const { offerings, fetchOfferings, isLoading } = useRevenueCat();
  return { offerings, fetch: fetchOfferings, isLoading };
}

/**
 * Returns purchase helpers plus loading / error state.
 *
 * @example
 *   const { purchasePackage, isLoading, error } = usePurchase();
 */
export function usePurchase() {
  const { purchasePackage, purchaseStoreProduct, restorePurchases, isLoading, error, clearError } =
    useRevenueCat();
  return { purchasePackage, purchaseStoreProduct, restorePurchases, isLoading, error, clearError };
}

/**
 * Returns auth helpers and the current userId.
 *
 * @example
 *   const { logIn, logOut, userId } = useRevenueCatAuth();
 */
export function useRevenueCatAuth() {
  const { logIn, logOut, userId, isLoading } = useRevenueCat();
  return { logIn, logOut, userId, isLoading };
}

export default RevenueCatProvider;
