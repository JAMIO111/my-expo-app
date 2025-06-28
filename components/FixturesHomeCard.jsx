import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Ioconicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import TeamLogo from './TeamLogo';

const FixturesHomeCard = () => {
  const router = useRouter();
  const fixtures = true; // Placeholder for fixtures data, replace with actual data fetching logic
  return (
    <Pressable
      onPress={() => router.push('/home/fixtures')}
      className="bg-background border-border-color h-28 w-full rounded-xl border">
      <View className="border-border-color w-full flex-row items-center justify-between border-b px-4 py-2">
        <Text className="text-text-primary text-xl font-semibold">Fixtures</Text>
        <Ioconicons name="chevron-forward" size={24} color="#aaa" />
      </View>
      {!fixtures ? (
        <View className="items-left flex-1 justify-center px-5">
          <Text className="text-text-secondary text-left text-lg">{`No fixtures available yet.`}</Text>
        </View>
      ) : (
        <View className="flex-1 flex-row items-center justify-center px-5">
          <View className="flex-1 flex-row items-center justify-start">
            <Ioconicons name="calendar-outline" size={16} color="#aaa" />
            <Text className="text-text-secondary text-md ml-2">Sat 16 Aug 2025</Text>
          </View>
          <View className=" flex-row items-center justify-start">
            <Text className="text-text-primary mr-2 text-lg font-semibold">SHB</Text>
            <TeamLogo size={20} />
            <Text className="text-text-secondary mx-2 text-lg">vs</Text>
            <TeamLogo size={20} />
            <Text className="text-text-primary ml-2 text-lg font-semibold">SBA</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default FixturesHomeCard;

const styles = StyleSheet.create({});
