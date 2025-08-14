import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import IonIcons from 'react-native-vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';

const PremiumPaywall = () => {
  const [paymentType, setPaymentType] = React.useState('monthly');
  return (
    <View className="w-full flex-1 items-center justify-start bg-brand-dark p-6">
      <Text
        style={{ lineHeight: 40 }}
        className="pl-3 text-left font-delagothic text-4xl text-text-on-brand">
        Go Pro with our Premium Membership
      </Text>
      <View className="my-5 w-full items-start justify-start gap-4 rounded-2xl p-3">
        <View className="flex-row items-center justify-start gap-3">
          <View className="rounded-full border-2 border-theme-yellow bg-theme-yellow/70 p-1">
            <IonIcons name="checkmark" size={24} color="black" />
          </View>
          <Text className="font-saira-medium text-xl text-text-on-brand">
            In-depth match analysis
          </Text>
        </View>
        <View className="flex-row items-center justify-start gap-3">
          <View className="rounded-full border-2 border-theme-yellow bg-theme-yellow/70 p-1">
            <IonIcons name="checkmark" size={24} color="black" />
          </View>
          <Text className="font-saira-medium text-xl text-text-on-brand">Full match history</Text>
        </View>
        <View className="flex-row items-center justify-start gap-3">
          <View className="rounded-full border-2 border-theme-yellow bg-theme-yellow/70 p-1">
            <IonIcons name="checkmark" size={24} color="black" />
          </View>
          <Text className="font-saira-medium text-xl text-text-on-brand">
            Access to exclusive badges
          </Text>
        </View>
        <View className="flex-row items-center justify-start gap-3">
          <View className="rounded-full border-2 border-theme-yellow bg-theme-yellow/70 p-1">
            <IonIcons name="checkmark" size={24} color="black" />
          </View>
          <Text className="font-saira-medium text-xl text-text-on-brand">No annoying ads</Text>
        </View>
      </View>
      <View className="w-full gap-5">
        <Pressable
          onPress={() => {
            setPaymentType('monthly');
          }}
          className={`mb-3 w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-white/5 px-5 py-5 ${paymentType === 'monthly' ? 'border-theme-yellow' : 'border-white/20'}`}>
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
            <Text className="font-saira text-xl text-text-on-brand">
              £1.99/month (cancel anytime)
            </Text>
          </View>
        </Pressable>
        <View className="relative w-full overflow-visible">
          {/* Pressable with border */}
          <Pressable
            onPress={() => setPaymentType('yearly')}
            className={`w-full flex-row items-center justify-start gap-4 rounded-2xl border bg-white/5 px-5 py-5 ${
              paymentType === 'yearly' ? 'border-theme-yellow' : 'border-white/20'
            }`}>
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
              <Text className="font-saira text-xl text-text-on-brand">£19.99 (1 off payment)</Text>
            </View>
          </Pressable>

          {/* Badge rendered AFTER pressable so it paints above */}
          <View className="absolute -top-4 right-10 z-10 rounded-full border border-theme-purple bg-brand-dark ">
            <View className="rounded-full bg-theme-purple/70">
              <Text
                style={{ lineHeight: 28 }}
                className="px-2 font-saira-medium text-xl text-white">
                16% Off
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="mt-10 w-full">
        <CTAButton type="success" text="Upgrade Now!" onPress={() => {}} />
      </View>
    </View>
  );
};

export default PremiumPaywall;

const styles = StyleSheet.create({});
