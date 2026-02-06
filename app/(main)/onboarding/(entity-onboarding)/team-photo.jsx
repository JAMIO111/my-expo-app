import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CTAButton from '@components/CTAButton';
import ImageUploader from '@components/ImageUploader';

const TeamPhoto = () => {
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 5 of 6',
        }}
      />
      <SafeViewWrapper useTopInset={false} topColor="bg-brand" bottomColor="bg-brand-dark">
        <View className={`flex-1 justify-between gap-3 bg-brand`}>
          <StepPillGroup steps={6} currentStep={5} />
          <View className="flex-1">
            <Text
              style={{ lineHeight: 40 }}
              className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
              Set a profile photo for your team.
            </Text>
            <Text className="p-3 font-saira-medium text-xl text-text-on-brand-2">
              This could be a photo of your team, your home venue, or anything else that represents
              your team. Players will see this when browsing teams in the app.
            </Text>
            <View className="my-6 flex-1">
              <View className="mx-3 aspect-video overflow-hidden rounded-2xl border-2 border-theme-gray-2">
                <ImageUploader
                  borderRadius={0}
                  aspectRatio={[16, 9]}
                  onImageChange={(uri) => setTeamPhotoUri(uri)}
                />
              </View>
              <Text className="p-3 px-5 font-saira-medium text-lg text-text-on-brand-2">
                We recommend using an image with a 16:9 aspect ratio for best results.
              </Text>
            </View>

            <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
              <CTAButton type="yellow" text="Save & Continue" callbackFn={handleContinue} />
              <Pressable
                className="items-center justify-center rounded-xl py-3"
                onPress={() =>
                  router.push({
                    pathname: '/(main)/onboarding/(entity-onboarding)/team-division-request',
                    params: {
                      league: JSON.stringify(league),
                      teamDetails: JSON.stringify(teamDetails),
                      teams: JSON.stringify(teams),
                    },
                  })
                }>
                <Text className="text-center font-saira-medium text-xl text-text-on-brand-2 underline">
                  Add a photo later
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamPhoto;

const styles = StyleSheet.create({});
