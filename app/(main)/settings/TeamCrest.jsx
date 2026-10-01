import { StyleSheet, View, useColorScheme } from 'react-native';
import CrestEditor from '@components/CrestEditor';
import CustomHeader from '@components/CustomHeader';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { Stack, useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useState } from 'react';

const TeamCrest = () => {
  const { currentRole, refetch } = useUser();
  const colorScheme = useColorScheme();
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleSave = async ({ type, color1, color2, thickness }) => {
    setIsSaving(true);
    // Save the changes to the database
    try {
      const { error } = await supabase.rpc('update_team_crest', {
        p_team_id: currentRole?.team?.id,
        p_crest: { type, color1, color2, thickness },
      });
      if (error) throw error;

      if (error) throw error;

      await refetch();
      await queryClient.invalidateQueries(['TeamProfile', currentRole?.team?.id]);
      router.back();

      Toast.show({
        type: 'success',
        text1: 'Crest Updated',
        text2: 'Your team crest has been successfully updated.',
        props: {
          colorScheme: colorScheme,
        },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: `Failed to update crest: ${error.message}`,
        props: {
          colorScheme: colorScheme,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Crest Editor" />
            </SafeViewWrapper>
          ),
        }}
      />
      <View className="mt-16 flex-1 bg-bg-grouped-1">
        <CrestEditor crest={currentRole?.team?.crest} handleSave={handleSave} isSaving={isSaving} />
      </View>
    </SafeViewWrapper>
  );
};

export default TeamCrest;

const styles = StyleSheet.create({});
