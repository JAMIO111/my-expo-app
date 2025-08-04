import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';

const Name = () => {
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

      <View className="flex-1 gap-3 bg-bg-grouped-1">
        <StepPillGroup steps={4} currentStep={1} />
        <View className="bg-bg-grouped-1 p-5">
          <Text className="mb-4 font-delagothic text-6xl font-bold text-text-1">
            What's your name?
          </Text>
          <Text className="text-2xl text-text-2">So we can address you properly.</Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-bg-grouped-2 p-6">
          <View className="gap-1">
            <Text className="px-2 text-2xl font-bold text-text-1">First Name</Text>
            <TextInput
              className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-muted"
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
            <Text className="px-2 text-2xl font-bold text-text-1">Surname</Text>
            <TextInput
              className="h-16 rounded-xl border border-border-color bg-input-background px-4 pb-1 text-xl text-text-1 placeholder:text-text-muted"
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
                  pathname: '/(main)/onboarding/nickname',
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

export default Name;

const styles = StyleSheet.create({});
