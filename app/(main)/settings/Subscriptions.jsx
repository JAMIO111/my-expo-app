import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Purchases from 'react-native-purchases';
import SettingsItem from '@components/SettingsItem';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import colors from '@lib/colors';
import Toast from 'react-native-toast-message';

const planImages = {
  pro: {
    monthly: require('@assets/pro-monthly.jpg'),
    annual: require('@assets/pro-annual.jpg'),
  },
  core: {
    monthly: require('@assets/core-monthly.jpg'),
    annual: require('@assets/core-annual.jpg'),
  },
};

// productIdentifier like 'pro.monthly' -> { tier: 'pro', interval: 'monthly' }
const parseProductId = (productId) => {
  if (!productId) return null;
  const [tier, interval] = productId.split('.');
  return { tier, interval };
};

const formatDate = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const Subscriptions = () => {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const themeColors = colorScheme === 'dark' ? colors.dark : colors.light;

  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [managing, setManaging] = useState(false);

  const loadCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err) {
      console.error('Failed to fetch RevenueCat customer info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomerInfo();

    const listener = (info) => setCustomerInfo(info);
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [loadCustomerInfo]);

  const activeEntitlement =
    customerInfo?.entitlements?.active?.['isPro'] ??
    customerInfo?.entitlements?.active?.['isCore'] ??
    null;

  console.log('activeEntitlement:', activeEntitlement);

  const identifier = activeEntitlement?.productIdentifier;

  const parts = identifier?.split('.') ?? [];

  const interval = parts[parts.length - 1];
  const tier = parts[parts.length - 2];
  const planInfo = { tier, interval };

  const handleManageSubscription = async () => {
    setManaging(true);
    try {
      await Purchases.showManageSubscriptions();
    } catch (err) {
      console.error('Failed to open manage subscriptions:', err);
    } finally {
      setManaging(false);
    }
  };

  const handleRestore = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      Toast.show({ type: 'success', text1: 'Purchases Restored' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Restore Failed', text2: err.message });
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Subscriptions & Billing" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View>
          <Text className="w-full pb-3 pl-1 font-saira-bold text-xl">Your Plan</Text>

          {loading ? (
            <View className="mb-8 w-full items-center justify-center rounded-3xl bg-bg-1 p-6">
              <ActivityIndicator size="small" color={themeColors?.icon} />
            </View>
          ) : activeEntitlement && planInfo ? (
            <Pressable
              onPress={handleManageSubscription}
              disabled={managing}
              className="mb-8 w-full flex-row items-center justify-between rounded-3xl bg-bg-1 p-4 py-3">
              <Image
                source={planImages[planInfo.tier]?.[planInfo.interval]}
                className="h-24 w-24 rounded-xl"
              />

              <View className="ml-4 flex-1">
                <Text style={{ fontSize: 22 }} className="font-saira-medium text-text-1">
                  {planInfo.tier.charAt(0).toUpperCase() + planInfo.tier.slice(1)}
                </Text>
                <Text className="font-saira text-lg text-text-2">
                  {planInfo.interval === 'annual' ? 'Annual' : 'Monthly'} plan
                </Text>
                <Text className="mt-1 font-saira text-sm text-text-3">
                  {activeEntitlement.willRenew
                    ? `Renews ${formatDate(activeEntitlement.expirationDate)}`
                    : `Expires ${formatDate(activeEntitlement.expirationDate)}`}
                </Text>
                {activeEntitlement.periodType === 'TRIAL' && (
                  <Text className="text-theme-gold mt-1 font-saira text-sm">Free trial</Text>
                )}
              </View>

              {managing ? (
                <ActivityIndicator size="small" color={themeColors?.icon} />
              ) : (
                <View className="rounded-full border border-theme-gray-5 p-2">
                  <Ionicons name="chevron-forward" size={20} color={themeColors?.icon} />
                </View>
              )}
            </Pressable>
          ) : (
            <View className="mb-8 w-full items-center rounded-3xl bg-bg-1 p-6">
              <Text className="mb-3 font-saira text-lg text-text-2">
                You don't have an active subscription
              </Text>
              <Pressable
                onPress={() => router.push('/paywall')}
                className="rounded-xl bg-brand px-6 py-2">
                <Text className="font-saira-medium text-white">View Plans</Text>
              </Pressable>
            </View>
          )}
        </View>

        <MenuContainer>
          <SettingsItem
            callbackFn={handleRestore}
            iconColor="#1E90FF"
            title="Restore Purchases"
            titleColor="text-[#1E90FF]"
            icon="refresh"
          />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Subscriptions;
