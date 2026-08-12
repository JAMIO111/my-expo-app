import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { Globe, List } from 'lucide-react-native';
import { useState } from 'react';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import PlayerLeaderboard from '@components/PlayerLeaderboard';
import { usePlayerRankings } from '@hooks/usePlayerRankings';
import ChipSelector from '@components/ChipSelector';
import { useUser } from '@contexts/UserProvider';

const LeaderboardLayout = () => {
  const { currentRole } = useUser();
  const [selectedScope, setSelectedScope] = useState('Global');
  const router = useRouter();
  const args =
    selectedScope === 'Global'
      ? {
          districtId: null,
          divisionId: null,
        }
      : selectedScope === 'District'
        ? {
            districtId: currentRole?.district?.id ?? null,
            divisionId: null,
          }
        : selectedScope === 'Division'
          ? {
              districtId: null,
              divisionId: currentRole?.division?.id ?? null,
            }
          : {
              districtId: null,
              divisionId: null,
            };

  const { data: playerRankings, isLoading } = usePlayerRankings(args);
  return (
    <>
      <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
        <Stack.Screen
          options={{
            header: () => (
              <SafeViewWrapper useBottomInset={false}>
                <Stack.Screen
                  options={{
                    header: () => (
                      <SafeViewWrapper useBottomInset={false}>
                        <CustomHeader title="Player Leaderboards" showBack={true} />
                      </SafeViewWrapper>
                    ),
                  }}
                />
              </SafeViewWrapper>
            ),
          }}
        />
        <ScrollView contentContainerStyle={{ marginTop: 64, paddingBottom: 40 }}>
          <View className="border-b border-theme-gray-5">
            <ChipSelector
              options={[
                {
                  value: 'Global',
                  label: 'Global',
                  icon: <Globe size={14} color="#000" />,
                  selectedIcon: <Globe size={14} color="#fff" />,
                },
                {
                  value: 'District',
                  label: 'My District',
                  icon: <Globe size={14} color="#000" />,
                  selectedIcon: <Globe size={14} color="#fff" />,
                },
                {
                  value: 'Division',
                  label: 'My Division',
                  icon: <List size={14} color="#000" />,
                  selectedIcon: <List size={14} color="#fff" />,
                },
              ]}
              value={selectedScope}
              onChange={setSelectedScope}
            />
          </View>
          <PlayerLeaderboard players={playerRankings ?? []} scope={selectedScope} />
        </ScrollView>
      </SafeViewWrapper>
    </>
  );
};

export default LeaderboardLayout;

const styles = StyleSheet.create({});
