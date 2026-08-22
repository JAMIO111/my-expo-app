import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Globe, List, Landmark } from 'lucide-react-native';
import { useState } from 'react';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import PlayerLeaderboard from '@components/PlayerLeaderboard';
import { usePlayerRankings } from '@hooks/usePlayerRankings';
import ChipSelector from '@components/ChipSelector';
import { useUser } from '@contexts/UserProvider';

const HEADER_HEIGHT = 54;
const CHIP_BAR_FALLBACK_HEIGHT = 56;

const LeaderboardLayout = () => {
  const { currentRole } = useUser();
  const [selectedScope, setSelectedScope] = useState('Global');
  const [chipBarHeight, setChipBarHeight] = useState(CHIP_BAR_FALLBACK_HEIGHT);
  const router = useRouter();

  const args =
    selectedScope === 'Global'
      ? { districtId: null, divisionId: null }
      : selectedScope === 'District'
        ? { districtId: currentRole?.district?.id ?? null, divisionId: null }
        : selectedScope === 'Division'
          ? { districtId: null, divisionId: currentRole?.division?.id ?? null }
          : { districtId: null, divisionId: null };

  const { data: playerRankings, isLoading } = usePlayerRankings(args);

  // --- sticky hide-on-scroll-down / show-on-scroll-up ---
  const prevScrollY = useSharedValue(0);
  const chipTranslateY = useSharedValue(0);
  const chipHeightSV = useSharedValue(CHIP_BAR_FALLBACK_HEIGHT);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - prevScrollY.value;

      if (currentY <= 0) {
        // Fully visible while at/above the top (also covers iOS overscroll bounce)
        chipTranslateY.value = 0;
      } else {
        chipTranslateY.value = Math.min(
          Math.max(chipTranslateY.value + diff, 0),
          chipHeightSV.value
        );
      }

      prevScrollY.value = currentY;
    },
  });

  // Slide the bar up/down (Apple nav-bar collapse style). It tucks
  // completely behind CustomHeader when hidden — see zIndex/overflow notes below.
  const chipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -chipTranslateY.value }],
  }));

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

        {/* Clipping container: anything the chip bar slides above its own
            top edge is cut off here, so it tucks away cleanly regardless
            of how the native header is layered/elevated. */}
        <View style={{ flex: 1, marginTop: HEADER_HEIGHT, overflow: 'hidden' }}>
          <Animated.View
            onLayout={(e) => {
              const height = e.nativeEvent.layout.height;
              if (height && height !== chipBarHeight) {
                setChipBarHeight(height);
                chipHeightSV.value = height;
              }
            }}
            style={[styles.chipBar, chipAnimatedStyle]}
            className="border-b border-theme-gray-5 bg-white py-2">
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
                  icon: <Landmark size={14} color="#000" />,
                  selectedIcon: <Landmark size={14} color="#fff" />,
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
          </Animated.View>

          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: chipBarHeight,
              paddingBottom: 40,
            }}>
            <PlayerLeaderboard players={playerRankings ?? []} scope={selectedScope} />
          </Animated.ScrollView>
        </View>
      </SafeViewWrapper>
    </>
  );
};

export default LeaderboardLayout;

const styles = StyleSheet.create({
  chipBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
