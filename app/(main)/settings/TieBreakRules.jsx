import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CircleCheckBig } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import TieBreakEditor, { DEFAULT_TIE_BREAKS } from '@components/TieBreakEditor';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';

const TieBreakRules = () => {
  const router = useRouter();
  const { currentRole, refetch } = useUser();
  const saved = currentRole?.district?.tie_break_rules ?? DEFAULT_TIE_BREAKS;
  const [rules, setRules] = useState(saved);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRules(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(saved)]);

  const hasChanges = JSON.stringify(rules) !== JSON.stringify(saved);

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('set_tie_break_rules', {
        p_district_id: currentRole?.district?.id,
        p_rules: rules,
      });
      if (error) throw error;
      await refetch();
      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: 'Tables will use the new tie-break order.',
      });
      router.back();
    } catch (error) {
      console.error('Error saving tie-break rules:', error);
      Toast.show({
        type: 'error',
        text1: 'Could not save',
        text2: error?.message || 'Please try again.',
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
                title="Tie-break Rules"
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon={CircleCheckBig}
              />
            </SafeViewWrapper>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <Text className="mb-5 w-full font-saira text-base text-text-2">
          When entrants are level on points, these rules are applied in order until the tie is
          broken. They are used for every league table and to decide the champion and promotion and
          relegation places.
        </Text>
        <TieBreakEditor rules={rules} onChange={setRules} />
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default TieBreakRules;
