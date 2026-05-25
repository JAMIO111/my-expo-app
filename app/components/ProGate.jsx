import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useRevenueCat } from '@contexts/RevenueCatProvider';
import Ionicons from '@expo/vector-icons/Ionicons';

const ProGate = ({
  children,
  pro = false,
  core = true,
  title = 'Exclusive Feature',
  description = 'Upgrade now to unlock this feature',
  showCTA = true,
  intensity = 20,
  tint = 'light',
  paywallRoute = '/(main)/home/paywall',
  borderRadius = 24,
  justifyContent = 'center',
}) => {
  const router = useRouter();
  const { isPro, isCore } = useRevenueCat();

  // ── entitlement rank system
  const userRank = isPro ? 2 : isCore ? 1 : 0;
  const requiredRank = pro ? 2 : core ? 1 : 0;

  const hasAccess = userRank >= requiredRank;

  // ── CTA animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  const styles = StyleSheet.create({
    wrapper: {
      position: 'relative',
    },
    center: {
      flex: 1,
      paddingHorizontal: 20,
      paddingVertical: 20,
      justifyContent: justifyContent,
    },
    card: {
      width: '100%',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 26,
      padding: 20,
      gap: 16,
    },
    title: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '600',
      textAlign: 'center',
    },
    description: {
      color: '#ccc',
      fontSize: 16,
      textAlign: 'left',
    },
  });

  useEffect(() => {
    if (!hasAccess) {
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [hasAccess]);

  // ── unlocked content
  if (hasAccess) return <>{children}</>;

  return (
    <View style={styles.wrapper}>
      {/* Base content stays visible for layout */}
      <View>{children}</View>

      {/* Blur overlay */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, { borderRadius: borderRadius, overflow: 'hidden' }]}>
        {showCTA && (
          <View style={styles.center}>
            <Animated.View
              style={{
                opacity,
                transform: [{ translateY }],
              }}>
              <View style={styles.card}>
                <View className="flex-row items-center gap-3 py-1">
                  <Ionicons name="star" size={24} color="#FFD700" />

                  <Text style={styles.title}>{title}</Text>
                </View>

                <Text style={styles.description}>{description}</Text>

                <CTAButton
                  type="yellow"
                  text="Upgrade Now"
                  callbackFn={() => router.push(paywallRoute)}
                />
              </View>
            </Animated.View>
          </View>
        )}
      </BlurView>
    </View>
  );
};

export default ProGate;
