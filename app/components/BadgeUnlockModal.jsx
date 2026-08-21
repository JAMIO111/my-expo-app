import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import CTAButton from './CTAButton';
import { badgeIcons } from '@lib/badgeIcons';
import SpinningSun from './SpinningSun';

const bgColors = {
  1: { color: '#773F00', text: '#fff' },
  2: { color: '#A7A7A7', text: '#000' },
  3: { color: '#FFE225', text: '#000' },
  4: { color: '#24FFDF', text: '#000' },
  5: { color: '#FF0000', text: '#fff' },
  6: { color: '#00B518', text: '#fff' },
  7: { color: '#4C00E5', text: '#fff' },
};

/**
 * BadgeUnlockModal
 *
 * Pops up when the user unlocks one or more badges. If multiple badges are
 * unlocked at the same time, pass them all in `badges` — they stack, and
 * the user dismisses them one at a time via the button at the bottom.
 *
 * Usage:
 * <BadgeUnlockModal
 *   visible={badgeQueue.length > 0}
 *   badges={badgeQueue}
 *   onComplete={() => setBadgeQueue([])}
 * />
 *
 * Props:
 * - visible: boolean — whether the modal is shown
 * - badges: Array<{
 *     id: string,
 *     title: string,
 *     description?: string,
 *     icon: ImageSourcePropType, // require(...) or { uri: '...' }
 *     tier?: 'bronze' | 'silver' | 'gold' | 'platinum',
 *   }>
 * - onComplete: () => void — called once the last badge has been dismissed
 */
export default function BadgeUnlockModal({ visible, badges = [], onComplete }) {
  const [index, setIndex] = useState(0);

  // Reset the stack index whenever a fresh batch of badges comes in.
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible, badges]);

  const currentBadge = badges[index];
  const remaining = badges.length - index - 1;
  const isLast = remaining <= 0;

  const iconKey = currentBadge?.icon.uri;
  const iconSource = iconKey && badgeIcons[iconKey] ? badgeIcons[iconKey] : null;
  const color = (bgColors[currentBadge?.tier] && bgColors[currentBadge?.tier].color) || '#773F00';
  const textColor = (bgColors[currentBadge?.tier] && bgColors[currentBadge?.tier].text) || '#fff';

  // ---- Badge pulse animation ----
  const badgePulse = useSharedValue(1);

  useEffect(() => {
    if (!visible || !currentBadge) return;

    badgePulse.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 550,
        }),
        withTiming(1, {
          duration: 550,
        }),
        withTiming(1.03, {
          duration: 350,
        }),
        withTiming(1, {
          duration: 350,
        }),
        withTiming(1, {
          duration: 1800,
        })
      ),
      -1,
      false
    );
  }, [visible, currentBadge]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: badgePulse.value,
      },
    ],
  }));

  const handleDismiss = () => {
    badgePulse.value = 1;

    if (isLast) {
      onComplete?.();
    } else {
      setIndex(index + 1);
    }
  };

  if (!currentBadge) return null;

  console.log('Rendering BadgeUnlockModal with currentBadge:', currentBadge);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View className="shadow-sm" style={[styles.card]}>
          <View
            className="items-center overflow-hidden rounded-3xl bg-white"
            style={styles.cardInner}>
            {/* Full-bleed hero: the spinning sun + badge icon sit behind everything else */}
            <View style={styles.victoryContainer}>
              <SpinningSun size={600} color={color} rayOpacity={0.32} speed={7000} />

              <View
                style={{
                  backgroundColor: `${color}88`,
                  padding: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: color,
                  marginBottom: 24,
                }}>
                <Text
                  className="text-center font-saira-semibold text-xl"
                  style={{ color: textColor }}>
                  {currentBadge.xp ? `+${currentBadge.xp} XP` : ''}
                </Text>
              </View>

              <Animated.Image source={iconSource} style={[styles.iconImage, badgeAnimatedStyle]} />
            </View>

            {/* Top fade: solid white at the very top, dissolving to transparent as it
                moves down over the sun — this is what makes the heading sit in a
                readable panel without a hard-edged box cutting across the graphic. */}
            <LinearGradient
              colors={['#ffffff', '#ffffffdd', 'rgba(255,255,255,0)']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.topFade}>
              <Text className="text-center font-michroma text-3xl text-text-1">
                Congratulations!
              </Text>
              <Text className="text-center font-saira-medium text-lg text-text-2">
                You've unlocked a new badge
              </Text>
            </LinearGradient>

            {/* Bottom fade: mirror of the top — transparent where it overlaps the sun,
                solid white by the time it reaches the title/description/button so
                that content stays fully readable. */}
            <LinearGradient
              colors={['rgba(255,255,255,0)', '#ffffffdd', '#ffffff']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bottomFade}>
              <Text className="text-center font-saira-bold text-2xl" style={{ color: color }}>
                {currentBadge.title}
              </Text>
              {!!currentBadge.description && (
                <Text className="text-center font-saira-medium text-lg text-text-1">
                  {currentBadge.description}
                </Text>
              )}
              <View className="mt-4 w-full">
                <CTAButton
                  callbackFn={handleDismiss}
                  type="yellow"
                  text={isLast ? 'Awesome!' : `Next Badge (${remaining} more)`}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
  },
  cardInner: {
    position: 'relative',
    width: '100%',
  },
  cardGradient: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  counterPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  // Sits above both fade gradients so the counter pill is never obscured.
  aboveFade: {
    zIndex: 10,
  },
  counterText: {
    color: '#D4AF37',
    fontFamily: 'Saira-SemiBold',
    fontSize: 12,
  },
  congrats: {
    fontFamily: 'Saira-Bold',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Saira-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
  iconWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#111a11',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    height: 180,
    resizeMode: 'contain',
  },
  badgeTitle: {
    fontFamily: 'Saira-Bold',
    fontSize: 20,
    color: '#D4AF37',
    textAlign: 'center',
  },
  badgeDescription: {
    fontFamily: 'Saira-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonWrap: {
    width: '100%',
    marginTop: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Saira-Bold',
    fontSize: 16,
    color: '#111a11',
  },
  victoryContainer: {
    width: '100%',
    height: 600,
    paddingBottom: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pinned to the top of cardInner, overlapping the top portion of victoryContainer.
  // Only top/left/right are set (no explicit height) so it sizes to its text content.
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 24,
    paddingBottom: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  // Pinned to the bottom of cardInner, overlapping the bottom portion of
  // victoryContainer. Holds the title, description, and CTA button.
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  trophy: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
});
