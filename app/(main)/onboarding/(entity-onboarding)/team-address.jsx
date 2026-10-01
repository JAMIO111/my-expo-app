import {
  Pressable,
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
import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomTextInput from '@components/CustomTextInput';
import CTAButton from '@components/CTAButton';
import Toast from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';
import OnboardingScreen from '@components/onboarding/OnboardingScreen';
import OnboardingInput from '@components/onboarding/OnboardingInput';
import ChoiceCard from '@components/onboarding/ChoiceCard';
import ToggleCard from '@components/onboarding/ToggleCard';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TeamAddress = () => {
  useOnboardingStep(4, 6);
  const router = useRouter();
  const params = useLocalSearchParams();
  const league = JSON.parse(params.league || '{}');
  const teamDetails = JSON.parse(params.teamDetails || '{}');
  const teams = JSON.parse(params.teams || '[]');

  const [name, setName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [postCode, setPostCode] = useState('');
  const [tables, setTables] = useState('');

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
    if (!line1.trim() || !city.trim() || !postCode.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing required fields',
        text2: 'Please fill in at least Address Line 1, Town, and Post Code.',
      });
      return;
    }

    if (isNaN(tables) || tables.trim() === '' || !Number.isInteger(Number(tables.trim())) || Number(tables.trim()) < 1) {
      Toast.show({
        type: 'error',
        text1: 'Invalid number of tables',
        text2: 'Venue must have at least 1 available table.',
      });
      return;
    }

    const updatedTeamDetails = {
      ...teamDetails,
      address: {
        venue_name: name.trim(),
        line_1: line1.trim(),
        line_2: line2.trim(),
        city: city.trim(),
        county: county.trim(),
        postcode: postCode.trim(),
        tables: Number(tables.trim()),
      },
    };

    router.push({
      pathname: '/(main)/onboarding/(entity-onboarding)/team-photo',
      params: {
        league: JSON.stringify(league),
        teamDetails: JSON.stringify(updatedTeamDetails),
        teams: JSON.stringify(teams),
      },
    });
  };

  const refs = useRef({});
  const next = (key) => () => refs.current[key]?.focus();
  const reg = (key) => (el) => {
    refs.current[key] = el;
  };

  return (
    <OnboardingScreen
      title="Where does your team play?"
      subtitle="Players use this to find your home venue."
      onCta={handleContinue}
      ctaText="Save & continue"
      footerExtra={
        <Pressable
          onPress={openNativeMaps}
          disabled={!address}
          className={`flex-row items-center justify-center gap-2 rounded-2xl border-2 border-white/20 bg-white/10 py-3 ${address ? '' : 'opacity-40'}`}>
          <Ionicons name="map-outline" size={20} color="white" />
          <Text className="font-saira-semibold text-lg text-text-on-brand">Check on the map</Text>
        </Pressable>
      }>
      <View className="gap-5">
        <OnboardingInput ref={reg('name')} label="Venue name" icon="home-outline" placeholder="e.g. The Crown Inn"
          value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('line1')} />
        <OnboardingInput ref={reg('line1')} delay={50} label="Address line 1" icon="pin-outline" placeholder="e.g. 123 Main St"
          value={line1} onChangeText={setLine1} autoCapitalize="words" textContentType="streetAddressLine1" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('line2')} />
        <OnboardingInput ref={reg('line2')} delay={100} label="Address line 2 (optional)" icon="pin-outline" placeholder="e.g. Unit 4"
          value={line2} onChangeText={setLine2} autoCapitalize="words" textContentType="streetAddressLine2" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('city')} />
        <OnboardingInput ref={reg('city')} delay={150} label="Town / city" icon="business-outline" placeholder="e.g. Blyth"
          value={city} onChangeText={setCity} autoCapitalize="words" textContentType="addressCity" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('county')} />
        <OnboardingInput ref={reg('county')} delay={200} label="County (optional)" icon="map-outline" placeholder="e.g. Northumberland"
          value={county} onChangeText={setCounty} autoCapitalize="words" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('post')} />
        <OnboardingInput ref={reg('post')} delay={250} label="Postcode" icon="mail-outline" placeholder="e.g. NE24 3AB"
          value={postCode} onChangeText={(t) => setPostCode(t.toUpperCase())} autoCapitalize="characters" textContentType="postalCode" maxLength={8}
          returnKeyType="next" blurOnSubmit={false} onSubmitEditing={next('tables')} />
        <OnboardingInput ref={reg('tables')} delay={300} label="Available tables" icon="apps" placeholder="e.g. 2"
          value={tables} onChangeText={(t) => setTables(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2}
          returnKeyType="done" onSubmitEditing={handleContinue} />
      </View>
    </OnboardingScreen>
  );
};

export default TeamAddress;
