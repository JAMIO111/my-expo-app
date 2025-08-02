import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Dimensions,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { useState } from 'react';
import { badgeIcons } from '@lib/badgeIcons';
import CTAButton from '@components/CTAButton';
import { ScrollView } from 'react-native-gesture-handler';
import BadgeTierScrollView from './BadgeTierScrollView';

const NUM_COLUMNS = 3;
const ITEM_MARGIN = 10;
const BADGE_SIZE = Dimensions.get('window').width / 3 - ITEM_MARGIN * 3; // Adjust size based on screen width
const SCREEN_WIDTH = Dimensions.get('window').width;
const BADGE_ITEM_WIDTH = SCREEN_WIDTH * 0.6; // 60% of screen width
const BADGE_ITEM_SPACING = 16;
const SNAP_INTERVAL = BADGE_ITEM_WIDTH + BADGE_ITEM_SPACING;
const SIDE_PADDING = (SCREEN_WIDTH - BADGE_ITEM_WIDTH) / 2;

const BadgeList = ({ badges }) => {
  const [parentWidth, setParentWidth] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const onLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    setParentWidth(width);
  };

  const renderItem = ({ item: badge }) => {
    if (!parentWidth) return null;

    const itemWidth = (parentWidth - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
    const unlockedTier = badge?.unlocked_tier;
    const unlockedEntry = badge?.meta_data?.find((entry) => entry.tier === unlockedTier);
    const iconKey = unlockedEntry?.icon;

    // 2. Fallback to locked icon if nothing found
    const iconSource =
      iconKey && badgeIcons[iconKey] ? badgeIcons[iconKey] : require('@assets/LockedBadge.png');

    return (
      <Pressable
        onPress={() => handleBadgePress(badge)}
        className="gap-3 rounded-xl border border-theme-gray-4 bg-bg-grouped-3"
        style={[styles.badgeContainer, { width: itemWidth, marginHorizontal: ITEM_MARGIN / 2 }]}>
        <View className="w-full border-theme-gray-4 bg-theme-gray-4" style={styles.labelWrapper}>
          <Text
            className="text-center font-saira-semibold text-xl text-text-1"
            style={{ lineHeight: 20 }}
            numberOfLines={2}
            ellipsizeMode="tail">
            {badge?.key
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </Text>
        </View>
        <View style={styles.badgeBG}>
          <Image source={iconSource} style={styles.badgeImage} resizeMode="contain" />
        </View>
      </Pressable>
    );
  };

  return (
    <View className="items-center pt-6" onLayout={onLayout} style={styles.wrapper}>
      {parentWidth && (
        <FlatList
          data={badges}
          renderItem={renderItem}
          keyExtractor={(badge) => badge.id}
          numColumns={NUM_COLUMNS}
          scrollEnabled={false}
          contentContainerStyle={styles.container}
        />
      )}
      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View className="border border-theme-gray-5 bg-bg-grouped-2" style={styles.modalContent}>
            <View className="mb-8 w-full">
              <Text className="w-full rounded-xl bg-theme-gray-3 p-2 pt-4 text-center font-saira-medium text-3xl text-text-1">
                {selectedBadge?.key
                  .split('-')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </Text>
            </View>
            <BadgeTierScrollView selectedBadge={selectedBadge} />
            <View className="mt-6 w-full">
              <CTAButton text="Dismiss" type="success" callbackFn={closeModal} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default BadgeList;

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {},
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: ITEM_MARGIN * 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
  },
  badgeBG: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeImage: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  labelWrapper: {
    height: 50, // Enough for two lines of text with spacing
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // dark transparent background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  modalContent: {
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    width: '100%',
    height: 'auto',
    maxHeight: '80%',
    // optional shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // optional elevation for Android
    elevation: 5,
  },
  badgeScrollContainer: {
    gap: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingHorizontal: Dimensions.get('window').width / 2 - BADGE_ITEM_WIDTH / 2,
  },
  modalBadgeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: BADGE_ITEM_WIDTH * 0.8,
    height: BADGE_ITEM_WIDTH * 0.8,
  },
});
