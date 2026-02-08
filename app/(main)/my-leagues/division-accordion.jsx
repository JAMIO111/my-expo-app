import { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeamLogo from '@components/TeamLogo';
import { useRouter } from 'expo-router';
import CTAButton from '@components/CTAButton';
import { useTeamPlayers } from '@hooks/useTeamPlayers';
import Avatar from '@components/Avatar';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const DivisionAccordion = ({ divisionName, teams = [] }) => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const { data: teamPlayers, isLoading } = useTeamPlayers(expandedTeam);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="w-full overflow-hidden rounded-3xl border border-theme-gray-5 bg-bg-grouped-2">
      {/* Header */}
      <Pressable onPress={toggle} className="flex-row items-center justify-between p-4">
        <View>
          <Text className="font-saira-semibold text-xl text-text-1">{divisionName}</Text>

          {!expanded && (
            <Text className="font-saira-medium text-text-2">
              {teams.length} team{teams.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-down"
          size={22}
          color="gray"
          style={{
            transform: [{ rotate: expanded ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View className="gap-2 border-t border-theme-gray-5 p-4">
          {teams.map((team) => (
            <Pressable
              onPress={() => setExpandedTeam((prev) => (prev === team.id ? null : team.id))}
              key={team.id}
              className="gap-2 rounded-3xl bg-bg-grouped-1 px-3 py-3">
              <View className="flex-row items-center">
                <TeamLogo
                  size={30}
                  type={team.crest?.type}
                  color1={team.crest?.color1}
                  color2={team.crest?.color2}
                  thickness={team.crest?.thickness}
                />
                <View className="flex flex-1 flex-row items-center gap-4 pl-4">
                  <Text className="font-saira-medium text-lg text-text-2">{team.abbreviation}</Text>
                  <Text className="font-saira-medium text-lg text-text-1">{team.name}</Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color="gray"
                  style={{
                    transform: [{ rotate: expandedTeam === team.id ? '180deg' : '270deg' }],
                  }}
                />
              </View>
              {expandedTeam === team.id && (
                <View className="gap-3">
                  <View className="mt-3 gap-2 rounded-2xl bg-bg-grouped-2 p-3">
                    {isLoading ? (
                      <Text className="text-text-2">Loading players...</Text>
                    ) : !teamPlayers || teamPlayers?.length === 0 ? (
                      <Text className="text-text-2">No players found.</Text>
                    ) : (
                      teamPlayers?.map((player) => (
                        <View key={player.id} className="flex-row items-center gap-3">
                          <Avatar player={player} size={32} borderRadius={8} />
                          <Text
                            key={player.id}
                            className="flex-1 font-saira-medium text-lg text-text-1">
                            {`${player.first_name} ${player.surname} ${player.nickname ? `(${player.nickname})` : ''}`}
                          </Text>
                          {team?.captain === player?.id && (
                            <View className="h-8 justify-center rounded border bg-yellow-500 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                              <View className="w-full items-center justify-center bg-white px-1">
                                <Text style={{ lineHeight: 16 }} className="font-saira text-xs">
                                  Captain
                                </Text>
                              </View>
                            </View>
                          )}
                          {team?.vice_captain === player?.id && (
                            <View className="h-8 justify-center rounded border bg-brand-light shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                              <View className="w-full items-center justify-center bg-white px-4">
                                <Text style={{ lineHeight: 16 }} className="font-saira text-xs">
                                  VC
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                  <CTAButton
                    type="yellow"
                    text="Manage Team"
                    callbackFn={() => router.push(`/my-leagues/${team.id}/manage-team`)}
                    className="mt-3"
                  />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default DivisionAccordion;
