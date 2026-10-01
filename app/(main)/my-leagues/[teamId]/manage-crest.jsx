import { StyleSheet, View } from 'react-native';
import { supabase } from '@lib/supabase';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import CustomHeader from '@components/CustomHeader';
import { useLocalSearchParams } from 'expo-router';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { useTeamProfile } from '@hooks/useTeamProfile';
import CrestEditor from '@components/CrestEditor';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const ManageCrestPage = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const { teamId } = useLocalSearchParams();
  const { data: teamProfile, isLoading } = useTeamProfile(teamId);

  const handleSave = async ({ type, color1, color2, thickness }) => {
    setIsSaving(true);
    // Save the changes to the database
    try {
      const { error } = await supabase.rpc('update_team_crest', {
        p_team_id: teamId,
        p_crest: { type, color1, color2, thickness },
      });
      if (error) throw error;
      await queryClient.invalidateQueries(['teamProfile', teamId]);

      router.back();

      Toast.show({
        type: 'success',
        text1: 'Crest Updated',
        text2: `${teamProfile?.name}'s crest has been successfully updated.`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: `Failed to update crest: ${error.message}`,
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
        <CrestEditor crest={teamProfile?.crest} handleSave={handleSave} isSaving={isSaving} />
      </View>
    </SafeViewWrapper>
  );
};

export default ManageCrestPage;

const styles = StyleSheet.create({});
