import { Pressable, StyleSheet, Text, View, Image, Alert, ActivityIndicator } from 'react-native';
import { useRef, useMemo } from 'react';
import { useDivisions } from '@hooks/useDivisions';
import { useUser } from '@contexts/UserProvider';
import { useRouter } from 'expo-router';
import { romanNumerals } from '../lib/badgeIcons';
import Heading from './Heading';
import CTAButton from './CTAButton';
import EmptyStateCard from './EmptyStateCard';
import { ChevronRight } from 'lucide-react-native';

const DivisionsList = ({ districtId }) => {
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { currentRole } = useUser();
  const { data: divisions, isLoading } = useDivisions(districtId);

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

      {isLoading && (
        <View className="w-full flex-row items-center justify-center gap-5 rounded-2xl bg-bg-2 p-8 shadow-sm">
          <ActivityIndicator size="small" color="gray" animating={isLoading} />
          <Text className="font-saira-medium text-text-2">Loading divisions...</Text>
        </View>
      )}

      {!isLoading && groupedDivisions.length === 0 && (
        <View className="w-full gap-5">
          <EmptyStateCard
            title="Oops, No Divisions Found"
            message="There are currently no divisions for this district. Get started by creating your first division below."
          />
          <CTAButton
            type="yellow"
            text="Create Divisions"
            callbackFn={() => {
              Alert.alert(
                'Create Divisions',
                'This feature is not yet implemented. Please contact support to create divisions in the meantime.'
              );
            }}
          />
        </View>
      )}

      {groupedDivisions.length > 0 &&
        groupedDivisions.map((group) => (
          <View key={group.groupId} className="w-full gap-3">
            {/* 🧠 Group Header */}
            <View className="mt-2 flex-row items-center px-2">
              <Text className="font-tektur-medium text-lg text-text-1">{`${group.groupName} - `}</Text>
              <Text className="font-tektur text-lg text-text-2">{group.competitorType}</Text>
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
                      divisionId: division.id,
                    },
                  });
                }}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
                <View className="relative overflow-hidden rounded-3xl bg-bg-2 px-5 py-5">
                  {/* Oversized tier numeral watermark */}
                  {romanNumerals[division.tier] && (
                    <Image
                      source={romanNumerals[division.tier]}
                      style={{
                        position: 'absolute',
                        right: -12,
                        bottom: -14,
                        width: 92,
                        height: 112,
                        opacity: 0.1,
                      }}
                      resizeMode="contain"
                    />
                  )}

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text
                        className="font-tektur-semibold text-[11px] tracking-[2px]"
                        style={{ color: '#d4922a' }}>
                        DIVISION
                      </Text>

                      <Text
                        className="mt-1 font-tektur-semibold text-2xl text-text-1"
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {division.name}
                      </Text>

                      {division.teamCount != null && (
                        <View className="mt-2 flex-row items-center gap-1.5">
                          <Users size={13} color="rgba(255,255,255,0.4)" />
                          <Text className="font-tektur text-sm text-text-2">
                            {division.teamCount} {division.teamCount === 1 ? 'team' : 'teams'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <ChevronRight size={20} color="#000" strokeWidth={2.5} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
    </View>
  );
};

export default DivisionsList;

const styles = StyleSheet.create({});
