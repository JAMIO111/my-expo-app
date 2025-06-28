import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';

const LeagueHomeCard = () => {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/home/league')}
      className="bg-background border-border-color h-28 w-full rounded-xl border">
      <View className="border-border-color w-full flex-row items-center justify-between border-b px-4 py-2">
        <Text className="text-text-primary text-xl font-semibold">League Table</Text>
        <Ioconicons name="chevron-forward" size={24} color="#aaa" />
      </View>
      <View className="flex-1 flex-row items-center justify-between px-5 py-3">
        <View className="flex-1 flex-row items-center justify-start gap-3">
          <Text className="text-text-primary text-2xl font-semibold">12</Text>
          <TeamLogo size={20} />
          <Text className="text-text-secondary text-lg">Shankhouse B</Text>
        </View>
        <Text className="text-text-primary text-2xl font-semibold">15 Pts</Text>
      </View>
    </Pressable>
  );
};

export default LeagueHomeCard;

const styles = StyleSheet.create({});
