import { Pressable, StyleSheet, Text, View, useColorScheme, Platform } from 'react-native';
import { useState, useRef } from 'react';
import ModalWrappedDatePicker from '@components/ModalWrappedDatePicker';
import CTAButton from '@components/CTAButton';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import StepPillGroup from '@components/StepPillGroup';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BottomSheetWrapper from '@components/BottomSheetWrapper';
import { BottomSheetFooter, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
import colors from '@lib/colors';
import DateTimePicker from '@react-native-community/datetimepicker';

const Dob = () => {
  const [dob, setDob] = useState(null);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const bottomSheetRef = useRef(null);
  const params = useLocalSearchParams();
  console.log('dob', dob);

  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    console.log('Closing sheet...'); // Add this
    bottomSheetRef.current?.close();
  };

  const handleSave = () => {
    closeSheet();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Step 3 of 4',
        }}
      />
      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={4} currentStep={3} />
        <View className="p-4">
          <Text className="mb-4 font-delagothic text-5xl font-bold text-text-on-brand">{`When were you born ${params.firstName}?`}</Text>
          <Text className=" font-saira text-2xl text-text-on-brand-2">
            So that we'll never forget your birthday.
          </Text>
        </View>
        <View className="w-full flex-1 rounded-t-3xl bg-brand-dark p-6">
          <View>
            <Text className={`pb-1 pl-2 font-saira-medium text-lg text-text-on-brand`}>
              Date of Birth
            </Text>
            <Pressable
              onPress={openSheet}
              className="h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3">
              <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
                <Ionicons name="calendar" size={24} color="green" />
              </View>
              <View>
                <Text
                  className={`pl-5 font-saira-medium text-lg ${dob ? 'text-text-1' : 'text-text-3'}`}>
                  {dob ? dob.toLocaleDateString() : 'Select your date of birth'}
                </Text>
              </View>
            </Pressable>
          </View>
          <View className="mt-8">
            <CTAButton
              type="yellow"
              textColor="black"
              text="Continue"
              callbackFn={() =>
                router.push({
                  pathname: '/(main)/onboarding/avatar',
                  params: { ...params, dob },
                })
              }
            />
          </View>
        </View>
        <BottomSheetWrapper
          ref={bottomSheetRef}
          initialIndex={-1}
          snapPoints={['10%']}
          footerComponent={(props) => (
            <BottomSheetFooter {...props}>
              <View
                style={{ paddingBottom: 80 }}
                className="w-full rounded-t-3xl bg-bg-grouped-3 p-6">
                <CTAButton text="Save" type="brand" callbackFn={handleSave} />
              </View>
            </BottomSheetFooter>
          )}>
          {/* Fixed Header */}
          <BottomSheetView
            style={{
              paddingHorizontal: 32,
              paddingTop: 8,
              paddingBottom: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#ccc',
              backgroundColor: themeColors.bgGrouped2,
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ lineHeight: 40 }} className="font-saira-medium text-3xl text-text-1">
              Select Date of Birth
            </Text>
            <Pressable className="p-2" onPress={closeSheet}>
              <Ionicons name="close" size={24} color={themeColors.primaryText} />
            </Pressable>
          </BottomSheetView>

          {/* Scrollable content with top padding to avoid overlap */}
          <BottomSheetView style={{ paddingBottom: 240, paddingTop: 80, paddingHorizontal: 32 }}>
            {/* Your selectable items */}
            <DateTimePicker
              value={dob ? new Date(dob) : new Date(2000, 0, 1)}
              minimumDate={new Date(1900, 0, 1)}
              maximumDate={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                if (event.type === 'set' && date) {
                  setDob(date);
                }
              }}
              style={{ width: '100%' }}
            />
          </BottomSheetView>
        </BottomSheetWrapper>
      </View>
    </>
  );
};

export default Dob;

const styles = StyleSheet.create({});
