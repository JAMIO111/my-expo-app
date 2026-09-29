import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useUpgradeSheet } from '@contexts/UpgradeSheetProvider';
import { useRevenueCat } from '@contexts/RevenueCatProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Gem } from 'lucide-react-native';

// mode:
//   'blur'  – content is blurred with an upgrade card on top (default)
//   'hide'  – content isn't rendered at all for users without access
//   'click' – content looks normal, but tapping it slides up an upgrade sheet
const ProGate = ({
  children,
  mode = 'blur',
  pro = false,
  core = true,
  title = 'Exclusive Feature',
  showCTA = true,
  intensity = 20,
  tint = 'light',
  paywallRoute = '/(main)/home/paywall',
  borderRadius = 24,
  justifyContent = 'center',
  description,
}) => {
  const router = useRouter();
  const { openUpgradeSheet } = useUpgradeSheet();
  const { isPro, isCore } = useRevenueCat();

  // ── entitlement rank system
  const userRank = isPro ? 2 : isCore ? 1 : 0;
  const requiredRank = pro ? 2 : core ? 1 : 0;

  const hasAccess = userRank >= requiredRank;
  const planName = pro ? 'Pro' : 'Core';

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
      borderRadius: 22,
      padding: 20,
      gap: 24,
    },
    title: {
      color: '#fff',
      fontSize: 20,
      fontWeight: '500',
      fontFamily: 'tektur',
      textAlign: 'center',
    },
    description: {
      color: '#ddd',
      fontSize: 16,
      fontFamily: 'tektur',
      fontWeight: '400',
      textAlign: 'left',
    },
  });

  useEffect(() => {
    if (!hasAccess && mode === 'blur') {
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
  }, [hasAccess, mode]);

  // ── unlocked content
  if (hasAccess) return <>{children}</>;

  if (mode === 'hide') return null;

  if (mode === 'click') {
    return (
      // width: 100% -- parents like MenuContainer centre their children, which would
      // otherwise shrink this wrapper (and the row inside it) to its content.
      <View style={[styles.wrapper, { width: '100%' }]}>
        {/* Content looks normal but can't be interacted with */}
        <View pointerEvents="none">{children}</View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} – upgrade to unlock`}
          style={StyleSheet.absoluteFill}
          onPress={() =>
            openUpgradeSheet({
              title,
              planName,
              description,
              onUpgrade: () => router.push(paywallRoute),
            })
          }
        />
      </View>
    );
  }

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

                <Text style={styles.description}>
                  {description ?? `Upgrade to the ${planName} plan now to unlock this feature.`}
                </Text>

                <CTAButton
                  type="yellow"
                  text="Upgrade Now"
                  lucideIcon={<Gem size={20} color="black" />}
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
