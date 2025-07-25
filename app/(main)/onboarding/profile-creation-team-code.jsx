import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';

const ProfileCreation6 = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNewTeam = params.isNewTeam === 'true'; // Convert string to boolean

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
      } else {
        router.push({
          pathname: '/(main)/onboarding/profile-creation7',
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
          pathname: '/(main)/onboarding/profile-creation-team-confirm',
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
          title: 'Step 2 of 3',
        }}
      />

      <View className="flex-1 gap-3 bg-bg-grouped-1">
        <StepPillGroup steps={3} currentStep={2} />
        <View className="bg-bg-grouped-1 p-5">
          <Text
            style={{ lineHeight: 60 }}
            className="my-4 font-delagothic text-6xl font-bold text-text-1">
            Enter the 6 digit code
          </Text>
          <Text className="text-2xl text-text-2">
            {isNewTeam
              ? 'Enter the code for the league you want to join. Your league official should have provided you with this.'
              : 'Your team captain should have provided you with your unique code.'}
          </Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-bg-grouped-2 p-6">
          <View className="flex-row justify-between">
            {digits.map((digit, i) => (
              <View key={i} style={{ flex: 1, marginHorizontal: 4 }}>
                <TextInput
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChangeText={(text) => updateDigit(i, text)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="border-border-color text-text-1"
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
              text={isLoading ? 'Fetching Details...' : isNewTeam ? 'Find League' : 'Find Team'}
              callbackFn={isNewTeam ? handleCreateTeam : handleJoinTeam}
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation6;

const styles = StyleSheet.create({
  input: {
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 24,
  },
});
