import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@contexts/UserProvider';
import CTAButton from '@components/CTAButton';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/lib/supabase';

const AbbreviationEditor = () => {
  const router = useRouter();
  const { currentRole, setCurrentRole, player } = useUser(); // Assuming currentRole contains team information
  const [abbreviation, setAbbreviation] = useState(currentRole?.team?.abbreviation || '');
  const [takenAbbreviations, setTakenAbbreviations] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const currentAbbr = currentRole?.team?.abbreviation?.toUpperCase() || '';
  const hasChanges = abbreviation !== currentAbbr;

  useEffect(() => {
    const fetchTakenAbbreviations = async () => {
      const { data, error } = await supabase
        .from('Teams')
        .select('abbreviation, division(id, district(id))')
        .eq('division.district.id', currentRole?.team?.division?.district?.id);

      if (error) {
        console.error('Error fetching abbreviations:', error);
        return;
      }

      console.log('Fetched abbreviations:', data);

      const filtered = data
        .map((team) => team.abbreviation?.toUpperCase())
        .filter(Boolean)
        .filter((abbr) => abbr !== currentRole?.team?.abbreviation?.toUpperCase()); // allow their current one

      setTakenAbbreviations(filtered);
    };

    if (currentRole?.team?.division?.district?.id) {
      fetchTakenAbbreviations();
    }
  }, [currentRole?.team?.division?.district?.id]);

  const handleSave = async () => {
    const { error } = await supabase.rpc('log_and_update_changes', {
      table_name: 'Teams',
      target_id: currentRole?.team?.id,
      updates: { abbreviation: abbreviation.toUpperCase() },
      user_id: player?.auth_id,
    });

    if (error) {
      console.error('Update failed:', error.message);
    } else {
      console.log('Update and log successful');

      setCurrentRole((prev) => ({
        ...prev,
        team: {
          ...prev.team,
          abbreviation: abbreviation.toUpperCase(),
        },
      }));

      router.back(); // Navigate back after saving
    }
  };

  return (
    <View>
      <Text className="mb-3 font-delagothic text-4xl text-text-1">
        Choose your team's 3 letter abbreviation
      </Text>
      <Text className="mt-2 font-saira-medium text-xl text-text-2">
        This will be used in fixtures, results, and leaderboards. It must be unique within your
        district.
      </Text>
      <View className="my-10 items-center">
        <TextInput
          style={{ lineHeight: 100 }}
          className="h-[110px] w-1/2 rounded-3xl border border-separator bg-bg-grouped-2 p-2 text-center font-saira-bold text-7xl text-text-1"
          value={abbreviation}
          onChangeText={(text) => {
            const upper = text.toUpperCase();
            setAbbreviation(upper);

            // Check availability
            if (upper.length > 0 && takenAbbreviations.includes(upper)) {
              setIsAvailable(false);
            } else {
              setIsAvailable(true);
            }
          }}
          autoCapitalize="characters"
          maxLength={3}
          autoComplete="off"
          autoCorrect={false}
        />
      </View>
      <CTAButton
        disabled={!hasChanges || !isAvailable || abbreviation.length !== 3}
        type="success"
        text="Save Changes"
        callbackFn={handleSave}
      />
      {hasChanges && (
        <View className="mt-4 flex-row items-center justify-start gap-2">
          {abbreviation.length !== 3 ? (
            <>
              <Ionicons name="warning-outline" size={24} color="red" />
              <Text className="text-lg text-theme-red">
                Abbreviation must be 3 characters long.
              </Text>
            </>
          ) : !isAvailable ? (
            <>
              <Ionicons name="warning-outline" size={24} color="red" />
              <Text className="text-lg text-theme-red">
                Abbreviation is already taken. Choose another.
              </Text>
            </>
          ) : abbreviation.length === 3 ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="green" />
              <Text className="text-lg text-theme-green">Abbreviation is available.</Text>
            </>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default AbbreviationEditor;

const styles = StyleSheet.create({});
