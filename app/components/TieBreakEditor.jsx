import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { useTheme } from '@contexts/ThemeProvider';

export const TIE_BREAK_OPTIONS = {
  head_to_head: {
    label: 'Head to head',
    hint: 'Results between the tied entrants only',
  },
  frame_diff: { label: 'Frame difference', hint: 'Frames won minus frames lost' },
  frames_for: { label: 'Frames won', hint: 'Most frames won' },
  frames_against: { label: 'Frames conceded', hint: 'Fewest frames lost' },
  wins: { label: 'Matches won', hint: 'Most matches won' },
  special_match: { label: 'Special match frames', hint: 'Most special match frames won' },
};

export const DEFAULT_TIE_BREAKS = ['frame_diff', 'frames_for'];

export const tieBreakSummary = (rules) =>
  (rules?.length ? rules : DEFAULT_TIE_BREAKS)
    .map((r) => TIE_BREAK_OPTIONS[r]?.label)
    .filter(Boolean)
    .join(' → ');

// Ordered list: the first rule is tried first, the next only if entrants are still level.
const TieBreakEditor = ({ rules, onChange, onBrand = false }) => {
  const { colors: themeColors } = useTheme();
  const iconColor = onBrand ? '#FFFFFF' : themeColors.icon;
  const unused = Object.keys(TIE_BREAK_OPTIONS).filter((k) => !rules.includes(k));

  const move = (index, delta) => {
    const next = [...rules];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const textMain = onBrand ? 'text-text-on-brand' : 'text-text-1';
  const textSub = onBrand ? 'text-text-on-brand-2' : 'text-text-2';
  const rowBg = onBrand ? 'bg-white/10' : 'bg-bg-grouped-2';

  return (
    <View className="w-full gap-2">
      {rules.length === 0 ? (
        <Text className={`font-saira text-base ${textSub}`}>
          No rules chosen. Entrants level on points will be ordered by name.
        </Text>
      ) : null}
      {rules.map((rule, index) => (
        <View key={rule} className={`flex-row items-center rounded-xl px-3 py-2 ${rowBg}`}>
          <Text className={`w-7 font-saira-semibold text-lg ${textSub}`}>{index + 1}</Text>
          <View className="flex-1">
            <Text className={`font-saira-medium text-lg ${textMain}`}>
              {TIE_BREAK_OPTIONS[rule]?.label}
            </Text>
            <Text className={`font-saira text-sm ${textSub}`}>{TIE_BREAK_OPTIONS[rule]?.hint}</Text>
          </View>
          <Pressable
            hitSlop={8}
            disabled={index === 0}
            onPress={() => move(index, -1)}
            style={{ opacity: index === 0 ? 0.3 : 1 }}
            accessibilityLabel="Move up"
            className="p-1">
            <ChevronUp size={22} color={iconColor} />
          </Pressable>
          <Pressable
            hitSlop={8}
            disabled={index === rules.length - 1}
            onPress={() => move(index, 1)}
            style={{ opacity: index === rules.length - 1 ? 0.3 : 1 }}
            accessibilityLabel="Move down"
            className="p-1">
            <ChevronDown size={22} color={iconColor} />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() => onChange(rules.filter((r) => r !== rule))}
            accessibilityLabel="Remove rule"
            className="p-1">
            <X size={20} color={iconColor} />
          </Pressable>
        </View>
      ))}
      {unused.length > 0 && rules.length < 6 ? (
        <>
          <Text className={`mt-2 font-saira-medium text-base ${textSub}`}>Add a rule</Text>
          {unused.map((rule) => (
            <Pressable
              key={rule}
              onPress={() => onChange([...rules, rule])}
              className={`flex-row items-center rounded-xl px-3 py-2 ${rowBg}`}>
              <Plus size={20} color={iconColor} />
              <Text className={`ml-3 font-saira-medium text-lg ${textMain}`}>
                {TIE_BREAK_OPTIONS[rule].label}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
};

export default TieBreakEditor;
