import React from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Avatar from '@components/Avatar';
import { calculateLevel } from '@lib/helperFunctions';
import { useUser } from '@contexts/UserProvider';

const RANK_STYLES = {
  1: { ring: 'border-[#D4AF37]', badge: ['#D4AF37', '#d4922a'], icon: 'trophy' },
  2: { ring: 'border-[#C7CDD6]', badge: ['#C7CDD6', '#9AA3AF'], icon: 'medal' },
  3: { ring: 'border-[#C98A4B]', badge: ['#C98A4B', '#9C6633'], icon: 'medal' },
};

function RankBadge({ rank }) {
  const style = RANK_STYLES[rank];

  if (!style) {
    return (
      <View className="h-8 w-8 items-center justify-center">
        <Text className="font-saira-semibold text-lg text-text-2">{rank}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={style.badge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Ionicons name={style.icon} size={18} color="#0A1F14" />
    </LinearGradient>
  );
}

function LeaderboardRow({ player, isLast }) {
  const { player: currentPlayer } = useUser();
  const { rank, imageUrl, first_name, surname, xp, level } = player;
  const ring = RANK_STYLES[rank]?.ring ?? 'border-theme-gray-3';
  const { level: calculatedLevel } = calculateLevel(xp);
  const isMe = player.id === currentPlayer?.id;

  return (
    <View
      className={`flex-row items-center ${isMe ? 'bg-[#00550e25]' : 'bg-bg-grouped-2'} px-4 py-3 ${
        !isLast ? 'border-b border-bg-grouped-3' : ''
      }`}>
      {/* Rank */}
      <View className="w-10 items-center justify-center">
        <RankBadge rank={rank} />
      </View>

      {/* Avatar */}
      <View className={`rounded-full border-2 ${ring} ml-3 mr-3 overflow-hidden bg-bg-grouped-3`}>
        <Avatar player={player} size={40} />
      </View>

      {/* Name */}
      <View className="mr-3 flex-1">
        <Text className="font-saira-semibold text-xl text-text-1" numberOfLines={1}>
          {first_name} {surname}
        </Text>
        <Text className="font-saira-medium text-base text-text-2">{xp.toLocaleString()} XP</Text>
      </View>

      {/* Level pill */}
      <View
        style={{ paddingBottom: 3, paddingTop: 4, width: 65 }}
        className="items-center rounded-full border border-brand bg-brand-light px-3">
        <Text className="font-saira-bold text-sm text-text-on-brand">Lvl {calculatedLevel}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen({ players = [], scope }) {
  const sorted = [...players]
    .sort((a, b) => b.xp - a.xp)
    .map((player, index, array) => {
      const firstIndex = array.findIndex((p) => p.xp === player.xp);

      return {
        ...player,
        rank: firstIndex + 1,
      };
    });

  return (
    <View className="flex-1 bg-bg-grouped-1">
      {/* Header */}
      <View className="p-4">
        <Text className="font-saira-bold text-2xl text-text-1">{scope} Rankings</Text>
        <Text className="font-saira text-base text-text-2">BY EXPERIENCE POINTS</Text>
      </View>

      {/* List */}
      <View className="mx-4 overflow-hidden rounded-3xl border border-theme-gray-5">
        <FlatList
          data={sorted}
          keyExtractor={(item) => String(item.id ?? item.rank)}
          renderItem={({ item, index }) => (
            <LeaderboardRow player={item} isLast={index === sorted.length - 1} />
          )}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}
