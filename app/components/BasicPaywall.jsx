import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  Gem,
  BarChart3,
  Swords,
  Trophy,
  CheckCheck,
  EyeOff,
  Check,
  Frown,
  Info,
  ArrowRight,
  Star,
  Medal,
  Palette,
} from 'lucide-react-native';
import Purchases from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CTAButton from '@components/CTAButton';
import {
  useOfferings,
  usePurchase,
  useCustomerInfo,
  useRevenueCat,
} from '@contexts/RevenueCatProvider';
import { useTheme } from '@contexts/ThemeProvider';

// ─── Static content ────────────────────────────────────────────────────────────
// Only list what each tier genuinely unlocks -- Core is everything behind the
// ProGate/Core checks; Pro additionally removes ads (AdBanner). Extend the Pro
// list here as more Pro-only features ship.
const TIER_INFO = {
  core: {
    name: 'Core',
    tagline: 'Everything you need to follow your league',
    benefits: [
      {
        text: 'In-depth team & player stats broken down by season and competition',
        icon: BarChart3,
      },
      {
        text: 'View all of your historical matches',
        icon: Swords,
      },
      {
        text: "Display your trophy cabinet on your profile and view others' awards",
        icon: Trophy,
      },
      {
        text: 'Unlock and display badges for participation and achievements',
        icon: Medal,
      },
    ],
  },

  pro: {
    name: 'Pro',
    tagline: 'The full Break Room experience',
    benefits: [
      { text: 'Everything in Core', icon: CheckCheck },
      { text: 'Ad-free experience', icon: EyeOff },
      { text: '2 exclusive app themes (Teal & Red)', icon: Palette },
    ],
  },
};

const PLAN_IMAGES = {
  pro: {
    monthly: require('@assets/pro-monthly.png'),
    annual: require('@assets/pro-annual.png'),
  },
  core: {
    monthly: require('@assets/core-monthly.png'),
    annual: require('@assets/core-annual.png'),
  },
};

const SCREENSHOTS = [
  require('@assets/league-table-light.png'),
  require('@assets/trophy-cabinet-light.png'),
  require('@assets/live-fixtures-light.png'),
  require('@assets/stats-light.png'),
  require('@assets/home-dashboard-light.png'),
];

const REVIEWS = [
  {
    id: '1',
    title: 'I love this app!',
    body: 'Its great seeing the scores come in live as they happen!',
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

const capitalise = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

// ─── Small pieces ──────────────────────────────────────────────────────────────
const BenefitRow = ({ text, icon: Icon }) => (
  <View className="flex-row items-center gap-3">
    <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand">
      <Icon size={20} color="white" strokeWidth={2.2} />
    </View>

    <Text className="flex-1 font-saira-medium text-lg text-text-1">{text}</Text>
  </View>
);

const ReviewCard = ({ item }) => (
  <View
    style={{ width: 280 }}
    className="rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-5">
    <View className="mb-3 flex-row items-center justify-between">
      <Image source={item.avatar} className="h-10 w-10 rounded-xl" />
      <View className="flex-row">
        {Array.from({ length: item.rating }, (_, i) => (
          <Star key={i} size={18} color="#FFD700" />
        ))}
      </View>
    </View>
    <Text className="font-saira-semibold text-lg text-text-1">{item.title}</Text>
    <Text className="mt-1 font-saira text-base text-text-2">{item.body}</Text>
  </View>
);

const Segmented = ({ options, value, onChange }) => (
  <View className="flex-row rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-1">
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
            active ? 'bg-brand' : ''
          }`}>
          <Text className={`font-saira-semibold text-lg ${active ? 'text-white' : 'text-text-2'}`}>
            {opt.label}
          </Text>
          {opt.badge ? (
            <View
              className={`rounded-full px-2 py-0.5 ${active ? 'bg-white/25' : 'bg-theme-green/20'}`}>
              <Text
                className={`font-saira-semibold text-xs ${active ? 'text-white' : 'text-theme-green'}`}>
                {opt.badge}
              </Text>
            </View>
          ) : null}
        </Pressable>
      );
    })}
  </View>
);

const TierCard = ({ tier, plan, selected, onPress }) => {
  const info = TIER_INFO[tier];
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-4 rounded-3xl border-2 bg-bg-grouped-2 p-3 pr-4 ${
        selected ? 'border-theme-purple' : 'border-transparent'
      }`}>
      <Image
        source={PLAN_IMAGES[tier]?.[plan?.interval ?? 'monthly']}
        resizeMode="contain"
        className="h-16 w-16 rounded-2xl"
      />
      <View className="flex-1">
        <Text className="font-saira-semibold text-2xl text-text-1">{info.name}</Text>
        <Text className="font-saira text-sm text-text-2" numberOfLines={2}>
          {info.tagline}
        </Text>
      </View>
      <View className="items-end">
        <Text className="font-saira-semibold text-xl text-text-1">
          {plan?.displayPrice ?? '--'}
        </Text>
        <Text className="font-saira text-sm text-text-2">
          per {plan?.interval === 'annual' ? 'year' : 'month'}
        </Text>
      </View>
      <View
        className={`h-7 w-7 items-center justify-center rounded-full border-2 ${
          selected ? 'border-theme-purple bg-theme-purple' : 'border-theme-gray-4'
        }`}>
        {selected ? <Check size={18} color="white" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
};

// ─── Paywall ───────────────────────────────────────────────────────────────────
const BasicPaywall = () => {
  const { offerings, fetch: fetchOfferings, isLoading: offeringsLoading } = useOfferings();
  const { customerInfo } = useCustomerInfo();
  const {
    purchasePackage: rcPurchase,
    restorePurchases: rcRestore,
    error: purchaseError,
    clearError: clearPurchaseError,
  } = usePurchase();
  const { isPro, isCore } = useRevenueCat();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedBilling, setSelectedBilling] = useState('annual');
  const [selectedTierState, setSelectedTierState] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isBusy = isSubscribing || isRestoring;

  // The paywall adapts to what the user already has:
  //   free -> offered Core or Pro; Core -> offered Pro only; Pro -> nothing to buy.
  const currentTier = isPro ? 'pro' : isCore ? 'core' : null;
  const availableTiers = isPro ? [] : isCore ? ['pro'] : ['core', 'pro'];
  const selectedTier = availableTiers.includes(selectedTierState)
    ? selectedTierState
    : (availableTiers[0] ?? null);

  // Packages are identified like "core.monthly", "pro.annual".
  const subscriptions = useMemo(
    () =>
      (offerings?.current?.availablePackages ?? []).map((pkg) => {
        const [tier, interval] = pkg.identifier.split('.');
        return {
          tier,
          interval,
          displayPrice: pkg.product.priceString,
          price: pkg.product.price,
          package: pkg,
        };
      }),
    [offerings]
  );

  const findPlan = (tier, interval) =>
    subscriptions.find((p) => p.tier === tier && p.interval === interval);

  const savingsPercent = (tier) => {
    const monthly = findPlan(tier, 'monthly')?.price;
    const annual = findPlan(tier, 'annual')?.price;
    if (!monthly || !annual) return 0;
    return Math.round(((monthly * 12 - annual) / (monthly * 12)) * 100);
  };

  const selectedPlan = selectedTier ? findPlan(selectedTier, selectedBilling) : null;
  // Only claim a *free* trial when the intro price really is free (an intro offer
  // can also be a paid discount); RevenueCat/the store applies it if eligible.
  const introPrice = selectedPlan?.package?.product?.introPrice;
  const hasTrial = introPrice != null && introPrice.price === 0;

  const activeEntitlement =
    customerInfo?.entitlements?.active?.['isPro'] ??
    customerInfo?.entitlements?.active?.['isCore'] ??
    null;
  const currentProductId = activeEntitlement?.productIdentifier ?? null;
  const currentPackage = (offerings?.current?.availablePackages ?? []).find(
    (pkg) => pkg.product.productIdentifier === currentProductId
  );
  const currentInterval = currentPackage?.identifier?.split('.')?.[1] ?? null;
  const currentPlanLabel = currentTier
    ? `${TIER_INFO[currentTier].name}${currentInterval ? ` – ${capitalise(currentInterval)}` : ''}`
    : 'Free';

  useEffect(() => {
    fetchOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // RevenueCatProvider never throws -- it stores failures in `error` (user
  // cancellations are deliberately not stored), so surface them here.
  useEffect(() => {
    if (!purchaseError) return;
    Toast.show({ type: 'error', text1: 'Purchase failed', text2: purchaseError.message });
    clearPurchaseError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseError]);

  useEffect(() => {
    if (!fullscreenImage) return;
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
  }, [fullscreenImage, scaleAnim, opacityAnim]);

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

  const handleSubscribe = async () => {
    if (!selectedPlan?.package) return;
    setIsSubscribing(true);
    try {
      // RevenueCat applies the intro/trial offer automatically when eligible.
      const info = await rcPurchase(selectedPlan.package);
      if (info) Toast.show({ type: 'success', text1: 'Subscription started' });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const info = await rcRestore();
      if (info) Toast.show({ type: 'success', text1: 'Purchases Restored' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleManage = async () => {
    setIsManaging(true);
    try {
      await Purchases.showManageSubscriptions();
    } catch (err) {
      console.error('Failed to open manage subscriptions:', err);
      Toast.show({
        type: 'error',
        text1: "Couldn't open subscription management",
        text2: err.message,
      });
    } finally {
      setIsManaging(false);
    }
  };

  // ─── Copy that depends on the plan ──────────────────────────────────────────
  const hero = isPro
    ? {
        eyebrow: 'PRO MEMBER',
        title: "You're on the Pro plan",
        subtitle: 'Thanks for supporting Break Room. Here is everything you have unlocked.',
      }
    : isCore
      ? {
          eyebrow: 'UPGRADE TO PRO',
          title: 'Take Break Room further',
          subtitle: 'You already have Core. Go Pro for the complete experience.',
        }
      : {
          eyebrow: 'BREAK ROOM PREMIUM',
          title: 'Unlock every last stat',
          subtitle: 'Follow every frame, unlock exclusive badges and climb the leaderboards.',
        };

  // Pro users see everything they have; Core users see what Pro adds; free users see Core.
  const benefitsHeading = isPro
    ? 'Your Pro benefits'
    : isCore
      ? 'What you get with Pro'
      : `What's included in ${TIER_INFO[selectedTier ?? 'core'].name}`;
  const benefits = isPro
    ? [...TIER_INFO.core.benefits, ...TIER_INFO.pro.benefits.slice(1)]
    : TIER_INFO[selectedTier ?? 'core'].benefits;

  const ctaLabel = isBusy
    ? 'Processing...'
    : !selectedPlan
      ? 'Select a plan'
      : hasTrial
        ? 'Start Free Trial'
        : isCore
          ? 'Upgrade to Pro'
          : `Get ${TIER_INFO[selectedTier].name}`;

  const summary = selectedPlan
    ? `${selectedPlan.displayPrice} per ${selectedBilling === 'annual' ? 'year' : 'month'}`
    : null;

  const showPurchaseUI = availableTiers.length > 0;
  const annualSaving = selectedTier ? savingsPercent(selectedTier) : 0;

  return (
    <View className="flex-1 bg-bg-grouped-1">
      {(isRestoring || isSubscribing) && (
        <View
          className="absolute inset-0 z-10 items-center justify-center bg-black/40 px-4"
          pointerEvents="auto">
          <View className="gap-3 rounded-2xl bg-bg-1 p-8">
            <ActivityIndicator size="large" color={themeColors.primaryText} />
            <Text className="mt-2 text-center font-saira-medium text-xl text-text-1">
              {isRestoring ? 'Restoring purchases...' : 'Processing subscription...'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: showPurchaseUI ? 24 : insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <View
          style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
          className="bg-brand px-6 pb-8 pt-6">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
              <Gem size={14} color="#FFD700" />
              <Text className="font-saira-semibold text-xs tracking-widest text-white">
                {hero.eyebrow}
              </Text>
            </View>
            <View className="rounded-full bg-black/25 px-3 py-1.5">
              <Text className="font-saira-medium text-xs text-white">
                Your plan: {currentPlanLabel}
              </Text>
            </View>
          </View>
          <Text style={{ lineHeight: 42 }} className="font-delagothic text-4xl text-white">
            {hero.title}
          </Text>
          <Text className="mt-3 font-saira text-lg text-white/80">{hero.subtitle}</Text>
        </View>

        {/* ── Plan picker ── */}
        {showPurchaseUI && (
          <View className="mt-6 gap-4 px-4">
            <Segmented
              value={selectedBilling}
              onChange={setSelectedBilling}
              options={[
                { value: 'monthly', label: 'Monthly' },
                {
                  value: 'annual',
                  label: 'Annual',
                  badge: annualSaving > 0 ? `Save ${annualSaving}%` : null,
                },
              ]}
            />

            {subscriptions.length > 0 ? (
              availableTiers.map((tier) => (
                <TierCard
                  key={tier}
                  tier={tier}
                  plan={findPlan(tier, selectedBilling)}
                  selected={selectedTier === tier}
                  onPress={() => setSelectedTierState(tier)}
                />
              ))
            ) : offeringsLoading ? (
              <View className="items-center rounded-3xl bg-bg-grouped-2 p-8">
                <ActivityIndicator color={themeColors.primaryText} />
                <Text className="mt-3 font-saira text-lg text-text-2">Loading plans...</Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-4 rounded-3xl bg-bg-grouped-2 p-4">
                <View className="rounded-2xl bg-theme-red p-3">
                  <Frown size={32} color="#FFFFFF" strokeWidth={2.5} />
                </View>
                <Text className="flex-1 font-saira text-lg text-text-2">
                  No subscription plans are available right now. Please check back later.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Benefits ── */}
        <View className="mt-6 px-4">
          <View className="gap-4 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-5">
            <Text className="font-saira-semibold text-xl text-text-1">{benefitsHeading}</Text>
            {benefits.map((item) => (
              <BenefitRow key={item.text} {...item} />
            ))}
          </View>
        </View>

        {/* ── Current plan management (paying users) ── */}
        {currentTier && (
          <View className="mt-6 px-4">
            <View className="gap-3 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-5">
              <Text className="font-saira-semibold text-xl text-text-1">Your subscription</Text>
              <Text className="font-saira text-base text-text-2">
                {currentPlanLabel}
                {activeEntitlement?.expirationDate
                  ? ` · ${activeEntitlement.willRenew ? 'renews' : 'ends'} ${new Date(
                      activeEntitlement.expirationDate
                    ).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : ''}
              </Text>
              <CTAButton
                type="default"
                text={isManaging ? 'Opening...' : 'Manage Subscription'}
                disabled={isManaging}
                callbackFn={handleManage}
              />
            </View>
          </View>
        )}

        {/* ── Screenshots ── */}
        <View className="mt-8">
          <Text className="mb-3 px-6 font-saira-semibold text-xl text-text-1">
            See it in action
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
            {SCREENSHOTS.map((src, idx) => (
              <Pressable key={idx} onPress={() => setFullscreenImage(src)}>
                <View
                  style={{ borderRadius: 20 }}
                  className="overflow-hidden border border-theme-gray-5 bg-theme-gray-1 p-1">
                  <Image
                    style={{ width: 144, height: 310 }}
                    resizeMode="contain"
                    className="rounded-2xl"
                    source={src}
                  />
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable
            className="mx-4 mt-4 flex-row items-center gap-3 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-4"
            onPress={() => Linking.openURL('https://www.break-room.uk/features')}>
            <Info size={24} color={themeColors.primaryText} strokeWidth={2.5} />
            <Text className="flex-1 font-saira-medium text-base text-text-1">
              See everything included on our website
            </Text>
            <ArrowRight size={18} color={themeColors.primaryText} strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* ── Reviews ── */}
        <View className="mt-8">
          <Text className="mb-3 px-6 font-saira-semibold text-xl text-text-1">
            Loved by players and admins alike
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
            {REVIEWS.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </ScrollView>
        </View>

        {/* ── Footer ── */}
        <View className="mt-8 gap-4 px-6">
          {showPurchaseUI && (
            <Text className="text-center font-saira text-xs text-text-3">
              Subscriptions renew automatically unless cancelled at least 24 hours before the end of
              the current period. Manage or cancel any time in your App Store / Google Play account
              settings.
            </Text>
          )}
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => Linking.openURL('https://break-room.uk/privacy')}>
              <Text className="font-saira text-text-2 underline">Privacy Policy</Text>
            </Pressable>
            <Pressable onPress={handleRestore} disabled={isBusy}>
              <Text className="font-saira text-text-2 underline">Restore Purchases</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://break-room.uk/terms')}>
              <Text className="font-saira text-text-2 underline">Terms of Use</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ── Sticky purchase bar ── */}
      {showPurchaseUI && (
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="gap-2 border-t border-theme-gray-5 bg-bg-grouped-1 px-4 pt-3">
          {summary ? (
            <Text className="text-center font-saira-medium text-base text-text-2">
              {hasTrial ? `Free trial, then ${summary}` : summary}
            </Text>
          ) : null}
          <CTAButton
            type="yellow"
            textColor="black"
            text={ctaLabel}
            lucideIcon={<Gem size={20} color="black" />}
            callbackFn={handleSubscribe}
            disabled={!selectedPlan || isBusy}
          />
        </View>
      )}

      <Modal visible={!!fullscreenImage} transparent onRequestClose={handleCloseModal}>
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
    </View>
  );
};

export default BasicPaywall;
