import { Pressable, StyleSheet, Text, View, Image, Modal, Animated, Easing } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { ScrollView } from 'react-native-gesture-handler';

const BasicPaywall = () => {
  const [paymentType, setPaymentType] = useState('monthly');
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
    <View className="w-full flex-1 items-center justify-start bg-brand-dark py-6">
      <Text
        style={{ lineHeight: 40 }}
        className="px-4 text-left font-delagothic text-4xl text-text-on-brand">
        Get Access to the Full App for just £1.49/month
      </Text>

      {/* Features List */}
      <View className="my-5 w-full items-start justify-start gap-4 rounded-2xl p-6">
        {[
          'Access to Live Results',
          'View the League Tables',
          'See Upcoming Fixtures',
          'Climb the Leaderboards',
          'Unlock Exclusive Badges',
        ].map((text, idx) => (
          <View key={idx} className="flex-row items-center justify-start gap-3">
            <View className="rounded-full border-2 border-theme-yellow bg-theme-yellow/70 p-1">
              <IonIcons name="checkmark" size={24} color="black" />
            </View>
            <Text className="font-saira-medium text-xl text-text-on-brand">{text}</Text>
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
              <View className="overflow-hidden rounded-3xl bg-text-1 p-2">
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
      <View className="w-full gap-5 px-4 py-8">
        {/* Monthly Option */}
        <Pressable
          onPress={() => setPaymentType('monthly')}
          className={`mb-3 w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-white/10 px-5 py-5 ${paymentType === 'monthly' ? 'border-theme-yellow' : 'border-white/20'}`}>
          <View
            className={`${paymentType === 'monthly' ? 'border-theme-yellow' : 'border-white/50'} rounded-full border-2 border-theme-yellow p-1`}>
            <IonIcons
              name="checkmark"
              size={24}
              color={paymentType === 'monthly' ? 'white' : 'transparent'}
            />
          </View>
          <View>
            <Text className="font-saira-semibold text-2xl text-white">Monthly</Text>
            <Text className="font-saira text-lg text-text-on-brand">
              £1.49/month (1 year membership)
            </Text>
          </View>
        </Pressable>

        {/* Yearly Option */}
        <View className="relative w-full overflow-visible">
          <Pressable
            onPress={() => setPaymentType('yearly')}
            className={`w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-white/10 px-5 py-5 ${paymentType === 'yearly' ? 'border-theme-yellow' : 'border-white/20'}`}>
            <View
              className={`${paymentType === 'yearly' ? 'border-theme-yellow' : 'border-white/50'} rounded-full border-2 border-theme-yellow p-1`}>
              <IonIcons
                name="checkmark"
                size={24}
                color={paymentType === 'yearly' ? 'white' : 'transparent'}
              />
            </View>
            <View>
              <Text className="font-saira-semibold text-2xl text-white">Yearly</Text>
              <Text className="font-saira text-lg text-text-on-brand">£14.99 (1 off payment)</Text>
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
          <CTAButton type="yellow" textColor="black" text="Upgrade Now!" onPress={() => {}} />
        </View>
      </View>
    </View>
  );
};

export default BasicPaywall;

const styles = StyleSheet.create({});
