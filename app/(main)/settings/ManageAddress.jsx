import { Text, View, ScrollView, Pressable, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import MenuContainer from '@components/MenuContainer';
import { useUser } from '@contexts/UserProvider';
import SettingsItem from '@components/SettingsItem';
import { supabase } from '@/lib/supabase';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader'; // Adjust the import path as necessary
import Toast from 'react-native-toast-message';
import EditableSettingsItem from '@components/EditableSettingsItem';

const ManageAddress = () => {
  const { player, loading: playerLoading, refetch, currentRole } = useUser(); // Assume refreshUser reloads user data
  const [venueName, setVenueName] = useState(currentRole?.team?.name || '');
  const [numberOfTables, setNumberOfTables] = useState(currentRole?.team?.number_of_tables || '');
  const [abbreviation, setAbbreviation] = useState(currentRole?.team?.abbreviation || '');
  const [address, setAddress] = useState(currentRole?.team?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  console.log('PersonalDetails:', player, currentRole);

  const validate = () => {
    const errors = {};

    if (!venueName.trim()) {
      errors.venueName = 'Venue name is required';
    } else if (venueName.length > 50) {
      errors.venueName = 'Venue name must be under 50 characters';
    }

    if (!numberOfTables.trim()) {
      errors.numberOfTables = 'Number of tables is required';
    } else if (!/^\d+$/.test(numberOfTables)) {
      errors.numberOfTables = 'Must be a whole number';
    } else if (Number(numberOfTables) < 1 || Number(numberOfTables) > 200) {
      errors.numberOfTables = 'Must be between 1 and 200';
    }

    if (!address.line_1.trim()) {
      errors.line_1 = 'Address line 1 is required';
    }

    if (!address.city.trim()) {
      errors.city = 'Town/city is required';
    }

    if (!address.postcode.trim()) {
      errors.postcode = 'Postcode is required';
    } else if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(address.postcode)) {
      errors.postcode = 'Invalid UK postcode';
    }

    return errors;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('upsert_address', {
        name: venueName,
        line_1: address.line_1,
        line_2: address.line_2,
        city: address.city,
        county: address.county,
        postcode: address.postcode,
        tables: numberOfTables,
      });
      if (error) {
        throw error;
      }
      Toast.show({
        type: 'success',
        text1: 'Team details updated successfully',
      });
      refetch(); // Refresh user data after successful update
    } catch (error) {
      console.error('Error updating team details:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to update team details',
        text2: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!player) {
      setHasChanges(false);
      return;
    }

    const requiredFieldsFilled = venueName.trim() !== '' && numberOfTables.trim() !== '';

    const changed =
      venueName !== currentRole?.team?.name ||
      numberOfTables !== currentRole?.team?.number_of_tables;

    setHasChanges(requiredFieldsFilled && changed);
  }, [venueName, numberOfTables, currentRole]);

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader
                onRightPress={hasChanges ? handleSave : undefined}
                rightIcon="checkmark-outline"
                title="Manage Address"
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
            title="Venue Name"
            value={venueName}
            onChangeText={setVenueName}
            placeholder="Enter venue name"
          />
          <EditableSettingsItem
            title="Line 1"
            value={address.line_1}
            onChangeText={(text) => setAddress({ ...address, line_1: text })}
            placeholder="Enter address line 1"
          />
          <EditableSettingsItem
            title="Line 2"
            value={address.line_2}
            onChangeText={(text) => setAddress({ ...address, line_2: text })}
            placeholder="Enter address line 2"
          />
          <EditableSettingsItem
            title="Town"
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
            placeholder="Enter town/city"
          />
          <EditableSettingsItem
            title="County"
            value={address.county}
            onChangeText={(text) => setAddress({ ...address, county: text })}
            placeholder="Enter county"
          />
          <EditableSettingsItem
            title="Postcode"
            value={address.postcode}
            onChangeText={(text) => setAddress({ ...address, postcode: text })}
            placeholder="Enter postcode"
            lastItem={true}
          />
        </MenuContainer>
        <MenuContainer>
          <EditableSettingsItem
            title="Number of Tables"
            value={numberOfTables}
            onChangeText={setNumberOfTables}
            placeholder="Enter number of tables"
          />
        </MenuContainer>
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default ManageAddress;
