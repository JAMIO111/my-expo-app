import { tieBreakSummary } from '@components/TieBreakEditor';
import KeyboardAwareScrollView from '@components/KeyboardAwareScrollView';
import { StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { CircleCheckBig } from 'lucide-react-native';
import SettingsItem from '@components/SettingsItem';
import EditableSettingsItem from '@components/EditableSettingsItem';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useAdminsByDistrict } from '@hooks/useAdminsByDistrict';
import { handleFixtureError } from '@lib/fixtureActionErrors';

const LeagueConfig = () => {
  const { currentRole, player, refetch } = useUser();
  const [districtName, setDistrictName] = useState(currentRole?.district?.name || '');
  const [joinCode, setJoinCode] = useState(currentRole?.district?.code || '');
  const [teamCode, setTeamCode] = useState(currentRole?.district?.team_signup_code || '');

  const { data: admins, isLoading: adminsLoading } = useAdminsByDistrict(currentRole?.district?.id);

  console.log('Admins:', admins);

  useEffect(() => {
    if (currentRole) {
      setDistrictName(currentRole?.district?.name || '');
      setJoinCode(currentRole?.district?.code || '');
      setTeamCode(currentRole?.district?.team_signup_code || '');
    }
  }, [currentRole]);

  const handleEditCode = (newCode) => {
    if (newCode.length > 6) return alert('Join code must be exactly 6 characters long.');
    setJoinCode(newCode);
  };

  const hasChanges =
    districtName !== currentRole?.district?.name ||
    joinCode !== currentRole?.district?.code ||
    teamCode !== (currentRole?.district?.team_signup_code || '');

  const handleSave = async () => {
    if (!hasChanges) return;

    const regex = /^[0-9]{6}$/;

    if (!regex.test(joinCode)) {
      Toast.show({ type: 'info', text1: 'Join code must be exactly 6 numerical digits.' });
      return;
    }

    if (!regex.test(teamCode)) {
      Toast.show({ type: 'info', text1: 'Team sign-up code must be exactly 6 numerical digits.' });
      return;
    }

    if (teamCode === joinCode) {
      Toast.show({ type: 'info', text1: 'The admin code and team sign-up code must be different.' });
      return;
    }

    if (districtName.trim().length < 3) {
      Toast.show({ type: 'info', text1: 'District name must be at least 3 characters long.' });
      return;
    }

    try {
      const districtId = currentRole?.district?.id;

      if (districtName !== currentRole?.district?.name) {
        const { error } = await supabase.rpc('update_district_settings', {
          p_district_id: districtId,
          p_name: districtName.trim(),
        });
        if (error) throw error;
      }

      if (joinCode !== currentRole?.district?.code) {
        const { error } = await supabase.rpc('set_district_join_code', {
          p_district_id: districtId,
          p_code: joinCode,
        });
        if (error) throw error;
      }

      if (teamCode !== (currentRole?.district?.team_signup_code || '')) {
        const { error } = await supabase.rpc('set_team_signup_code', {
          p_district_id: districtId,
          p_code: teamCode,
        });
        if (error) throw error;
      }

      await refetch();
      Toast.show({ type: 'success', text1: 'Changes saved successfully' });
    } catch (error) {
      console.error('Error updating district:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Failed to save changes.',
        fallbackMessage: 'Please try again.',
      });
    }
  };

  // Switch rows: one checked RPC updates only the setting that changed.
  const updateSetting = async (changes) => {
    try {
      const { error } = await supabase.rpc('update_district_settings', {
        p_district_id: currentRole?.district?.id,
        ...changes,
      });
      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Error updating league setting:', error);
      await handleFixtureError(error, {
        fallbackTitle: 'Failed to save changes.',
        fallbackMessage: 'Please try again.',
      });
    }
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
                rightIcon={CircleCheckBig}
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <KeyboardAwareScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <MenuContainer title="League Settings">
          <EditableSettingsItem
            iconBGColor="gray"
            title="District Name"
            icon="folderPen"
            value={districtName}
            onChangeText={setDistrictName}
          />
          <EditableSettingsItem
            iconBGColor="gray"
            title="Admin Access Code"
            icon="rectangleEllipsis"
            value={joinCode}
            onChangeText={handleEditCode}
          />
          <EditableSettingsItem
            iconBGColor="gray"
            title="Team Sign-up Code"
            icon="rectangleEllipsis"
            value={teamCode}
            onChangeText={(text) => text.length <= 6 && setTeamCode(text)}
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.private}
            setValue={() => updateSetting({ p_private: !currentRole?.district?.private })}
            icon={currentRole?.district?.private ? 'eyeOff' : 'eye'}
            title={currentRole?.district?.private ? 'Private League' : 'Public League'}
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.transfer_approval_required}
            setValue={() => updateSetting({ p_transfer_approval_required: !currentRole?.district?.transfer_approval_required })}
            icon={currentRole?.district?.transfer_approval_required ? 'shieldCheck' : 'circleCheck'}
            title={
              currentRole?.district?.transfer_approval_required
                ? 'Transfer Approval Required'
                : 'No Transfer Approval Required'
            }
          />
          <SwitchSettingsItem
            defaultValue={currentRole?.district?.transfer_window_open}
            setValue={() => updateSetting({ p_transfer_window_open: !currentRole?.district?.transfer_window_open })}
            icon={currentRole?.district?.transfer_window_open ? 'doorOpen' : 'doorClosed'}
            title={
              currentRole?.district?.transfer_window_open
                ? 'Transfer Window Open'
                : 'Transfer Window Closed'
            }
            lastItem={true}
          />
          <SettingsItem
            title="Result Escalation"
            icon="scale"
            routerPath="/settings/ResultEscalation"
            text={`${currentRole?.district?.result_escalation_days ?? 3} days`}
          />
          <SettingsItem
            title="Tie-break Rules"
            icon="scale"
            routerPath="/settings/TieBreakRules"
            text={tieBreakSummary(currentRole?.district?.tie_break_rules)}
          />
          <SettingsItem title="Manage Venues" routerPath="/settings/Addresses" icon="mapPinHouse" />
        </MenuContainer>
        {adminsLoading || !admins ? null : (
          <MenuContainer title="League Admins">
            {admins?.map((admin, index) => {
              let color;

              console.log('Admin', admin);

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
                  routerPath={
                    admin.Players.id === player.id
                      ? '/settings/PersonalDetails'
                      : '/settings/ManageAdmin'
                  }
                  iconBGColor={color}
                  title={`${admin.Players.first_name} ${admin.Players.surname}`}
                  player={admin.Players}
                  lastItem
                />
              );
            })}
            <SettingsItem
              title="Invite an Admin"
              icon="userRoundPlus"
              routerPath="/settings/InviteAdmin"
              lastItem
            />
          </MenuContainer>
        )}
        <Text className="text-center font-tektur text-sm text-text-2">
          A Proud Break Room League Since:{' '}
          {` ${new Date(currentRole?.district?.initiated_at).toLocaleDateString()}`}
        </Text>
      </KeyboardAwareScrollView>
    </SafeViewWrapper>
  );
};

export default LeagueConfig;

const styles = StyleSheet.create({});
