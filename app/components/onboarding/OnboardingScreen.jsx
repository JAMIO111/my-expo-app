import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import CTAButton from '@components/CTAButton';

const FOOTER_HEIGHT = 84;

// Shared layout for the profile steps: a headline on the brand colour, a rounded sheet for the content,
// and a button bar that rides on top of the keyboard, so "Continue" is always reachable without first
// dismissing the keyboard. The content scrolls up above both the keyboard and the button.
export default function OnboardingScreen({
  title,
  subtitle,
  children,
  ctaText = 'Continue',
  onCta,
  ctaDisabled = false,
  ctaLoading = false,
  footerExtra = null,
  refreshControl = undefined,
}) {
  const insets = useSafeAreaInsets();
  const hasFooter = !!onCta || !!footerExtra;
  const footerSpace = hasFooter ? FOOTER_HEIGHT + (footerExtra ? 56 : 0) : 0;

  return (
    <View className="flex-1 bg-brand">
      <Animated.View entering={FadeInDown.duration(380)} className="px-6 pb-6 pt-3">
        <Text
          style={{ lineHeight: 42 }}
          className="font-delagothic text-4xl text-text-on-brand">
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-3 font-saira text-lg leading-6 text-text-on-brand-2">{subtitle}</Text>
        ) : null}
      </Animated.View>

      <View className="flex-1 overflow-hidden rounded-t-[32px] bg-brand-dark">
        <KeyboardAwareScrollView
          refreshControl={refreshControl}
          bottomOffset={footerSpace + 24}
          contentContainerStyle={{ padding: 24, paddingBottom: footerSpace + insets.bottom + 24 }}>
          {children}
        </KeyboardAwareScrollView>

        {hasFooter && (
        <KeyboardStickyView
          offset={{ closed: 0, opened: insets.bottom }}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View
            className="gap-3 bg-brand-dark px-6 pt-3"
            style={{ paddingBottom: insets.bottom + 12 }}>
            {footerExtra}
            {onCta ? (
              <CTAButton
                type="yellow"
                text={ctaText}
                callbackFn={onCta}
                disabled={ctaDisabled}
                loading={ctaLoading}
                loadingText="Saving…"
              />
            ) : null}
          </View>
        </KeyboardStickyView>
        )}
      </View>
    </View>
  );
}
