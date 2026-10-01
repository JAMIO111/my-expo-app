import { View, Text, SectionList } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { format, parseISO } from 'date-fns';
import { useTheme } from '@contexts/ThemeProvider';

const RADIUS = 24; // matches rounded-3xl

// Matches grouped by date as rounded cards, with each day's date header pinned to the top while that
// day's matches scroll underneath. Headers are pinned natively (no scroll lag). A card is drawn from
// three pieces so the header can stick on its own: a rounded-top header, side-bordered rows, and a
// rounded-bottom last row.
//
// Put it inside a rounded `overflow-hidden` wrapper to round the list's top edge: the wrapper clips the
// pinned header, so only the card's own top corners need handling here (see CornerMask).
//
// `backgroundColor` should match the page behind the list (defaults to the theme's brand-dark).
export default function StickyDateList({
  grouped,
  renderItem,
  keyExtractor = (item) => String(item.id),
  contentContainerStyle,
  backgroundColor,
}) {
  const { colors } = useTheme();
  const pageColor = backgroundColor ?? colors.brandDark;
  const sections = (grouped || []).map(([date, data]) => ({ date, data }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle ?? { paddingBottom: 30 }}
      renderSectionHeader={({ section }) => (
        <View>
          <View className="rounded-t-3xl border-x border-t border-theme-gray-5 bg-bg-grouped-2 px-4 pb-1 pt-3">
            <Text className="font-saira-semibold text-2xl text-text-1">
              {format(parseISO(section.date), 'EEE, d MMMM')}
            </Text>
          </View>
          {/* fills the square corners outside the header's rounded top, so rows scrolling underneath
              a pinned header can't show through them */}
          <CornerMask color={pageColor} />
          <CornerMask color={pageColor} right />
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const last = index === section.data.length - 1;
        return (
          <View
            className="border-x border-theme-gray-5 bg-bg-grouped-2 px-2"
            style={
              last
                ? {
                    marginBottom: 16,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                    borderBottomLeftRadius: RADIUS,
                    borderBottomRightRadius: RADIUS,
                  }
                : undefined
            }>
            {renderItem(item, index, section.data.length)}
          </View>
        );
      }}
    />
  );
}

// An inverse quarter-circle: the square corner OUTSIDE a rounded corner, in the page colour.
function CornerMask({ color, right }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        [right ? 'right' : 'left']: 0,
        width: RADIUS,
        height: RADIUS,
        transform: right ? [{ scaleX: -1 }] : undefined,
      }}>
      <Svg width={RADIUS} height={RADIUS} viewBox={`0 0 ${RADIUS} ${RADIUS}`}>
        <Path d={`M0 0 H${RADIUS} A${RADIUS} ${RADIUS} 0 0 0 0 ${RADIUS} Z`} fill={color} />
      </Svg>
    </View>
  );
}
