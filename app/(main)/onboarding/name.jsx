import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import CustomTextInput from '@components/CustomTextInput';

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

      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={4} currentStep={1} />
        <View className="p-5">
          <Text className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
            What's your name?
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            So we know what to call you.
          </Text>
        </View>

        <View className="flex-1 gap-5 rounded-t-3xl bg-brand-dark p-6">
          <View className="gap-1">
            <CustomTextInput
              placeholder="e.g. John"
              title="First Name"
              titleColor="text-text-on-brand"
              leftIconName="person"
              iconColor="green"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => inputRef2.current?.focus()}
            />
          </View>
          <View className="gap-1">
            <CustomTextInput
              placeholder="e.g. Doe"
              title="Surname"
              titleColor="text-text-on-brand"
              leftIconName="person"
              iconColor="green"
              autoCapitalize="words"
              value={surname}
              onChangeText={setSurname}
              autoComplete="family-name"
              returnKeyType="done"
              ref={inputRef2}
              onSubmitEditing={() => inputRef2.current?.blur()}
            />
          </View>
          <View className="mt-8">
            <CTAButton
              type="yellow"
              textColor="black"
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
