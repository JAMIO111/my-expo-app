import ConfirmModal from '@components/ConfirmModal';
import { ScrollView, View, Image, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useState } from 'react';
import useUserProfile from '@hooks/useUserProfile';
import { useUser } from '@contexts/UserProvider';
import { getAgeInYearsAndDays } from '@lib/helperFunctions';
import CTAButton from '@components/CTAButton';
import Heading from '@components/Heading';
import supabase from '@lib/supabaseClient';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import LoadingSplash from '@components/LoadingSplash';
import StatCard from '@components/StatCard';

export default function PlayerProfile({ context }) {
  const router = useRouter();
  const { teamId, userId } = useLocalSearchParams();
  const { colorScheme } = useColorScheme();
  const { data: playerProfile, isLoading, error } = useUserProfile?.(userId);
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [removePlayerModalVisible, setRemovePlayerModalVisible] = useState(false);
  const { refetch, loading, player } = useUser();

  if (error) {
    console.error('Error loading user profile:', error);
    return (
      <View className="w-full flex-1 items-center justify-center bg-bg-grouped-1">
        <Text className="text-text-1">Error loading profile</Text>
      </View>
    );
  }
  if (isLoading || loading) {
    return <LoadingSplash />;
  }

  const { years, days } = getAgeInYearsAndDays(playerProfile?.dob);

  const handleConfirm = async () => {
    const { data, error } = await supabase
      .from('Teams')
      .update({ captain: playerProfile.id })
      .eq('id', player.team.id);
    setCaptainModalVisible(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'We could not change your team captain.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.error('Supabase update error:', error);
    } else {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your team captain has been changed.',
        props: {
          colorScheme: colorScheme,
          position: 'top',
        },
      });
      console.log('Confirmed!');
      refetch();
    }
  };

  const handleCancel = () => {
    console.log('Cancelled');
    setCaptainModalVisible(false);
  };

  const handleViewStats = () => {
    if (context === 'home/league') {
      router.push(`home/league/${teamId}/${userId}/player-stats`);
    } else {
      router.push(`/teams/${playerProfile.team_id}/PlayerStats`);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="w-full bg-bg-grouped-1 px-4 py-6">
      <View className="w-full flex-row items-center justify-start gap-6">
        {playerProfile?.avatar_url ? (
          <Image
            source={{ uri: playerProfile?.avatar_url }}
            className="h-32 w-32 rounded-xl border-2 border-brand"
            style={{ resizeMode: 'cover' }}
          />
        ) : (
          <View
            className="h-32 w-32 items-center justify-center rounded-xl
        border-2 border-brand bg-brand-light">
            <Text className="text-5xl font-bold text-white">
              {playerProfile?.first_name.charAt(0)}
              {playerProfile?.surname.charAt(0)}
            </Text>
          </View>
        )}
        <View className="h-32 justify-between">
          <Text className="text-4xl font-bold text-text-1">
            {playerProfile?.first_name} {playerProfile?.surname}
          </Text>
          <Text className="text-3xl font-bold text-text-1">{playerProfile?.nickname}</Text>
        </View>
      </View>
      <View className="w-full">
        <Heading text="Personal Details" />
        <View className="gap-2.5 rounded-xl bg-bg-grouped-2 p-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-xl text-text-2">Team</Text>
            <Text className="text-xl font-semibold text-text-1">{playerProfile?.team_name}</Text>
          </View>

          <View className="border-t border-separator"></View>
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-xl text-text-2">Date of Birth</Text>
            <Text className="text-xl font-semibold text-text-1">
              {new Date(playerProfile?.dob).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Text>
          </View>
          <View className="border-t border-border-color"></View>
          <View className="w-full flex-row items-center justify-between ">
            <Text className="text-xl text-text-2">Age</Text>
            <Text className="text-xl font-semibold text-text-1">{`${years} Years ${days} days`}</Text>
          </View>
          <View className="border-t border-border-color"></View>
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-xl text-text-2">Member Since</Text>
            <Text className="text-xl font-semibold text-text-1">
              {new Date(playerProfile.created_at).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      <View className="w-full">
        <Heading text="Statistics" />
        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatCard title="Matches Played" value="86" />
            <StatCard title="MOTMs" value="12" />
          </View>
          <View className="flex-row gap-3">
            <StatCard title="Wins" value="52" />
            <StatCard title="Losses" value="34" />
          </View>
        </View>
      </View>
      <View className="my-8 w-full gap-5 pb-16">
        <CTAButton callbackFn={handleViewStats} text="View All Stats" type="success"></CTAButton>
        <CTAButton
          type="info"
          callbackFn={() => {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'Your team captain has been changed.',
              props: {
                colorScheme: colorScheme,
              },
            });
          }}
          text="Compare Stats"></CTAButton>
        {player?.team.captain === player.id && playerProfile.id !== player.id && (
          <>
            <CTAButton
              type="brand"
              callbackFn={() => setCaptainModalVisible(true)}
              text="Make Team Captain"></CTAButton>
            <ConfirmModal
              visible={captainModalVisible}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              title="Transfer Captaincy?"
              message={`Are you sure you want to make ${playerProfile.nickname} the team captain? This cannot be undone.`}
            />
          </>
        )}
        {(player?.team.captain === player.id || playerProfile.id === player.id) && (
          <>
            <CTAButton
              type="error"
              callbackFn={() => setRemovePlayerModalVisible(true)}
              text={
                player?.team.captain === player.id && playerProfile.id !== player.id
                  ? 'Remove Player'
                  : 'Leave Team'
              }
            />
            <ConfirmModal
              visible={removePlayerModalVisible}
              onConfirm={() => {
                // Add your remove/leave logic here
                setRemovePlayerModalVisible(false);
              }}
              onCancel={() => setRemovePlayerModalVisible(false)}
              title={
                player?.team.captain === player.id && playerProfile.id !== player.id
                  ? 'Remove Player?'
                  : 'Leave Team?'
              }
              message={
                player?.team.captain === player.id && playerProfile.id !== player.id
                  ? `Are you sure you want to remove ${playerProfile.nickname} from the team? This cannot be undone.`
                  : 'Are you sure you want to leave the team? You will need the captain to invite you again if you wish to rejoin.'
              }
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 128,
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
