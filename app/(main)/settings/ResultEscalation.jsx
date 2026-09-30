import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Check, CircleCheckBig } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useUser } from '@contexts/UserProvider';
import { useTheme } from '@contexts/ThemeProvider';
import { supabase } from '@/lib/supabase';
import { handleFixtureError } from '@lib/fixtureActionErrors';

const DAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30];
const DEFAULT_DAYS = 3;

const ResultEscalation = () => {
  const router = useRouter();
  const { currentRole, refetch } = useUser();
  const { colors: themeColors } = useTheme();
  const savedDays = currentRole?.district?.result_escalation_days ?? DEFAULT_DAYS;
  const [days, setDays] = useState(savedDays);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDays(savedDays);
  }, [savedDays]);

  const hasChanges = days !== savedDays;

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_result_escalation_days', {
        p_district_id: currentRole?.district?.id,
        p_days: days,
      });
      if (error) throw error;
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: `Unanswered results will now be escalated after ${days} ${days === 1 ? 'day' : 'days'}.`,
      });
      router.back();
    } catch (error) {
      console.error('Error saving escalation days:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Could not save',
        fallbackMessage: 'Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title="Result Escalation"
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon={CircleCheckBig}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ alignItems: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <Text className="mb-5 w-full font-saira text-base text-text-2">
          When a result is waiting on someone and nothing happens for this long, it is escalated to
          the league admins to decide. This covers a result nobody submitted, a submitted result
          that is neither approved nor disputed, a dispute or amendment nobody answers, and a
          forfeit nobody approves.
        </Text>
        <MenuContainer title="Escalate after">
          {DAY_OPTIONS.map((option, index) => (
            <Pressable
              key={option}
              onPress={() => setDays(option)}
              className="w-full"
              accessibilityRole="radio"
              accessibilityState={{ selected: days === option }}>
              {({ pressed }) => (
                <View
                  className={`w-full flex-row items-center justify-between px-4 py-3 ${
                    pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
                  } ${index < DAY_OPTIONS.length - 1 ? 'border-b border-separator' : ''}`}>
                  <Text className="font-saira-medium text-lg text-text-1">
                    {`${option} ${option === 1 ? 'day' : 'days'}${option === DEFAULT_DAYS ? ' (default)' : ''}`}
                  </Text>
                  {days === option ? <Check size={22} color={themeColors.icon} /> : null}
                </View>
              )}
            </Pressable>
          ))}
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default ResultEscalation;
