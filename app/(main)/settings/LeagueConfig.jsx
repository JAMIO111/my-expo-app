import { StyleSheet, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import SettingsItem from '@components/SettingsItem';
import EditableSettingsItem from '@components/EditableSettingsItem';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import { useUser } from '@contexts/UserProvider';
import { Switch } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useAdminsByDistrict } from '@hooks/useAdminsByDistrict';

const LeagueConfig = () => {
  const { currentRole, refetch } = useUser();
  const [districtName, setDistrictName] = useState(currentRole?.district?.name || '');
  const [joinCode, setJoinCode] = useState(currentRole?.district?.code || '');

  const { data: admins, isLoading: adminsLoading } = useAdminsByDistrict(currentRole?.district?.id);

  console.log('Admins:', admins);

  useEffect(() => {
    if (currentRole) {
      setDistrictName(currentRole?.district?.name || '');
      setJoinCode(currentRole?.district?.code || '');
    }
  }, [currentRole]);

  const handleEditCode = (newCode) => {
    if (newCode.length > 6) return alert('Join code must be exactly 6 characters long.');
    setJoinCode(newCode);
  };

  const hasChanges =
    districtName !== currentRole?.district?.name || joinCode !== currentRole?.district?.code;

  const handleSave = async () => {
    if (!hasChanges) return;

    const regex = /^[0-9]{6}$/;

    if (!regex.test(joinCode)) {
      Toast.show({ type: 'info', text1: 'Join code must be exactly 6 digits long.' });
      return;
    }

    if (districtName.trim().length < 3) {
      Toast.show({ type: 'info', text1: 'District name must be at least 3 characters long.' });
      return;
    }

    const { data, error } = await supabase
      .from('Districts')
      .update({ name: districtName.trim(), code: joinCode })
      .eq('id', currentRole?.district?.id)
      .select();

    if (error) {
      console.error('Error updating district:', error);
      if (error.message === 'duplicate key value violates unique constraint "Districts_name_key"') {
        Toast.show({
          type: 'error',
          text1: 'District name already exists.',
          text2: 'Please choose another name.',
        });
      } else if (
        error.message === 'duplicate key value violates unique constraint "Districts_code_key"'
      ) {
        Toast.show({
          type: 'error',
          text1: 'Join code already exists.',
          text2: 'Please choose another code.',
        });
      } else {
        Toast.show({ type: 'error', text1: 'Failed to save changes.' });
      }
      return;
    }

    await refetch();
    Toast.show({ type: 'success', text1: 'Changes saved successfully' });
  };

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                title="League Configuration"
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon="checkmark-outline"
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer>
          <EditableSettingsItem
            iconBGColor="gray"
            title="District Name"
            icon="text-outline"
            value={districtName}
            onChangeText={setDistrictName}
          />
          <EditableSettingsItem
            iconBGColor="gray"
            title="Join Code"
            icon="key-outline"
            value={joinCode}
            onChangeText={handleEditCode}
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.private}
            setValue={async () => {
              const newValue = !currentRole?.district?.private;

              const { data, error } = await supabase
                .from('Districts')
                .update({ private: newValue })
                .eq('id', currentRole?.district?.id)
                .select();

              if (error) {
                console.error(error);
                return;
              }

              await refetch();
            }}
            icon={currentRole?.district?.private ? 'eye-off-outline' : 'eye-outline'}
            iconBGColor={currentRole?.district?.private ? 'gray' : 'blue'}
            title={currentRole?.district?.private ? 'Private League' : 'Public League'}
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.transfer_approval_required}
            setValue={async () => {
              const newValue = !currentRole?.district?.transfer_approval_required;

              const { data, error } = await supabase
                .from('Districts')
                .update({ transfer_approval_required: newValue })
                .eq('id', currentRole?.district?.id)
                .select();

              if (error) {
                console.error(error);
                return;
              }

              await refetch();
            }}
            icon={
              currentRole?.district?.transfer_approval_required
                ? 'hand-left-outline'
                : 'thumbs-up-outline'
            }
            iconBGColor={currentRole?.district?.transfer_approval_required ? 'orange' : 'green'}
            title={
              currentRole?.district?.transfer_approval_required
                ? 'Transfer Approval Required'
                : 'No Transfer Approval Required'
            }
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.transfer_window_open}
            setValue={async () => {
              const newValue = !currentRole?.district?.transfer_window_open;

              const { data, error } = await supabase
                .from('Districts')
                .update({ transfer_window_open: newValue })
                .eq('id', currentRole?.district?.id)
                .select();

              if (error) {
                console.error(error);
                return;
              }

              await refetch();
            }}
            icon={
              currentRole?.district?.transfer_window_open
                ? 'swap-horizontal-outline'
                : 'lock-closed-outline'
            }
            iconBGColor={currentRole?.district?.transfer_window_open ? 'green' : 'red'}
            title={
              currentRole?.district?.transfer_window_open
                ? 'Transfer Window Open'
                : 'Transfer Window Closed'
            }
            lastItem={true}
          />
        </MenuContainer>
        {adminsLoading || !admins ? null : (
          <MenuContainer title="League Admins">
            {admins?.map((admin, index) => {
              let color;

              switch (index % 4) {
                case 0:
                  color = '#3B82F6'; // Blue
                  break;

                case 1:
                  color = '#EF4444'; // Red
                  break;

                case 2:
                  color = '#22C55E'; // Green
                  break;

                case 3:
                  color = '#F59E0B'; // Orange
                  break;

                default:
                  color = '#9CA3AF'; // Fallback
              }
              return (
                <SettingsItem
                  key={admin.id}
                  routerPath="/settings/PersonalDetails"
                  iconBGColor={color}
                  title={`${admin.Players.first_name} ${admin.Players.surname}`}
                  icon="person"
                  lastItem
                />
              );
            })}
          </MenuContainer>
        )}
        <Text className="text-center text-sm text-text-2">
          A Proud Break Room League Since:{' '}
          {` ${new Date(currentRole?.district?.initiated_at).toLocaleDateString()}`}
        </Text>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default LeagueConfig;

const styles = StyleSheet.create({});
