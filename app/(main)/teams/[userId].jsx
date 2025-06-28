import React, { useState } from 'react';
import ConfirmModal from 'components/ConfirmModal';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View, Image, Text, StyleSheet } from 'react-native';
import useUserProfile from '../../../hooks/useUserProfile';
import { useUser } from 'contexts/UserProvider';
import { getAgeInYearsAndDays } from 'lib/helperFunctions';
import CTAButton from 'components/CTAButton';
import Heading from 'components/Heading';
import { supabase } from 'lib/supabaseClient';
import Toast from 'react-native-toast-message';
import { useColorScheme } from 'nativewind';
import LoadingSplash from 'components/LoadingSplash';

export default function Profile() {
  const { colorScheme } = useColorScheme();
  const { userId } = useLocalSearchParams();
  const { data: playerProfile, isLoading, error } = useUserProfile?.(userId);
  const [modalVisible, setModalVisible] = useState(false);
  const { refetch, loading, player } = useUser();
  console.log('Me Player:', player);
  console.log('Other User:', playerProfile);

  if (error) {
    console.error('Error loading user profile:', error);
    return (
      <View className="bg-background-dark w-full flex-1 items-center justify-center">
        <Text className="text-text-primary">Error loading profile</Text>
      </View>
    );
  }

  if (loading || isLoading) {
    return <LoadingSplash />;
  }

  const { years, days } = getAgeInYearsAndDays(playerProfile.dob);

  const handleConfirm = async () => {
    const { data, error } = await supabase
      .from('Teams')
      .update({ captain: playerProfile.id })
      .eq('id', player.team.id);
    setModalVisible(false);

    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'We could not change your team captain.',
        props: {
          colorScheme: colorScheme,
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
        },
      });
      console.log('Confirmed!');
      refetch();
    }
  };

  const handleCancel = () => {
    console.log('Cancelled');
    setModalVisible(false);
  };

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}
      className="bg-background-dark w-full px-3 py-5">
      <View className="w-full flex-row items-center justify-start gap-6">
        {playerProfile.avatar_url ? (
          <Image
            source={{ uri: playerProfile.avatar_url }}
            className="border-brand h-32 w-32 rounded-xl border-2"
            style={{ resizeMode: 'cover' }}
          />
        ) : (
          <View
            className="border-brand bg-brand-light h-32 w-32 items-center
        justify-center rounded-xl border-2">
            <Text className="text-5xl font-bold text-white">
              {playerProfile.first_name.charAt(0)}
              {playerProfile.surname.charAt(0)}
            </Text>
          </View>
        )}
        <View className="h-32 justify-between">
          <Text className="text-text-primary text-4xl font-bold">
            {playerProfile.first_name} {playerProfile.surname}
          </Text>
          <Text className="text-text-primary text-3xl font-bold">{playerProfile.nickname}</Text>
          <Text className="text-text-primary text-3xl font-semibold">{playerProfile.nickname}</Text>
        </View>
      </View>
      <View className="w-full">
        <Heading text="Personal Details" />
        <View className="border-border-color bg-background gap-2.5 rounded-xl border p-3">
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-text-secondary text-xl">Team</Text>
            <Text className="text-text-primary text-xl font-semibold">
              {playerProfile.team_name}
            </Text>
          </View>

          <View className="border-border-color border-t"></View>
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-text-secondary text-xl">Date of Birth</Text>
            <Text className="text-text-primary text-xl font-semibold">
              {new Date(playerProfile.dob).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Text>
          </View>
          <View className="border-border-color border-t"></View>
          <View className="w-full flex-row items-center justify-between ">
            <Text className="text-text-secondary text-xl">Age</Text>
            <Text className="text-text-primary text-xl font-semibold">{`${years} Years ${days} days`}</Text>
          </View>
          <View className="border-border-color border-t"></View>
          <View className="w-full flex-row items-center justify-between">
            <Text className="text-text-secondary text-xl">Member Since</Text>
            <Text className="text-text-primary text-xl font-semibold">
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
            <View className="bg-background border-border-color" style={styles.card}>
              <Text className="text-text-secondary text-lg font-semibold">Games Played</Text>
              <Text className="font-saira text-text-primary flex-1 pt-5 text-7xl font-extrabold">
                165
              </Text>
            </View>
            <View className="bg-background border-border-color" style={styles.card}>
              <Text
                className="text-text-secondary text-lg font-semibold"
                numberOfLines={1}
                ellipsizeMode="tail">
                Most Valuable Player
              </Text>
              <Text className="font-saira text-text-primary flex-1 pt-5 text-7xl font-extrabold">
                7
              </Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="bg-background border-border-color" style={styles.card}>
              <Text className="text-text-secondary text-lg font-semibold">Wins</Text>
              <Text className="font-saira text-text-primary flex-1 pt-5 text-7xl font-extrabold">
                62
              </Text>
            </View>
            <View className="bg-background border-border-color justify-between" style={styles.card}>
              <Text className="text-text-secondary text-lg font-semibold">Losses</Text>
              <Text className="font-saira text-text-primary flex-1 pt-5 text-7xl font-extrabold">
                24
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="my-8  w-full">
        <CTAButton
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
        {player.team.captain === player.id && playerProfile.id !== player.id && (
          <>
            <CTAButton
              callbackFn={() => setModalVisible(true)}
              text="Make Team Captain"></CTAButton>
            <ConfirmModal
              visible={modalVisible}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              title="Transfer Captaincy?"
              message={`Are you sure you want to make ${playerProfile.nickname} the team captain? This cannot be undone.`}
            />
          </>
        )}
        <CTAButton type="error" text="Remove from Team" />
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
