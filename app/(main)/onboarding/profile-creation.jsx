import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';

const ProfileCreation = () => {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const router = useRouter();
  const inputRef2 = useRef(null);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 1 of 4',
        }}
      />

      <View className="flex-1 gap-3 bg-background-dark">
        <StepPillGroup steps={4} currentStep={1} />
        <View className="bg-background-dark p-5">
          <Text className="text-text-1 mb-4 font-delagothic text-6xl font-bold">
            What's your name?
          </Text>
          <Text className="text-text-2 text-2xl">So we can address you properly.</Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-background p-6">
          <View className="gap-1">
            <Text className="text-text-1 px-2 text-2xl font-bold">First Name</Text>
            <TextInput
              className="text-text-1 h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl placeholder:text-text-muted"
              placeholder="Enter First Name..."
              autoCapitalize="words"
              value={firstName}
              autoComplete="given-name"
              onChangeText={setFirstName}
              returnKeyType="next"
              onSubmitEditing={() => inputRef2.current?.focus()}
            />
          </View>
          <View className="gap-1">
            <Text className="text-text-1 px-2 text-2xl font-bold">Surname</Text>
            <TextInput
              className="text-text-1 h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl placeholder:text-text-muted"
              placeholder="Enter Surname..."
              autoCapitalize="words"
              value={surname}
              autoComplete="family-name"
              onChangeText={setSurname}
              returnKeyType="done"
              ref={inputRef2}
              onSubmitEditing={() => inputRef2.current?.blur()}
            />
          </View>
          <View className="mt-5">
            <CTAButton
              type="info"
              text="Continue"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/profile-creation2',
                  params: { firstName, surname },
                })
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default ProfileCreation;

const styles = StyleSheet.create({});
