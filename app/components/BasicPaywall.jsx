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
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { ScrollView, Switch } from 'react-native-gesture-handler';
import colors from '../lib/colors';
import { useCurrentSubscriptions } from '@hooks/useCurrentSubscriptions';
import { useIAP } from '@hooks/useIAP';

const BasicPaywall = () => {
  const [selectedBilling, setSelectedBilling] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const scrollRef = useRef(null);
  const {
    connected,
    products,
    subscriptions,
    getProducts,
    purchase,
    completeTransaction,
    restorePurchases,
    loading,
  } = useIAP();

  const {
    currentSubscription,
    loading: currentSubscriptionLoading,
    error: currentSubscriptionError,
    restorePurchases: restoreCurrentPurchases,
  } = useCurrentSubscriptions();

  useEffect(() => {
    getProducts({
      skus: [
        'com.jdigital.breakroom.pro.monthly',
        'com.jdigital.breakroom.pro.annual',
        'com.jdigital.breakroom.core.monthly',
        'com.jdigital.breakroom.core.annual',
      ],
      type: 'subs',
    });
  }, []);

  console.log('Available subscription plans from useIAP:', subscriptions);
  console.log('Current subscription:', currentSubscription);

  const handleSubscribe = async (plan) => {
    console.log('Selected plan:', plan);
    if (!plan) return;
    try {
      await purchase({ sku: plan.sku, type: 'subs' });
    } catch (err) {
      console.warn('Purchase error', err);
    }
  };

  const proPercentageOff = subscriptions
    ? Math.round(
        ((subscriptions.find((p) => p.tier === 'pro' && p.interval === 'monthly')?.price * 12 -
          subscriptions.find((p) => p.tier === 'pro' && p.interval === 'annual')?.price) /
          (subscriptions.find((p) => p.tier === 'pro' && p.interval === 'monthly')?.price * 12)) *
          100
      )
    : 0;

  const corePercentageOff = subscriptions
    ? Math.round(
        ((subscriptions.find((p) => p.tier === 'core' && p.interval === 'monthly')?.price * 12 -
          subscriptions.find((p) => p.tier === 'core' && p.interval === 'annual')?.price) /
          (subscriptions.find((p) => p.tier === 'core' && p.interval === 'monthly')?.price * 12)) *
          100
      )
    : 0;

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

  // Animate in
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
    // Animate out
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

  return (
    <ScrollView ref={scrollRef} className="w-full flex-1 bg-bg-grouped-1 py-6">
      <Text
        style={{ lineHeight: 40 }}
        className="px-6 text-left font-delagothic text-4xl text-text-1">
        Get Access to the Full App for just £1.99/month
      </Text>
      <View className="my-6 mt-8 w-full px-6">
        <CTAButton
          type="yellow"
          textColor="black"
          text={isTrialEnabled ? 'Start Free Trial' : 'Upgrade Now!'}
          callbackFn={() => {
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
        />
      </View>

      <View className="mb-5 w-full items-start justify-start gap-4 rounded-2xl p-6">
        {[
          { text: 'Access to Live Results', icon: 'play-outline' },
          { text: 'View the League Tables', icon: 'list-outline' },
          { text: 'See Upcoming Fixtures', icon: 'calendar-outline' },
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="w-full border-y border-theme-gray-5 bg-bg-grouped-2 px-6 py-8">
        {screenshots.map((src, idx) => (
          <View key={idx} className="pr-8">
            <Pressable onPress={() => setFullscreenImage(src)}>
              <View style={{ borderRadius: 17 }} className="overflow-hidden bg-theme-gray-1 p-1">
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
          <View
            style={{ width: 300, flexShrink: 0 }}
            className="mb-8 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-6 py-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Image
                contentFit="contain"
                className="h-12 w-12 rounded-full border"
                source={require('@assets/avatar.jpg')}
              />
              <View className="ml-2 flex-row">
                {Array.from({ length: 5 }, (_, i) => (
                  <IonIcons key={i} name="star" size={24} color="gold" />
                ))}
              </View>
            </View>
            <Text className="font-saira-medium text-xl text-text-1">"I love this app!"</Text>
            <Text className="mt-2 font-saira text-lg text-text-2">
              "Its great seeing the scores come in live as they happen!"
            </Text>
          </View>
          <View
            style={{ width: 300, flexShrink: 0 }}
            className="mb-8 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 px-6 py-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Image
                contentFit="contain"
                className="h-12 w-12 rounded-full border"
                source={require('@assets/avatar.jpg')}
              />
              <View className="ml-2 flex-row">
                {Array.from({ length: 5 }, (_, i) => (
                  <IonIcons key={i} name="star" size={24} color="gold" />
                ))}
              </View>
            </View>
            <Text className="font-saira-medium text-xl text-text-1">"Stats galore"</Text>
            <Text className="mt-2 font-saira text-lg text-text-2">
              "I love being able to look at all of my stats in one place and compare them to
              others."
            </Text>
          </View>
        </ScrollView>

        <View className="mt-4 w-full gap-4 overflow-visible px-4">
          {subscriptions && subscriptions.length > 0 ? (
            subscriptions.map((plan) => {
              const isCurrentPlan =
                currentSubscription &&
                plan.sku ===
                  currentSubscription.productId; /* Adjust this condition based on your subscription data structure */

              const isUpgrade =
                currentSubscription && plan.tier === 'pro' && currentSubscription.tier === 'core';

              const isDowngrade =
                currentSubscription && plan.tier === 'core' && currentSubscription.tier === 'pro';

              return (
                <Pressable
                  key={plan.id}
                  disabled={isCurrentPlan || loading}
                  onPress={() => {
                    if (isCurrentPlan) return;
                    setSelectedBilling(plan.interval);
                    setSelectedTier(plan.tier);
                    setSelectedPlan(plan);
                  }}
                  className={`relative w-full flex-row items-center justify-start gap-4 rounded-3xl border bg-bg-1 p-2 pr-5 ${
                    isCurrentPlan
                      ? 'opacity-50'
                      : selectedBilling === plan.interval && selectedTier === plan.tier
                        ? 'border-theme-purple'
                        : 'border-theme-gray-3'
                  }`}>
                  <Image
                    contentFit="contain"
                    className="h-20 w-20 rounded-2xl"
                    source={planImages[plan.tier]?.[plan.interval]}
                  />

                  <View className="flex-1">
                    <Text className="font-saira-semibold text-2xl text-text-1">
                      {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)} –{' '}
                      {plan.interval.charAt(0).toUpperCase() + plan.interval.slice(1)}
                    </Text>

                    <Text className="font-saira text-xl text-text-1">
                      {plan.displayPrice}/
                      {plan.interval === 'monthly'
                        ? 'month'
                        : plan.interval === 'annual'
                          ? 'year'
                          : 'period'}
                    </Text>

                    {isCurrentPlan && <Text className="text-sm text-green-500">Current plan</Text>}

                    {isUpgrade && <Text className="text-sm text-blue-500">Upgrade</Text>}

                    {isDowngrade && (
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-sm text-theme-blue">
                        Downgrades next billing period
                      </Text>
                    )}
                  </View>

                  {isCurrentPlan ? (
                    <View className="bg-theme-yellow-100 rounded-full border border-brand">
                      <View className="rounded-full bg-brand-light">
                        <Text
                          style={{ lineHeight: 28 }}
                          className="px-2 font-saira-medium text-xl text-white">
                          Current Plan
                        </Text>
                      </View>
                    </View>
                  ) : (
                    plan.interval === 'annual' && (
                      <View className="rounded-full border border-theme-purple bg-black">
                        <View className="rounded-full bg-theme-purple/70">
                          <Text
                            style={{ lineHeight: 28 }}
                            className="px-2 font-saira-medium text-xl text-white">
                            {plan.tier === 'pro' ? proPercentageOff : corePercentageOff}% Off
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
                          : 'border-theme-gray-3'
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
          ) : (
            <Text className="text-center font-saira text-lg text-text-2">
              No subscription plans available at the moment. Please check back later.
            </Text>
          )}
        </View>
        <View className="mb-2 mt-8 w-full flex-row items-center justify-between px-6">
          <Text className="font-saira-medium text-xl text-text-1">Enable 7-day free trial</Text>
          <Switch
            value={isTrialEnabled}
            onValueChange={setIsTrialEnabled}
            thumbColor={'white'}
            trackColor={{
              false: 'gray',
              true: '#4CAF50',
            }}
          />
        </View>
        <View className="mt-4 w-full px-4">
          <CTAButton
            type="yellow"
            textColor="black"
            text={
              loading
                ? 'Processing...'
                : !selectedPlan
                  ? 'Select a Plan'
                  : isTrialEnabled
                    ? 'Start Free Trial'
                    : 'Upgrade Now!'
            }
            callbackFn={() => handleSubscribe(selectedPlan)}
            disabled={!selectedPlan || loading}
          />
        </View>
        <View className="mb-4 flex-row items-center justify-between gap-3 px-4 pt-6">
          <Pressable
            onPress={() => restorePurchases()}
            className="flex-1 text-left text-text-2 underline">
            Restore Purchases
          </Pressable>
          <Pressable className="flex-1 text-center text-text-2 underline">Privacy Policy</Pressable>
          <Pressable className="flex-1 text-right text-text-2 underline">Terms of Use</Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default BasicPaywall;

const styles = StyleSheet.create({});
