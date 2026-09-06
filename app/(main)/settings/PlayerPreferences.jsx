import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import { useQueryClient } from '@tanstack/react-query';

const PlayerPreferences = () => {
  const { player, currentRole, refetch } = useUser();
  const queryClient = useQueryClient();

  const handleToggle = async (field) => {
    const newValue = !player[field];

    const { data, error } = await supabase
      .from('Players')
      .update({ [field]: newValue })
      .eq('id', player?.id)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    await refetch();
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Player Preferences" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <View className="justify-between">
          {/* Top Content */}
          <View>
            <MenuContainer>
              <SwitchSettingsItem
                icon="calendarCheck2"
                defaultValue={player?.is_available}
                setValue={async () => {
                  await handleToggle('is_available');
                  queryClient.invalidateQueries(['TeamPlayers', currentRole?.team_id]);
                }}
                title="Matchday Availability"
              />
              <SwitchSettingsItem
                icon="binoculars"
                defaultValue={player?.is_searching}
                title="Searching for Team"
                setValue={async () => await handleToggle('is_searching')}
              />
              <SwitchSettingsItem
                icon="search"
                title="Visible in searches"
                defaultValue={!player?.is_private}
                setValue={async () => await handleToggle('is_private')}
              />
            </MenuContainer>
          </View>
        </View>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default PlayerPreferences;

const styles = StyleSheet.create({});
