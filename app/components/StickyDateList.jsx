import { useMemo } from 'react';
import { View, Text, SectionList } from 'react-native';
import { format, parseISO } from 'date-fns';

// Matches grouped by date, as a list of rounded cards whose date header stays pinned to the top while
// that day's matches scroll underneath, then is pushed off by the next day's header (like the sections
// in the Weather app). Each card is drawn from three pieces so the header can stick on its own: a
// rounded-top header, side-bordered rows, and a rounded-bottom last row.
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  ListEmptyComponent = null,
}) {
  const sections = useMemo(
    () => (grouped || []).map(([date, data]) => ({ date, data })),
    [grouped]
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
      ListEmptyComponent={ListEmptyComponent}
      renderSectionHeader={({ section }) => (
        <View className="bg-transparent">
          <View className="rounded-t-3xl border border-theme-gray-5 bg-bg-grouped-2 px-4 pb-1 pt-3">
            <Text className="font-saira-semibold text-2xl text-text-1">
              {format(parseISO(section.date), 'EEE, d MMMM')}
            </Text>
          </View>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const last = index === section.data.length - 1;
        return (
          <View
            className={`border-x border-theme-gray-5 bg-bg-grouped-2 px-2 ${
              last ? 'mb-4 rounded-b-3xl border-b pb-1' : ''
            }`}>
            {renderItem(item, index, section.data.length)}
          </View>
        );
      }}
    />
  );
}
