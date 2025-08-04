import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import { useSupabaseClient } from '@contexts/SupabaseClientContext';
import Toast from 'react-native-toast-message';

const UniqueCode = () => {
  const { client: supabase } = useSupabaseClient();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNewTeam = params.isNewTeam === 'true'; // Convert string to boolean
  const isNewLeague = params.isNewLeague === 'true'; // Convert string to boolean

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // Create refs for each input
  const inputsRef = useRef([]);

  const updateDigit = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newDigits = [...digits];
      newDigits[index] = value;
      setDigits(newDigits);

      if (value && index < inputsRef.current.length - 1) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleCreateLeague = async () => {
    setIsLoading(true);
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      setIsLoading(false);
      inputsRef.current[0].focus();
      return;
    }
    const { data: LeagueData, error } = await supabase
      .from('Districts')
      .select('*')
      .eq('code', code)
      .single();
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'League could not be found',
        text2: 'Please check the code and try again.',
      });
    } else if (LeagueData) {
      router.push({
        pathname: '/(main)/onboarding/create-divisions',
        params: { league: JSON.stringify(LeagueData) },
      });
    }
    setIsLoading(false);
  };

  const handleCreateTeam = async () => {
    setIsLoading(true);
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      setIsLoading(false);
      inputsRef.current[0].focus();
      return;
    } else {
      const { data: LeagueData, error } = await supabase
        .from('Districts')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'League could not be found',
          text2: 'Please check the code and try again.',
        });
      } else if (LeagueData) {
        router.push({
          pathname: '/(main)/onboarding/create-divisions',
          params: { league: JSON.stringify(LeagueData) },
        });
      }
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    setIsLoading(true);
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      setIsLoading(false);
      inputsRef.current[0].focus();
      return;
    } else {
      const { data: TeamData, error } = await supabase
        .from('Teams')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Team could not be found',
          text2: 'Please check the code and try again.',
        });
      } else if (TeamData) {
        router.push({
          pathname: '/(main)/onboarding/team-confirm',
          params: { team: JSON.stringify(TeamData) },
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 2',
        }}
      />

      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={2} currentStep={2} />
        <View className="p-5">
          <Text
            style={{ lineHeight: 50 }}
            className="my-4 font-delagothic text-5xl font-bold text-text-on-brand">
            {isNewLeague
              ? 'Enter Access Code'
              : isNewTeam
                ? 'Enter League Code'
                : 'Enter Team Code'}
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            {isNewLeague
              ? 'The app administrator should have provided you with your unique 6 digit code.'
              : isNewTeam
                ? 'Your league official should have provided you with your unique 6 digit code.'
                : 'Your team captain should have provided you with your unique 6 digit code.'}
          </Text>
        </View>

        <View
          style={{ borderTopRightRadius: 32, borderTopLeftRadius: 32 }}
          className="flex-1 gap-5 bg-brand-dark p-6 shadow shadow-brand-light">
          <View className="flex-row justify-between">
            {digits.map((digit, i) => (
              <View key={i} style={{ flex: 1, marginHorizontal: 4 }}>
                <TextInput
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChangeText={(text) => updateDigit(i, text)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="border-border-color bg-white font-saira-semibold text-4xl text-text-1 focus:border-theme-blue"
                  style={styles.input}
                  textAlign="center"
                  returnKeyType={i === digits.length - 1 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (i < digits.length - 1) {
                      inputsRef.current[i + 1].focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && i > 0) {
                      inputsRef.current[i - 1].focus();
                    }
                  }}
                />
              </View>
            ))}
          </View>

          <View className="mt-5">
            <CTAButton
              type="info"
              disabled={isLoading}
              text={
                isLoading
                  ? 'Fetching Details...'
                  : isNewLeague
                    ? 'Get Started'
                    : isNewTeam
                      ? 'Find League'
                      : 'Find Team'
              }
              callbackFn={
                isNewLeague ? handleCreateLeague : isNewTeam ? handleCreateTeam : handleJoinTeam
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default UniqueCode;

const styles = StyleSheet.create({
  input: {
    lineHeight: 48,
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
});
