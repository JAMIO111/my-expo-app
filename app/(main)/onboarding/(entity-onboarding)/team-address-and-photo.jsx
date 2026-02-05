import {
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomTextInput from '@components/CustomTextInput';
import CTAButton from '@components/CTAButton';

const TeamAddressAndPhoto = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teamDetails = JSON.parse(params.teamDetails || '{}');

  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postCode, setPostCode] = useState('');

  console.log('Params in TeamAddressAndPhoto:', params);

  const address = [line1.trim(), line2.trim(), city.trim(), county.trim(), postCode.trim()]
    .filter(Boolean)
    .join(', ');

  const iosMapsUrl = `maps://?address=${address}`;

  const androidMapsUrl = `geo:0,0?q=${address}`;

  const openNativeMaps = () => {
    const url = Platform.OS === 'ios' ? iosMapsUrl : androidMapsUrl;

    Linking.openURL(url);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-address-and-photo',
      params: {
        league: JSON.stringify(league),
        teamDetails: JSON.stringify(updatedTeamDetails),
      },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 4 of 4',
        }}
      />
      <SafeViewWrapper
        useTopInset={false}
        useBottomInset={false}
        topColor="bg-brand"
        bottomColor="bg-brand-dark">
        <View className={`flex-1 justify-between gap-3 bg-brand`}>
          <StepPillGroup steps={4} currentStep={4} />
          <View className="flex-1">
            <Text
              style={{ lineHeight: 40 }}
              className={`p-3 font-delagothic text-4xl font-bold text-text-on-brand`}>
              Enter your team's home address.
            </Text>
            <Text className="p-3 font-saira-medium text-xl text-text-on-brand-2">
              This will help players find your team and venue.
            </Text>

            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={140}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  padding: 16,
                  paddingBottom: 20,
                  flexGrow: 1,
                  gap: 12,
                }}
                keyboardShouldPersistTaps="handled">
                <CustomTextInput
                  value={line1}
                  onChangeText={setLine1}
                  title="Address Line 1"
                  placeholder="e.g. 123 Main St"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="pin-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={line2}
                  onChangeText={setLine2}
                  title="Address Line 2"
                  placeholder="e.g. Apt 4B"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="home-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={city}
                  onChangeText={setCity}
                  title="City/Town"
                  placeholder="e.g. Blyth"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="business-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={county}
                  onChangeText={setCounty}
                  title="County"
                  placeholder="e.g. Northumberland"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="map-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="words"
                />
                <CustomTextInput
                  value={postCode}
                  onChangeText={setPostCode}
                  title="Post Code"
                  placeholder="e.g. NE24 3AB"
                  className="mb-4 h-12 rounded-lg border border-gray-300 bg-white px-3 font-saira text-xl"
                  leftIconName="mail-outline"
                  iconColor="#A259FF"
                  titleColor="text-text-1"
                  autoCapitalize="characters"
                />
              </ScrollView>
            </KeyboardAvoidingView>
            <View className="gap-5 rounded-t-3xl bg-brand-dark px-5 pt-6">
              <CTAButton callbackFn={openNativeMaps} type="white" text="Test Address" />
              <View>
                <CTAButton type="yellow" text="Save & Continue" callbackFn={handleContinue} />
                <Text className="px-3 text-lg text-text-2"></Text>
              </View>
            </View>
          </View>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default TeamAddressAndPhoto;

const styles = StyleSheet.create({});
