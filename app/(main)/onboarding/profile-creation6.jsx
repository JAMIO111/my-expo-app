import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';

const ProfileCreation6 = () => {
  const router = useRouter();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);

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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 2 of 2',
        }}
      />

      <View className="flex-1 gap-3 bg-background-dark">
        <StepPillGroup steps={2} currentStep={2} />
        <View className="bg-background-dark p-5">
          <Text className="text-text-1 my-4 font-delagothic text-6xl font-bold">
            Enter the 6 digit code
          </Text>
          <Text className="text-text-2 text-2xl">Your team captain will have this code.</Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-background p-6">
          <View className="flex-row justify-between">
            {digits.map((digit, i) => (
              <View key={i} style={{ flex: 1, marginHorizontal: 4 }}>
                <TextInput
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChangeText={(text) => updateDigit(i, text)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="text-text-1 border-border-color"
                  style={styles.input}
                  textAlign="center"
                  returnKeyType={i === digits.length - 1 ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (i < digits.length - 1) {
                      inputsRef.current[i + 1].focus();
                    }
                  }}
                />
              </View>
            ))}
          </View>

          <View className="mt-5">
            <CTAButton
              type="info"
              text="Join Team"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/profile-creation2',
                  params: { code: digits.join('') },
                })
              }
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
