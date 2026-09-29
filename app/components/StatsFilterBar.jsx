import { Pressable, ScrollView, Text, View } from 'react-native';
import { SlidersHorizontal, X } from 'lucide-react-native';
import { useTheme } from '@contexts/ThemeProvider';

// "Filters" button (with an active-count badge) followed by one removable chip
// per active filter, so filters can be seen and undone without reopening the sheet.
const StatsFilterBar = ({ activeChips, onOpen, onClearAll }) => {
  const { colors: themeColors } = useTheme();
  const count = activeChips.length;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3 px-2">
        <Pressable
          onPress={onOpen}
          className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${
            count > 0 ? 'border-brand bg-brand' : 'border-theme-gray-4 bg-bg-1'
          }`}>
          <SlidersHorizontal size={16} color={count > 0 ? '#fff' : themeColors.icon} />
          <Text
            className={`font-saira-semibold text-base ${count > 0 ? 'text-white' : 'text-text-1'}`}>
            Filters
          </Text>
          {count > 0 && (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-white px-1">
              <Text className="font-saira-bold text-xs text-brand">{count}</Text>
            </View>
          )}
        </Pressable>
        {count > 0 && (
          <Pressable onPress={onClearAll} hitSlop={8}>
            <Text className="font-saira-medium text-base text-text-2 underline">Clear all</Text>
          </Pressable>
        )}
      </View>

      {count > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}>
          {activeChips.map((chip) => (
            <Pressable
              key={chip.key}
              onPress={chip.onRemove}
              className="flex-row items-center gap-1.5 rounded-full border border-theme-gray-4 bg-bg-1 py-1.5 pl-3 pr-2">
              <Text className="font-saira-medium text-sm text-text-1">{chip.label}</Text>
              <X size={14} color={themeColors.icon} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default StatsFilterBar;
