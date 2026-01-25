import { useState } from 'react';
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TeamLogo from '../../components/TeamLogo';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const DivisionAccordion = ({ divisionName, teams = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View className="w-full overflow-hidden rounded-xl border border-theme-gray-5 bg-bg-grouped-2">
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
            <View
              key={team.id}
              className="flex flex-row items-center justify-start rounded-lg bg-bg-grouped-1 px-3 py-3">
              <TeamLogo
                size={30}
                type={team.crest?.type}
                color1={team.crest?.color1}
                color2={team.crest?.color2}
                thickness={team.crest?.thickness}
              />
              <View className="flex flex-1 flex-row gap-4 pl-4">
                <Text className="font-saira-medium text-lg text-text-2">{team.abbreviation}</Text>
                <Text className="font-saira-medium text-lg text-text-1">{team.name}</Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={22}
                color="gray"
                style={{
                  transform: [{ rotate: '270deg' }],
                }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default DivisionAccordion;
