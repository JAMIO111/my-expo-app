import { createContext, useCallback, useContext, useState } from 'react';
import { View, Text, Pressable, LayoutAnimation } from 'react-native';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import StepPillGroup from '@components/StepPillGroup';

// The onboarding header (back button, "Step X of Y" and the progress pills) lives once, outside the
// screen stack, so it stays put while only the page content slides. Each screen just reports which
// step it is with useOnboardingStep(step, total).

const OnboardingStepContext = createContext(null);

export function OnboardingStepProvider({ children }) {
  const [state, setState] = useState({ step: null, total: null, showBack: false });
  return (
    <OnboardingStepContext.Provider value={{ state, setState }}>
      {children}
    </OnboardingStepContext.Provider>
  );
}

// step/total = null hides the progress. showBack = false hides the back button (e.g. no way back).
export function useOnboardingStep(step, total, { showBack = true } = {}) {
  const ctx = useContext(OnboardingStepContext);
  const setState = ctx?.setState;

  useFocusEffect(
    useCallback(() => {
      if (!setState) return;
      try {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      } catch {
        // animation is cosmetic only
      }
      setState({ step, total, showBack });
    }, [setState, step, total, showBack])
  );
}

export function OnboardingHeader() {
  const ctx = useContext(OnboardingStepContext);
  const router = useRouter();
  const segments = useSegments();
  const { step, total, showBack } = ctx?.state || {};

  // only the two onboarding flows use this header; other pages under /onboarding have their own
  const inFlow = segments.some((s) => s === '(profile-onboarding)' || s === '(entity-onboarding)');
  if (!inFlow) return null;

  const canGoBack = showBack && router.canGoBack();

  return (
    <View className="bg-brand">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
          paddingHorizontal: 8,
        }}>
        <View style={{ minWidth: 80 }}>
          {canGoBack && (
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-back-outline" size={24} color="white" />
              <Text style={{ fontSize: 16, color: 'white' }}>Back</Text>
            </Pressable>
          )}
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }} pointerEvents="none">
          {step ? (
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
              Step {step} of {total}
            </Text>
          ) : null}
        </View>
        <View style={{ minWidth: 80 }} />
      </View>
      {step ? <StepPillGroup steps={total} currentStep={step} /> : null}
    </View>
  );
}
