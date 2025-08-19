import { StyleSheet, Text, View, Pressable } from 'react-native';
import React from 'react';
import TeamLogo from './TeamLogo';

const TeamInviteCard = () => {
  return (
    <View
      style={{ borderRadius: 22 }}
      className="w-full border border-theme-purple bg-theme-purple/50 p-6">
      <View className="flex-row items-center justify-between gap-5">
        <View className="flex-1">
          <Text style={{ lineHeight: 40 }} className="font-saira-medium text-4xl text-white">
            Team Invite!
          </Text>
          <Text className="font-saira-regular text-lg text-white">
            You have been invited to join Shankhouse B by John Dryden.
          </Text>
        </View>
        <View className="items-center gap-3">
          <TeamLogo size={60} />
          <Text className="rounded-lg border bg-theme-gray-4 px-2 font-saira-medium text-lg text-black">
            SHB
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-start gap-4">
        <Pressable className="w-36 items-center rounded-lg border border-theme-red bg-theme-red/70 p-2">
          <Text className="font-saira-medium text-lg text-white">Decline Invite</Text>
        </Pressable>
        <Pressable className="w-36 items-center rounded-lg border border-theme-green bg-theme-green/70 p-2">
          <Text className="font-saira-medium text-lg text-white">Accept Invite</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TeamInviteCard;

const styles = StyleSheet.create({});
