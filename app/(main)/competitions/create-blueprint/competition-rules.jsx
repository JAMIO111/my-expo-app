import { StyleSheet, View, Text, Pressable, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import CTAButton from '@components/CTAButton';
import { useState } from 'react';
import CustomTextInput from '@components/CustomTextInput';
import Ionicons from '@expo/vector-icons/Ionicons';
import Toast from 'react-native-toast-message';

const CompetitionRules = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [compName, setCompName] = useState('');
  const [competitorType, setCompetitorType] = useState(null); // 'team' or 'individual'
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [gender, setGender] = useState('');

  const handleContinue = () => {
    router.replace({
      pathname: '/competitions',
      params: { ...params, competitorType, compName, minAge, maxAge, gender },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader showBack={true} title="Configure Rules" />
            </SafeViewWrapper>
          ),
        }}
      />
      <SafeViewWrapper useBottomInset={false} topColor="bg-brand">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          contentContainerStyle={{
            display: 'flex',
            flexGrow: 1,
            gap: 20,
            paddingTop: 20,
            paddingBottom: 60,
          }}
          className="mt-16 flex-1 bg-brand px-4">
          <CTAButton text="Continue" type="yellow" callbackFn={handleContinue} />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default CompetitionRules;
