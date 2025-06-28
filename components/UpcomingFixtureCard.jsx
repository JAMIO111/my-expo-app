import { StyleSheet, Text, View } from 'react-native';
import TeamLogo from './TeamLogo';
import React from 'react';

const UpcomingFixtureCard = () => {
  return (
    <View className="bg-background border-border-color h-32 w-72 items-center justify-center gap-2 rounded-xl border">
      <View className="w-full items-center justify-between px-4">
        <View className="w-full flex-row items-center justify-center gap-2">
          <TeamLogo size={20} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-text-primary text-xl font-semibold">
            Shankhouse B
          </Text>
        </View>
        <Text className="text-text-secondary">vs</Text>
        <View className="w-full flex-row items-center justify-center gap-2">
          <TeamLogo size={20} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className="text-text-primary text-xl font-semibold">
            Bedlington Station
          </Text>
        </View>
      </View>
      <Text className="text-text-secondary">Sat 16 Aug 2025</Text>
    </View>
  );
};

export default UpcomingFixtureCard;

const styles = StyleSheet.create({});
