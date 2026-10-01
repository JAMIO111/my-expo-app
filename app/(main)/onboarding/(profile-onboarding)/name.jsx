import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Stack } from 'expo-router';
import CTAButton from '@components/CTAButton';
import CustomTextInput from '@components/CustomTextInput';
import { useUser } from '@contexts/UserProvider';
import Toast from 'react-native-toast-message';
import { useOnboardingStep } from '@contexts/OnboardingStepContext';

const Name = () => {
  useOnboardingStep(1, 5);
  const { user } = useUser();

  console.log('User in Name component:', user); // Debugging line

  const isGoogleUser = user?.app_metadata?.provider === 'google';

  const fullName = user?.user_metadata?.full_name || '';
  const nameParts = fullName.trim().split(' ');

  const [firstName, setFirstName] = useState(
    isGoogleUser ? (nameParts.length ? nameParts[0] : '') : ''
  );

  const [surname, setSurname] = useState(
    isGoogleUser ? nameParts.slice(1).join(' ') : ''
  );
  const router = useRouter();
  const inputRef2 = useRef(null);

  return (
    <>
<View className="flex-1 gap-3 bg-brand">
        <View className="p-5">
          <Text className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">
            What's your name?
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            So we know what to call you.
          </Text>
        </View>

        <View className="flex-1 rounded-t-3xl bg-brand-dark p-6">
          <KeyboardAwareScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 20 }}>
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
                callbackFn={() => {
                  if (firstName.trim() === '' || surname.trim() === '') {
                    Toast.show({
                      type: 'info',
                      text1: 'Name Required',
                      text2: 'Please enter both your first name and surname.',
                    });
                    return;
                  }
                  router.push({
                    pathname: '/(main)/onboarding/(profile-onboarding)/nickname',
                    params: { firstName: firstName.trim(), surname: surname.trim() },
                  });
                }}
              />
            </View>
          </KeyboardAwareScrollView>
        </View>
      </View>
    </>
  );
};

export default Name;

const styles = StyleSheet.create({});
