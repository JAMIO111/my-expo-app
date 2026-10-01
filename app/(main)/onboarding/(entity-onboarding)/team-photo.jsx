import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import ImageUploader from '@components/ImageUploader';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamPhoto = () => {
  useOnboardingStep(5, 6);
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teamDetails = JSON.parse(params.teamDetails || '{}');
  const teams = JSON.parse(params.teams || '[]');
  const [teamPhotoUri, setTeamPhotoUri] = useState(null);

  console.log('Params in TeamPhoto:', params);

  const handleContinue = () => {
    const updatedTeamDetails = {
      ...teamDetails,
      photoUri: teamPhotoUri,
    };

    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-division-request',
      params: {
        league: JSON.stringify(league),
        teamDetails: JSON.stringify(updatedTeamDetails),
        teams: JSON.stringify(teams),
      },
    });
  };

  const skip = () =>
    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-division-request',
      params: {
        league: JSON.stringify(league),
        teamDetails: JSON.stringify(teamDetails),
        teams: JSON.stringify(teams),
      },
    });

  return (
    <OnboardingScreen
      title="Add a team photo"
      subtitle="Your team, your venue, anything that says who you are. Players see it when browsing teams."
      onCta={handleContinue}
      ctaText={teamPhotoUri ? 'Save & continue' : 'Continue without a photo'}
      footerExtra={
        teamPhotoUri ? (
          <Pressable onPress={skip} className="items-center py-1">
            <Text className="font-saira-medium text-base text-text-on-brand-2 underline">
              Skip the photo
            </Text>
          </Pressable>
        ) : null
      }>
      <Animated.View entering={FadeInDown.duration(380)} className="gap-3">
        <View className="aspect-video overflow-hidden rounded-3xl border-2 border-white/20 bg-white/10">
          <ImageUploader borderRadius={0} aspectRatio={[16, 9]} onImageChange={(uri) => setTeamPhotoUri(uri)} />
        </View>
        <Text className="px-1 font-saira text-sm text-text-on-brand-2">
          A wide (16:9) image works best. You can change it later.
        </Text>
      </Animated.View>
    </OnboardingScreen>
  );
};

export default TeamPhoto;
