import { ScrollView, View, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import useAddressDetails from '@/hooks/useAddressDetails';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import { supabase } from '@/lib/supabase';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import Toast from 'react-native-toast-message';
import EditableSettingsItem from '@components/EditableSettingsItem';
import SettingsItem from '@components/SettingsItem';
import SwitchSettingsItem from '@components/SwitchSettingsItem';
import RotatingLoader from '@components/RotatingLoader';
import { useQueryClient } from '@tanstack/react-query';

const ManageAddress = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addressId, role, mode } = useLocalSearchParams();
  console.log('Address ID from params:', addressId, 'Role:', role, 'Mode:', mode);
  const { player, loading: playerLoading, refetch, currentRole } = useUser(); // Assume refreshUser reloads user data
  const {
    data: addressData,
    isLoading: addressLoading,
    error: addressError,
  } = useAddressDetails(addressId);
  const [modeState, setModeState] = useState(mode); // 'add' or 'edit'
  const [roleState, setRoleState] = useState(role); // 'admin' or 'player'
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [address, setAddress] = useState({
    name: '',
    line_1: '',
    line_2: '',
    city: '',
    county: '',
    postcode: '',
    tables: '',
    neutral: false,
    teams: [],
  });

  useEffect(() => {
    if (addressData) {
      setAddress(addressData);
    }
  }, [addressData]);

  console.log('PersonalDetails:', player, currentRole);
  console.log('Address data:', address, 'Address error:', addressError);

  const formatPostcode = (postcode) => {
    if (!postcode) return '';

    const cleaned = postcode.toUpperCase().replace(/\s+/g, '');

    if (cleaned.length < 5) return cleaned;

    return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  };

  const validate = () => {
    const errors = {};

    if (!address?.name?.trim()) {
      errors.name = 'Venue name is required';
    } else if (address?.name?.length > 30) {
      errors.name = 'Venue name must be under 30 characters';
    }

    if (!String(address?.tables)?.trim()) {
      errors.tables = 'Number of tables is required';
    } else if (!/^\d+$/.test(String(address?.tables))) {
      errors.tables = 'Must be a whole number';
    } else if (Number(address?.tables) < 1 || Number(address?.tables) > 20) {
      errors.tables = 'Must be between 1 and 20';
    }

    if (!address?.line_1?.trim()) {
      errors.line_1 = 'Address line 1 is required';
    }
    if (!address?.city?.trim()) {
      errors.city = 'Town/city is required';
    }

    if (!address?.postcode?.trim()) {
      errors.postcode = 'Postcode is required';
    } else if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(address?.postcode)) {
      errors.postcode = 'Invalid UK postcode';
    }

    return errors;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join('\n');
      Toast.show({ type: 'error', text1: 'Validation Error', text2: errorMessages });
      setIsSaving(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('upsert_address', {
        p_address_id: modeState === 'add' ? null : addressId,
        p_name: address?.name,
        p_line_1: address?.line_1,
        p_line_2: address?.line_2,
        p_city: address?.city,
        p_county: address?.county,
        p_postcode: formatPostcode(address?.postcode),
        p_tables: address?.tables ? Number(address.tables) : null,
        p_neutral: address?.neutral,
        p_team_id: modeState === 'add' && roleState === 'player' ? currentRole?.team?.id : null,
        p_district_id: currentRole?.district?.id,
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.message ?? 'Failed to save address');

      Toast.show({ type: 'success', text1: 'Venue updated successfully' });
      roleState === 'player' && (await refetch()); // Refresh user data if player
      roleState === 'admin' &&
        queryClient.invalidateQueries(['Addresses', currentRole?.district?.id]);
      queryClient.invalidateQueries(['AddressDetails', addressId]);
      router.back();
    } catch (error) {
      console.error('Error updating venue:', error);
      Toast.show({ type: 'error', text1: 'Failed to update venue', text2: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!addressId) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.from('Addresses').delete().eq('id', addressId);
      if (error) throw error;
      roleState === 'player' && (await refetch()); // Refresh user data if player
      roleState === 'admin' &&
        queryClient.invalidateQueries(['Addresses', currentRole?.district?.id]);
      router.back();
      Toast.show({ type: 'success', text1: 'Venue deleted successfully' });
    } catch (error) {
      console.error('Error deleting venue:', error);
      Toast.show({ type: 'error', text1: 'Failed to delete venue', text2: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLink = async () => {
    if (!addressId || !currentRole?.team?.id) return;
    setIsLinking(true);
    try {
      const { data, error } = await supabase
        .from('Teams')
        .update({ address: addressId })
        .eq('id', currentRole?.team?.id);
      if (error) throw error;
      await refetch();
      await queryClient.invalidateQueries(['AddressDetails', addressId]);

      Toast.show({ type: 'success', text1: 'Venue linked successfully' });
    } catch (error) {
      console.error('Error linking venue:', error);
      Toast.show({ type: 'error', text1: 'Failed to link venue', text2: error.message });
    } finally {
      setModeState('edit'); // Switch to edit mode after linking
      await new Promise((r) => setTimeout(r, 1000)); // temporary
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!addressId) return;
    setIsUnlinking(true);
    try {
      const { data, error } = await supabase
        .from('Teams')
        .update({ address: null })
        .eq('id', currentRole?.team?.id);
      if (error) throw error;
      await refetch();
      await queryClient.invalidateQueries(['AddressDetails', addressId]);

      Toast.show({ type: 'success', text1: 'Venue unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking venue:', error);
      Toast.show({ type: 'error', text1: 'Failed to unlink venue', text2: error.message });
    } finally {
      await new Promise((r) => setTimeout(r, 1000)); // temporary
      setIsUnlinking(false);
    }
  };

  useEffect(() => {
    const changed =
      address?.name !== addressData?.name ||
      address?.line_1 !== addressData?.line_1 ||
      address?.line_2 !== addressData?.line_2 ||
      address?.city !== addressData?.city ||
      address?.county !== addressData?.county ||
      formatPostcode(address?.postcode) !== formatPostcode(addressData?.postcode) ||
      address?.neutral !== addressData?.neutral ||
      String(address?.tables ?? '') !== String(addressData?.tables ?? '');

    setHasChanges(changed);
  }, [address, addressData]);

  const isMyVenue = address?.teams?.some((team) => team.id === currentRole?.team?.id);

  const isEditable =
    roleState === 'admin' || modeState === 'add' || (roleState === 'player' && isMyVenue);

  console.log('RoleState:', roleState, 'ModeState:', modeState);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon="checkmark-outline"
                title={modeState === 'add' ? 'Create Venue' : 'Manage Venue'}
              />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        {addressLoading ? (
          <View className="w-full flex-1 items-center justify-center gap-5 rounded-2xl bg-bg-1 p-8 py-12">
            <RotatingLoader />
            <Text className="font-tektur text-lg text-text-2">Loading venues details...</Text>
          </View>
        ) : (
          <>
            {!isMyVenue && modeState === 'edit' && (
              <MenuContainer>
                <SettingsItem
                  title={isLinking ? 'Linking...' : 'Link Venue to Team'}
                  iconColor="#0000FF"
                  titleColor="text-[#0000FF]"
                  icon="link"
                  callbackFn={roleState === 'admin' ? undefined : handleLink}
                />
              </MenuContainer>
            )}
            <MenuContainer title="Address Details">
              <EditableSettingsItem
                title="Venue Name"
                value={address?.name}
                onChangeText={(text) => setAddress({ ...address, name: text })}
                placeholder="Enter venue name"
                editable={isEditable}
              />
              <EditableSettingsItem
                title="Line 1"
                value={address?.line_1}
                onChangeText={(text) => setAddress({ ...address, line_1: text })}
                placeholder="Enter address line 1"
                editable={isEditable}
              />
              <EditableSettingsItem
                title="Line 2"
                value={address?.line_2}
                onChangeText={(text) => setAddress({ ...address, line_2: text })}
                placeholder="Enter address line 2"
                editable={isEditable}
              />
              <EditableSettingsItem
                title="Town"
                value={address?.city}
                onChangeText={(text) => setAddress({ ...address, city: text })}
                placeholder="Enter town/city"
                editable={isEditable}
              />
              <EditableSettingsItem
                title="County"
                value={address?.county}
                onChangeText={(text) => setAddress({ ...address, county: text })}
                placeholder="Enter county"
                editable={isEditable}
              />
              <EditableSettingsItem
                title="Postcode"
                value={address?.postcode}
                onChangeText={(text) => setAddress({ ...address, postcode: text })}
                placeholder="Enter postcode"
                editable={isEditable}
                lastItem={true}
              />
            </MenuContainer>
            <MenuContainer title="Venue Details">
              <EditableSettingsItem
                title="No. of Tables"
                value={String(address?.tables ?? '')}
                onChangeText={(text) => setAddress({ ...address, tables: text })}
                placeholder="Enter No. of pool tables"
                editable={isEditable}
              />
              <SwitchSettingsItem
                title="Neutral Venue"
                defaultValue={address?.neutral}
                setValue={(newValue) => setAddress({ ...address, neutral: newValue })}
                disabled={!isEditable}
              />
            </MenuContainer>

            {modeState !== 'add' && address?.teams?.length > 0 && (
              <MenuContainer title="Associated Teams">
                {address?.teams?.map((team) => (
                  <SettingsItem
                    key={team.id}
                    title={team.display_name}
                    value={team.name}
                    team={team}
                    onChangeText={(text) => {
                      const updatedTeams = address.teams.map((t) =>
                        t.id === team.id ? { ...t, name: text } : t
                      );
                      setAddress({ ...address, teams: updatedTeams });
                    }}
                    placeholder="Enter team name"
                  />
                ))}
              </MenuContainer>
            )}
            {modeState !== 'add' && (
              <MenuContainer>
                {roleState === 'admin' && (
                  <SettingsItem
                    title={isDeleting ? 'Deleting...' : 'Delete Venue'}
                    icon="trash"
                    iconColor="#FF0000"
                    titleColor="text-[#FF0000]"
                    callbackFn={handleDelete}
                  />
                )}
                {roleState === 'player' && isMyVenue && (
                  <SettingsItem
                    title={isUnlinking ? 'Unlinking...' : 'Unlink Address'}
                    icon="unlink"
                    iconColor="#FF0000"
                    titleColor="text-[#FF0000]"
                    callbackFn={handleUnlink}
                  />
                )}
              </MenuContainer>
            )}
          </>
        )}
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default ManageAddress;
