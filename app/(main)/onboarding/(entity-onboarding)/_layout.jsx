import { Stack } from 'expo-router';

// The header and progress pills are drawn once by the onboarding layout, so only the page content slides.
export default function EntityOnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />;
}
