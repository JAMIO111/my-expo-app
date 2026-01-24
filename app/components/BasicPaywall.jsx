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
import { useRouter } from 'expo-router';

const BasicPaywall = () => {
  const [paymentType, setPaymentType] = useState('monthly');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isTrialEnabled, setIsTrialEnabled] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();

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
    <View className="w-full flex-1 items-center justify-start bg-bg-grouped-1 py-6">
      <Text
        style={{ lineHeight: 40 }}
        className="px-4 text-left font-delagothic text-4xl text-text-1">
        Get Access to the Full App for just £1.49/month
      </Text>

      {/* Features List */}
      <View className="my-5 w-full items-start justify-start gap-4 rounded-2xl p-6">
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

      {/* Horizontal ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="w-full border-y border-theme-gray-4 bg-bg-grouped-2 px-4 py-8">
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

      {/* Fullscreen Modal with animation */}
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

      {/* Payment options */}
      <View className="w-full px-4 pt-8">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 20,
            paddingHorizontal: 16,
          }}>
          <View
            style={{ width: 300, flexShrink: 0 }}
            className="mb-8 rounded-3xl border border-theme-gray-3 bg-bg-grouped-2 px-6 py-4">
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
            className="mb-8 rounded-3xl border border-theme-gray-3 bg-bg-grouped-2 px-6 py-4">
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
        <View className="my-4 w-full flex-row items-center justify-between px-2">
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
        {/* Monthly Option */}
        <Pressable
          onPress={() => setPaymentType('monthly')}
          className={`mb-8 w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-black/5 px-5 py-5 ${paymentType === 'monthly' ? 'border-theme-purple' : 'border-theme-gray-3'}`}>
          <View
            className={`${paymentType === 'monthly' ? 'border-theme-purple' : 'border-theme-gray-3'} rounded-full border-2 p-1`}>
            <IonIcons
              name="checkmark"
              size={24}
              color={paymentType === 'monthly' ? themeColors.primaryText : 'transparent'}
            />
          </View>
          <View>
            <Text className="font-saira-semibold text-2xl text-text-1">Monthly</Text>
            <Text className="font-saira text-lg text-text-1">£1.49/month (1 year membership)</Text>
          </View>
        </Pressable>

        {/* Yearly Option */}
        <View className="relative w-full overflow-visible">
          <Pressable
            onPress={() => setPaymentType('yearly')}
            className={`mb-4 w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-black/5 px-5 py-5 ${paymentType === 'yearly' ? 'border-theme-purple' : 'border-theme-gray-3'}`}>
            <View
              className={`${paymentType === 'yearly' ? 'border-theme-purple' : 'border-theme-gray-3'} rounded-full border-2 p-1`}>
              <IonIcons
                name="checkmark"
                size={24}
                color={paymentType === 'yearly' ? themeColors.primaryText : 'transparent'}
              />
            </View>
            <View>
              <Text className="font-saira-semibold text-2xl text-text-1">Yearly</Text>
              <Text className="font-saira text-lg text-text-1">£14.99 (1 off payment)</Text>
            </View>
          </Pressable>

          {/* Discount Badge */}
          <View className="absolute -top-4 right-10 z-10 rounded-full border border-theme-purple bg-brand-dark">
            <View className="rounded-full bg-theme-purple/70">
              <Text
                style={{ lineHeight: 28 }}
                className="px-2 font-saira-medium text-xl text-white">
                16% Off
              </Text>
            </View>
          </View>
        </View>

        {/* Upgrade Button */}
        <View className="mt-4 w-full">
          <CTAButton
            type="yellow"
            textColor="black"
            text={isTrialEnabled ? 'Start Free Trial' : 'Upgrade Now!'}
            callbackFn={() => {
              router.replace('/(main)/home');
            }}
          />
        </View>
        <View className="flex-row items-center justify-between gap-3 px-3 pt-6">
          <Text className="text-text-2 underline">Restore Purchases</Text>
          <Text className="text-text-2 underline">Privacy Policy</Text>
          <Text className="text-text-2 underline">Terms of Use</Text>
        </View>
      </View>
    </View>
  );
};

export default BasicPaywall;

const styles = StyleSheet.create({});
