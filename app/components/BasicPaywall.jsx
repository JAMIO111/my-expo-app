import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  Animated,
  Easing,
  useColorScheme,
  Linking,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import colors from '../lib/colors';
import { ActivityIndicator } from 'react-native';
import Purchases, { INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import {
  useOfferings,
  usePurchase,
  useCustomerInfo,
  useRevenueCat,
} from '@contexts/RevenueCatProvider';

const reviews = [
  {
    id: '1',
    title: 'I love this app!',
    body: 'Its great seeing the scores come in live as they happen! ',
    avatar: require('@assets/avatar.jpg'),
    rating: 5,
  },
  {
    id: '2',
    title: 'Stats galore',
    body: 'I love being able to look at all of my stats in one place and compare them to others.',
    avatar: require('@assets/avatar.jpg'),
    rating: 5,
  },
  {
    id: '3',
    title: 'Fantastic for league management',
    body: 'The league management features are fantastic. It makes running my Thursday league so much easier.',
    avatar: require('@assets/avatar.jpg'),
    rating: 5,
  },
];

const ReviewCard = ({ item }) => {
  return (
    <View
      style={{ width: 300, flexShrink: 0 }}
      className="mb-8 rounded-3xl bg-bg-grouped-2 px-6 py-4 shadow-sm">
      <View className="mb-4 flex-row items-center justify-between">
        <Image contentFit="contain" className="h-12 w-12 rounded-xl border" source={item.avatar} />

        <View className="ml-2 flex-row">
          {Array.from({ length: item.rating }, (_, i) => (
            <IonIcons key={i} name="star" size={24} color="#FFD700" />
          ))}
        </View>
      </View>

      <Text className="font-saira-medium text-xl text-text-1">"{item.title}"</Text>

      <Text className="mt-2 font-saira text-lg text-text-2">"{item.body}"</Text>
    </View>
  );
};

const BasicPaywall = () => {
  // ─── RC hooks ────────────────────────────────────────────────────────────────
  const { offerings, fetch: fetchOfferings, isLoading: offeringsLoading } = useOfferings();
  const { customerInfo } = useCustomerInfo();
  const { purchasePackage: rcPurchase, restorePurchases: rcRestore } = usePurchase();
  const { isPro, isCore } = useRevenueCat();

  console.log('Offerings in Paywall:', offerings);

  // ─── Local state ─────────────────────────────────────────────────────────────
  const [selectedBilling, setSelectedBilling] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);
  const [introEligibility, setIntroEligibility] = useState({});
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const scrollRef = useRef(null);

  const isLoading = offeringsLoading || isSubscribing || isRestoring;

  // ─── Derive subscriptions list from RC packages ───────────────────────────────
  // Packages use identifiers like "core.monthly", "pro.annual" etc.
  const packages = offerings?.current?.availablePackages ?? [];

  const subscriptions = packages.map((pkg) => {
    const [tier, interval] = pkg.identifier.split('.');
    return {
      tier,
      interval,
      displayPrice: pkg.product.priceString,
      price: pkg.product.price,
      package: pkg,
    };
  });

  // ─── Derive current plan info from customerInfo ───────────────────────────────
  const activeEntitlement =
    isPro || isCore
      ? customerInfo?.entitlements?.active?.['isPro'] ||
        customerInfo?.entitlements?.active?.['isCore']
      : null;

  const currentProductId = activeEntitlement?.productIdentifier ?? null;

  // Match the active product back to one of our packages so we know tier + interval
  const currentPackage = packages.find((pkg) => pkg.product.productIdentifier === currentProductId);
  const currentInterval = currentPackage?.identifier?.split('.')?.[1] ?? null;

  // "subscription" here mirrors the old hook's truthiness check (any active plan)
  const subscription = isPro || isCore ? activeEntitlement : null;

  // ─── Fetch offerings on mount ─────────────────────────────────────────────────
  useEffect(() => {
    fetchOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Is the currently selected plan's product eligible for an intro offer?
  const selectedProductId = selectedPlan?.package?.product?.productIdentifier;
  const hasTrial = selectedPlan?.package?.product?.introPrice != null;
  const isTrialEligible = hasTrial;

  // ─── Percentage-off calculations ─────────────────────────────────────────────
  const proPercentageOff = subscriptions.length
    ? Math.round(
        ((subscriptions.find((p) => p.tier === 'pro' && p.interval === 'monthly')?.price * 12 -
          subscriptions.find((p) => p.tier === 'pro' && p.interval === 'annual')?.price) /
          (subscriptions.find((p) => p.tier === 'pro' && p.interval === 'monthly')?.price * 12)) *
          100
      )
    : 0;

  const corePercentageOff = subscriptions.length
    ? Math.round(
        ((subscriptions.find((p) => p.tier === 'core' && p.interval === 'monthly')?.price * 12 -
          subscriptions.find((p) => p.tier === 'core' && p.interval === 'annual')?.price) /
          (subscriptions.find((p) => p.tier === 'core' && p.interval === 'monthly')?.price * 12)) *
          100
      )
    : 0;

  // ─── Actions ──────────────────────────────────────────────────────────────────
  const handleSubscribe = async (plan) => {
    if (!plan?.package) return;
    setIsSubscribing(true);
    try {
      // RC automatically applies the intro offer when the user is eligible —
      // no separate "purchase with trial" call is needed.
      await rcPurchase(plan.package);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      return await rcRestore();
    } finally {
      setIsRestoring(false);
    }
  };

  // ─── Modal animations ─────────────────────────────────────────────────────────
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

  const screenshots = [
    require('@assets/league-table-light.png'),
    require('@assets/trophy-cabinet-light.png'),
    require('@assets/live-fixtures-light.png'),
    require('@assets/stats-light.png'),
    require('@assets/home-dashboard-light.png'),
  ];

  useEffect(() => {
    if (fullscreenImage) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    }
  }, [fullscreenImage]);

  const handleCloseModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start(() => setFullscreenImage(null));
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {(isRestoring || isSubscribing) && (
        <View
          className="absolute z-10 flex-1 items-center justify-center bg-black/40 px-4"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View className="gap-3 rounded-xl bg-bg-1 p-8">
            <ActivityIndicator size="large" color="#000000" />
            <Text className="mt-4 text-center font-saira-medium text-xl text-text-1">
              {isRestoring ? 'Restoring purchases...' : 'Processing subscription...'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} className="relative w-full flex-1 bg-bg-grouped-1 py-6">
        <Text
          style={{ lineHeight: 44 }}
          className="px-6 text-left font-delagothic text-4xl text-text-1">
          {!isPro && !isCore
            ? "Get Access to everyone's stats for just £1.99/month"
            : isCore
              ? 'Go Pro and unlock exclusive insights and features!'
              : "You're on the Pro plan! Thanks for your support!"}
        </Text>

        <View className="my-6 mt-8 w-full px-6">
          {!isPro && (
            <CTAButton
              type="yellow"
              textColor="black"
              text="Upgrade Now!"
              callbackFn={() => scrollRef.current?.scrollToEnd({ animated: true })}
            />
          )}
        </View>

        <View className="mb-5 w-full items-start justify-start gap-4 rounded-2xl p-6">
          {[
            { text: 'Access to Live Results', icon: 'play-outline' },
            { text: 'In Depth Team & Player Stats', icon: 'list-outline' },
            { text: 'See All Upcoming Fixtures', icon: 'calendar-outline' },
            { text: 'Climb the Leaderboards', icon: 'podium-outline' },
            { text: 'Unlock Exclusive Badges', icon: 'star-outline' },
          ].map((item, idx) => (
            <View key={idx} className="flex-row items-center justify-start gap-3">
              <View
                style={{ padding: 5 }}
                className="rounded-xl border-2 border-brand bg-brand-light">
                <IonIcons name={item.icon} size={24} color="white" />
              </View>
              <Text className="font-saira-medium text-xl text-text-1">{item.text}</Text>
            </View>
          ))}
        </View>
        <View className="gap-6 border-y border-theme-gray-5 bg-bg-grouped-2 px-6 py-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full">
            {screenshots.map((src, idx) => (
              <View key={idx} className="pr-8">
                <Pressable onPress={() => setFullscreenImage(src)}>
                  <View
                    style={{ borderRadius: 17 }}
                    className="overflow-hidden bg-theme-gray-1 p-1">
                    <Image
                      contentFit="contain"
                      className="mx-auto h-96 w-48 rounded-2xl"
                      source={src}
                    />
                  </View>
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Pressable
            className="mt-2 flex-row items-center gap-3 rounded-2xl border border-brand-dark bg-brand p-4"
            onPress={() => Linking.openURL('https://www.break-room.uk/features')}>
            <IonIcons name="information-circle-outline" size={24} color="#fff" />
            <Text className="flex-1 font-saira-medium text-lg text-white">
              See more about features here
            </Text>
            <IonIcons name="arrow-forward" size={20} color="#fff" />
          </Pressable>
        </View>

        <Modal visible={!!fullscreenImage} transparent>
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.8)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleCloseModal}>
            <Animated.Image
              source={fullscreenImage}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'contain',
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }}
            />
          </Pressable>
        </Modal>

        <View className="w-full pt-8">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              gap: 20,
              paddingHorizontal: 20,
            }}>
            {reviews.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </ScrollView>

          {/* ── Plan cards ── */}
          <View className="mt-4 w-full gap-4 overflow-visible px-4">
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions
                .sort(
                  (a, b) =>
                    (a.tier === 'pro' ? 1 : 0) - (b.tier === 'pro' ? 1 : 0) ||
                    (a.interval === 'annual' ? 1 : 0) - (b.interval === 'annual' ? 1 : 0)
                )
                .map((plan, idx) => {
                  const isCurrentPlan = currentProductId === plan.package.product.identifier;

                  console.log('Current Product ID:', currentProductId);
                  console.log('Plan Product ID:', plan.package.product.identifier);

                  return (
                    <Pressable
                      key={idx}
                      disabled={isCurrentPlan || isLoading}
                      onPress={() => {
                        if (isCurrentPlan) return;
                        setSelectedBilling(plan.interval);
                        setSelectedTier(plan.tier);
                        setSelectedPlan(plan);
                      }}
                      className={`relative w-full flex-row items-center justify-start gap-4 rounded-3xl border-2 bg-bg-1 p-2 pr-5 shadow-sm ${
                        isCurrentPlan
                          ? 'border-brand opacity-50'
                          : selectedBilling === plan.interval && selectedTier === plan.tier
                            ? 'border-theme-purple'
                            : 'border-transparent'
                      }`}>
                      <Image
                        contentFit="contain"
                        className="h-20 w-20 rounded-2xl"
                        source={planImages[plan.tier]?.[plan.interval]}
                      />

                      <View className="flex-1">
                        <Text className="font-saira-semibold text-2xl text-text-1">
                          {plan.tier.charAt(0)?.toUpperCase() + plan.tier.slice(1)} –{' '}
                          {plan.interval.charAt(0)?.toUpperCase() + plan.interval.slice(1)}
                        </Text>

                        <Text className="font-saira text-xl text-text-1">
                          {plan.displayPrice}/
                          {plan.interval === 'monthly'
                            ? 'month'
                            : plan.interval === 'annual'
                              ? 'year'
                              : 'period'}
                        </Text>

                        {isCurrentPlan && (
                          <Text className="font-saira text-sm text-theme-green">Current plan</Text>
                        )}

                        {isCore && plan.tier === 'pro' && (
                          <Text className="font-saira text-sm text-theme-blue">
                            Upgrade to Pro!
                          </Text>
                        )}

                        {((isPro && plan.tier === 'core') ||
                          (isPro &&
                            currentInterval === 'annual' &&
                            plan.interval === 'monthly')) && (
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            className="font-saira text-sm text-theme-blue">
                            Downgrades next billing period
                          </Text>
                        )}
                      </View>

                      {isCurrentPlan ? (
                        <View
                          style={{ borderRadius: 12 }}
                          className="bg-theme-yellow-100 border border-brand">
                          <View style={{ borderRadius: 10 }} className="bg-brand-light">
                            <Text
                              style={{ lineHeight: 20 }}
                              className="px-2 pt-2 text-center font-saira-medium text-xl text-white">
                              Current{'\n'}Plan
                            </Text>
                          </View>
                        </View>
                      ) : (
                        plan.interval === 'annual' && (
                          <View
                            style={{ borderRadius: 12 }}
                            className="border border-theme-purple bg-black">
                            <View style={{ borderRadius: 10 }} className="bg-theme-purple/70">
                              <Text
                                style={{ lineHeight: 20 }}
                                className="px-2 pt-2 text-center font-saira-medium text-xl text-white">
                                {plan.tier === 'pro' ? proPercentageOff : corePercentageOff}%{'\n'}
                                Off
                              </Text>
                            </View>
                          </View>
                        )
                      )}

                      {!isCurrentPlan && (
                        <View
                          className={`rounded-full border-2 p-1 ${
                            selectedBilling === plan.interval && selectedTier === plan.tier
                              ? 'border-theme-purple'
                              : 'border-theme-gray-4'
                          }`}>
                          <IonIcons
                            name="checkmark"
                            size={24}
                            color={
                              selectedBilling === plan.interval && selectedTier === plan.tier
                                ? themeColors.primaryText
                                : 'transparent'
                            }
                          />
                        </View>
                      )}
                    </Pressable>
                  );
                })
            ) : isLoading ? (
              Array.from({ length: 4 }, (_, idx) => (
                <View
                  key={idx}
                  className="w-full animate-pulse flex-row items-center justify-center rounded-3xl bg-bg-1 p-4 pr-5 shadow-sm">
                  <View className="h-20 w-20 rounded-2xl bg-theme-gray-3" />
                  <View className="ml-4 flex-1 flex-row justify-center text-center">
                    <Text className="items-center font-saira text-xl text-text-2">
                      Loading subscriptions...
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View className="w-full flex-row items-center justify-center rounded-3xl bg-bg-1 p-4 pr-5 shadow-sm">
                <View className="items-center justify-center rounded-2xl bg-theme-red p-3">
                  <IonIcons name="sad-outline" size={40} color={'#FFFFFF'} />
                </View>
                <View className="ml-4 flex-1 flex-row justify-center text-center">
                  <Text className="items-center font-saira text-lg text-text-2">
                    No subscription plans available at the moment. Please check back later.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Trial toggle — only shown when user has no plan and a trial-eligible plan is selected */}
          {!subscription && subscriptions && subscriptions.length > 0 && isTrialEligible && (
            <View className="mt-6 w-full flex-row items-center justify-between px-6">
              <Text className="font-saira-medium text-xl text-text-1">
                Enable 14-day free trial
              </Text>
              <Switch
                value={isTrialEnabled}
                onValueChange={setIsTrialEnabled}
                thumbColor={'white'}
                trackColor={{ false: 'gray', true: '#4CAF50' }}
              />
            </View>
          )}

          <View className="mt-6 w-full px-4">
            <CTAButton
              type="yellow"
              textColor="black"
              text={
                isLoading
                  ? 'Processing...'
                  : !selectedPlan
                    ? 'Select a Plan'
                    : isTrialEnabled && isTrialEligible
                      ? 'Start Free Trial'
                      : 'Upgrade Now!'
              }
              callbackFn={() => handleSubscribe(selectedPlan)}
              disabled={!selectedPlan || isLoading}
            />
          </View>

          <View className="flex-row items-center justify-between gap-3 px-6 py-8">
            <Pressable
              onPress={() => Linking.openURL('https://break-room.uk/privacy')}
              className="flex-1 py-2 text-text-2 underline">
              <Text className="text-left font-saira text-text-2 underline">Privacy Policy</Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                try {
                  await handleRestore();
                } catch (err) {
                  console.error('Error restoring purchases:', err);
                }
              }}
              className="flex-1 py-2 text-text-2 underline">
              <Text className="text-center font-saira text-text-2 underline">
                Restore Purchases
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Linking.openURL('https://break-room.uk/terms')}
              className="flex-1 py-2 text-text-2 underline">
              <Text className="text-right font-saira text-text-2 underline">Terms of Use</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default BasicPaywall;

const styles = StyleSheet.create({});
