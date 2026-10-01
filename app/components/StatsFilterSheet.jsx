import { forwardRef, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { Gem, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChipSelector from '@components/ChipSelector';
import CTAButton from '@components/CTAButton';
import { useTheme } from '@contexts/ThemeProvider';
import { EMPTY_STATS_FILTERS, countActiveFilters } from '@hooks/useEntityStats';

const ALL = '__all';

export const FRAME_TYPE_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Singles', value: 'singles' },
  { label: 'Doubles', value: 'doubles' },
  { label: 'Scotch Doubles', value: 'scotch-doubles' },
];

export const VENUE_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Home', value: 'home' },
  { label: 'Away', value: 'away' },
  { label: 'Neutral', value: 'neutral' },
];

const Section = ({ title, children }) => (
  <View className="gap-2">
    <Text className="px-2 font-saira-semibold text-xl text-text-1">{title}</Text>
    {children}
  </View>
);

// Multi-select where "All" means nothing selected. Picking a specific option
// drops "All"; picking "All" clears everything else.
const MultiWithAll = ({ options, value, onChange }) => (
  <ChipSelector
    multi
    options={[{ label: 'All', value: ALL }, ...options]}
    value={value.length ? value : [ALL]}
    onChange={(next) => {
      if (next.length && next[next.length - 1] === ALL) onChange([]);
      else onChange(next.filter((v) => v !== ALL));
    }}
  />
);

// Filter sheet for the stats page. Edits a local draft; nothing changes on the
// page until "Apply". Open it with ref.current.present().
const StatsFilterSheet = forwardRef(function StatsFilterSheet(
  {
    seasons = [],
    competitions = [],
    isLoadingOptions,
    optionsError,
    value,
    onApply,
    locked = false,
    onLockedApply,
  },
  ref
) {
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  // Reopening always starts from what is currently applied.
  useEffect(() => setDraft(value), [value]);

  // Free users can explore the sheet, but applying is gated: the upgrade prompt
  // opens over this sheet (which keeps their draft) instead of applying.
  const apply = useCallback(() => {
    if (locked) {
      onLockedApply?.();
      return;
    }
    onApply(draft);
    ref?.current?.dismiss();
  }, [draft, locked, onApply, onLockedApply, ref]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderFooter = useCallback(
    (props) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          className="flex-row gap-3 border-t border-theme-gray-5 bg-bg-2 px-4 pt-3">
          <View style={{ flex: 1 }}>
            <CTAButton
              type="default"
              text="Reset"
              callbackFn={() => setDraft(EMPTY_STATS_FILTERS)}
              disabled={countActiveFilters(draft) === 0}
            />
          </View>
          <View style={{ flex: 2 }}>
            <CTAButton
              type="yellow"
              textColor="black"
              text="Apply"
              lucideIcon={locked ? <Lock size={18} color="black" /> : undefined}
              callbackFn={apply}
            />
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom, draft, apply, locked]
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={['80%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={() => setDraft(value)}
      backdropComponent={renderBackdrop}
      footerComponent={renderFooter}
      backgroundStyle={{
        backgroundColor: themeColors.bg2,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
      }}
      handleIndicatorStyle={{ backgroundColor: themeColors.themeGray3 }}>
      <BottomSheetScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 24 }}
        showsVerticalScrollIndicator={false}>
        <Text className="px-2 font-saira-semibold text-2xl text-text-1">Filter stats</Text>

        {locked && (
          <View className="flex-row items-center gap-3 rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 p-4">
            <Gem size={22} color="#FFD700" />
            <Text className="flex-1 font-saira text-base text-text-2">
              Stat filters are a Core and Pro feature. Have a play with them here, then upgrade to
              apply them.
            </Text>
          </View>
        )}

        {optionsError ? (
          <Text className="px-2 font-saira text-base text-theme-red">
            Couldn't load your seasons and competitions. You can still filter by frame type and
            venue.
          </Text>
        ) : isLoadingOptions ? (
          <View className="flex-row items-center gap-3 px-2">
            <ActivityIndicator color={themeColors.primaryText} />
            <Text className="font-saira text-base text-text-2">Loading seasons…</Text>
          </View>
        ) : (
          <>
            {seasons.length > 0 && (
              <Section title="Season">
                <MultiWithAll
                  options={seasons.map((s) => ({ label: s.name, value: s.id }))}
                  value={draft.seasonIds}
                  onChange={(seasonIds) => setDraft((d) => ({ ...d, seasonIds }))}
                />
              </Section>
            )}
            {competitions.length > 0 && (
              <Section title="Competition">
                <MultiWithAll
                  options={competitions.map((c) => ({ label: c.name, value: c.id }))}
                  value={draft.competitionIds}
                  onChange={(competitionIds) => setDraft((d) => ({ ...d, competitionIds }))}
                />
              </Section>
            )}
          </>
        )}

        <Section title="Frame type">
          <ChipSelector
            options={FRAME_TYPE_OPTIONS}
            value={draft.frameType}
            onChange={(frameType) => setDraft((d) => ({ ...d, frameType }))}
          />
        </Section>

        <Section title="Venue">
          <ChipSelector
            options={VENUE_OPTIONS}
            value={draft.venue}
            onChange={(venue) => setDraft((d) => ({ ...d, venue }))}
          />
        </Section>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

export default StatsFilterSheet;
