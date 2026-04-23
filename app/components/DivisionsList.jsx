import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { useRef, useMemo } from 'react';
import { useDivisions } from '@hooks/useDivisions';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import { romanNumerals } from '../lib/badgeIcons';
import Heading from './Heading';

const DivisionsList = ({ districtId }) => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const { data: divisions } = useDivisions(districtId);

  // 🔥 Group + sort divisions
  const groupedDivisions = useMemo(() => {
    if (!divisions) return [];

    const groupsMap = divisions.reduce((acc, division) => {
      const groupId = division.group_id ?? -1; // fallback for ungrouped
      const groupName = division.group_name ?? 'Other';
      const competitorType =
        division.competitor_type.slice(0, 1).toUpperCase() +
        division.competitor_type.slice(1).toLowerCase();

      if (!acc[groupId]) {
        acc[groupId] = {
          groupId,
          groupName,
          competitorType,
          divisions: [],
        };
      }

      acc[groupId].divisions.push(division);
      return acc;
    }, {});

    return Object.values(groupsMap)
      .sort((a, b) => {
        if (a.groupId !== b.groupId) {
          return a.groupId - b.groupId;
        }
        return a.groupName.localeCompare(b.groupName);
      })
      .map((group) => ({
        ...group,
        divisions: group.divisions.sort((a, b) => {
          if (a.tier !== b.tier) return a.tier - b.tier;
          return a.name.localeCompare(b.name);
        }),
      }));
  }, [divisions]);

  return (
    <View className="items-start justify-center gap-4 bg-bg-1 p-4 pb-6">
      <Heading text={`${currentRole?.district?.name} Divisions`} />

      {groupedDivisions.map((group) => (
        <View key={group.groupId} className="w-full gap-3">
          {/* 🧠 Group Header */}
          <View className="mt-2 flex-row items-center px-2">
            <Text className="font-saira-medium text-lg text-text-1">{`${group.groupName} - `}</Text>
            <Text className="font-saira-regular text-lg text-text-2">{group.competitorType}</Text>
          </View>

          {/* 📦 Divisions */}
          {group.divisions.map((division) => (
            <Pressable
              key={division.id}
              onPress={() => {
                if (hasNavigated.current) return;

                hasNavigated.current = true;
                setTimeout(() => {
                  hasNavigated.current = false;
                }, 500);

                router.push({
                  pathname: '/(main)/my-leagues/division-overview',
                  params: {
                    divisionStr: JSON.stringify(division),
                  },
                });
              }}
              className="w-full flex-row items-center justify-between rounded-2xl bg-bg-2 p-2 shadow-sm">
              <View className="flex-row items-center gap-4">
                {romanNumerals[division.tier] && (
                  <Image
                    source={romanNumerals[division.tier]}
                    style={{ width: 40, height: 48 }}
                    resizeMode="contain"
                  />
                )}
                <Text className="font-saira-semibold text-xl text-text-1">{division.name}</Text>
              </View>

              <Ionicons name="chevron-forward-outline" size={22} color="gray" />
            </Pressable>
          ))}
        </View>
      ))}

      {!groupedDivisions.length && (
        <Text className="px-12 py-16 text-center font-saira text-xl text-text-2">
          No divisions found.
        </Text>
      )}
    </View>
  );
};

export default DivisionsList;

const styles = StyleSheet.create({});
