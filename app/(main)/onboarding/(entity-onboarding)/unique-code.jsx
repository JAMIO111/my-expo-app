import { StyleSheet, Text, View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import CTAButton from '@components/CTAButton';
import StepPillGroup from '@components/StepPillGroup';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useUser } from '@contexts/UserProvider';
import { useQueryClient } from '@tanstack/react-query';

const UniqueCode = () => {
  const queryClient = useQueryClient();
  const { player, currentRole, setCurrentRole, roles } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNewTeam = params.isNewTeam === 'true'; // Convert string to boolean
  const isNewLeague = params.isNewLeague === 'true'; // Convert string to boolean
  const [selectionIndex, setSelectionIndex] = useState(Array(6).fill({ start: 0, end: 0 }));
  const [newAdminId, setNewAdminId] = useState(null);

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  console.log('Player in UniqueCode:', player);
  console.log('Current Role in UniqueCode:', currentRole);
  console.log('All Roles in UniqueCode:', roles);

  // Create refs for each input
  const inputsRef = useRef([]);

  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  useEffect(() => {
    setCurrentRole(roles.find((r) => r.id === newAdminId));
  }, [roles, newAdminId]);

  const handleCreateLeague = async () => {
    setIsLoading(true);

    try {
      const code = digits.join('');

      if (code.length !== 6) {
        throw new Error('INVALID_CODE');
      }

      const { data: leagueData, error: fetchError } = await supabase
        .from('Districts')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !leagueData) {
        throw new Error('LEAGUE_NOT_FOUND');
      }

      // 🆕 NEW LEAGUE → lock it + navigate
      if (leagueData.status === 'new') {
        const { error: updateError } = await supabase
          .from('Districts')
          .update({
            status: 'locked',
            locked_by: player.id,
            locked_at: new Date().toISOString(),
            lock_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min lock
          })
          .eq('id', leagueData.id);

        if (updateError) {
          throw new Error('LOCK_FAILED');
        }

        router.replace({
          pathname: '/(main)/onboarding/(entity-onboarding)/district-name',
          params: { districtId: leagueData.id },
        });
        return;
      }

      // 🔒 LOCKED
      if (leagueData.status === 'locked') {
        throw new Error('LEAGUE_LOCKED');
      }

      // ✅ ACTIVE → request admin access
      if (leagueData.status === 'active') {
        const { data: newAdminRole, error } = await supabase.rpc('join_district_as_admin', {
          p_player_id: player.id,
          p_district_id: leagueData.id,
        });

        if (error) throw new Error('ADMIN_FLOW_FAILED');

        queryClient.setQueryData(['authUserProfile'], (old) => ({
          ...old,
          playerProfile: {
            ...old.playerProfile,
            onboarding: 9,
          },
        }));

        setCurrentRole({ role: 'admin', district: { id: leagueData.id, name: leagueData.name } });
        queryClient.invalidateQueries(['authUserProfile']);

        Toast.show({
          type: 'success',
          text1: 'Admin Access Granted',
          text2: `You are now an admin for ${leagueData.name}.`,
        });
        return;
      }
    } catch (err) {
      // 🎯 Centralised error handling
      let message = {
        type: 'error',
        text1: 'Something went wrong',
        text2: 'Please try again.',
      };

      switch (err.message) {
        case 'INVALID_CODE':
          message = {
            type: 'error',
            text1: 'Invalid Code',
            text2: 'Please enter a valid 6-digit code.',
          };
          inputsRef.current[0]?.focus();
          break;

        case 'LEAGUE_NOT_FOUND':
          message = {
            type: 'error',
            text1: 'Invalid League Code',
            text2: 'Please check the code and try again.',
          };
          break;

        case 'LOCK_FAILED':
          message = {
            type: 'error',
            text1: 'Failed to lock league',
            text2: 'Please try again.',
          };
          break;

        case 'LEAGUE_LOCKED':
          message = {
            type: 'info',
            text1: 'League is locked',
            text2:
              'This league is currently being set up by another admin. Please check back soon.',
          };
          break;

        case 'ADMIN_FLOW_FAILED':
          message = {
            type: 'error',
            text1: 'Oops - something went wrong',
            text2: 'Could not grant admin access. Try again.',
          };
          break;
      }

      Toast.show(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    setIsLoading(true);
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      setIsLoading(false);
      inputsRef.current[0].focus();
      return;
    } else {
      const { data: LeagueData, error } = await supabase
        .from('Districts')
        .select(
          `*,
          Divisions:Divisions!Divisions_district_fkey (
          id,
          name,  
          group_id,
          group_name,  
          tier,
          competitor_type,
          max_competitors,
          admin_approval_required
          )`
        )
        .eq('code', code)
        .single();

      if (error) {
        console.log('Error fetching league data:', error);
        Toast.show({
          type: 'error',
          text1: 'League could not be found',
          text2: 'Please check the code and try again.',
        });
      } else if (LeagueData) {
        router.push({
          pathname: '/(main)/onboarding/(entity-onboarding)/team-name',
          params: { league: JSON.stringify(LeagueData) },
        });
      }
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    setIsLoading(true);
    const code = digits.join('');
    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter a valid 6-digit code.',
      });
      setIsLoading(false);
      inputsRef.current[0].focus();
      return;
    } else {
      const { data: TeamData, error } = await supabase
        .from('Teams')
        .select('*')
        .eq('code', code)
        .single();

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Team could not be found',
          text2: 'Please check the code and try again.',
        });
      } else if (TeamData) {
        router.push({
          pathname: '/(main)/onboarding/(entity-onboarding)/team-confirm',
          params: { team: JSON.stringify(TeamData) },
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: isNewTeam ? 'Step 1 of 7' : isNewLeague ? 'Step 1 of 4' : 'Step 1 of 3',
        }}
      />

      <View className="flex-1 gap-3 bg-brand">
        <StepPillGroup steps={isNewTeam ? 7 : isNewLeague ? 4 : 3} currentStep={1} />
        <View className="p-5">
          <Text
            style={{ lineHeight: 50 }}
            className="my-4 font-delagothic text-5xl font-bold text-text-on-brand">
            {isNewLeague
              ? 'Enter Access Code'
              : isNewTeam
                ? 'Enter League Code'
                : 'Enter Team Code'}
          </Text>
          <Text className="font-saira text-2xl text-text-on-brand-2">
            {isNewLeague
              ? 'The app administrator should have provided you with your unique 6 digit code.'
              : isNewTeam
                ? 'Your league official should have provided you with your unique 6 digit code.'
                : 'Your team captain should have provided you with your unique 6 digit code.'}
          </Text>
        </View>

        <View
          style={{ borderTopRightRadius: 32, borderTopLeftRadius: 32 }}
          className="flex-1 gap-5 bg-brand-dark p-6 shadow shadow-brand-light">
          <View className="flex-row justify-between">
            {digits.map((digit, i) => (
              <View key={i} style={{ flex: 1, marginHorizontal: 4 }}>
                <TextInput
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChangeText={(text) => {
                    // Update digit
                    if (/^\d?$/.test(text)) {
                      const newDigits = [...digits];
                      newDigits[i] = text;
                      setDigits(newDigits);

                      // Move focus forward if typed
                      if (text && i < inputsRef.current.length - 1) {
                        inputsRef.current[i + 1].focus();
                      }

                      // Update selection to end
                      const newSelection = [...selectionIndex];
                      newSelection[i] = { start: text.length, end: text.length };
                      setSelectionIndex(newSelection);
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={1}
                  className="border-border-color bg-white font-saira-semibold text-4xl text-black focus:border-theme-blue"
                  style={styles.input}
                  textAlign="center"
                  selection={selectionIndex[i]}
                  onFocus={() => {
                    // Only move cursor to end if input has content
                    if (digits[i]) {
                      const newSelection = [...selectionIndex];
                      newSelection[i] = { start: digits[i].length, end: digits[i].length };
                      setSelectionIndex(newSelection);
                    }
                  }}
                  returnKeyType={i === digits.length - 1 ? 'done' : 'next'}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      if (!digits[i] && i > 0) {
                        // Move focus to previous box if current is empty
                        inputsRef.current[i - 1].focus();
                      } else {
                        // Clear current box (already handled by onChangeText)
                      }
                    }
                  }}
                />
              </View>
            ))}
          </View>

          <View className="mt-5">
            <CTAButton
              type="yellow"
              disabled={isLoading}
              text={
                isLoading
                  ? 'Fetching Details...'
                  : isNewLeague
                    ? 'Get Started'
                    : isNewTeam
                      ? 'Find League'
                      : 'Find Team'
              }
              callbackFn={
                isNewLeague ? handleCreateLeague : isNewTeam ? handleCreateTeam : handleJoinTeam
              }
            />
          </View>
        </View>
      </View>
    </>
  );
};

export default UniqueCode;

const styles = StyleSheet.create({
  input: {
    lineHeight: 48,
    height: 60,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
});
