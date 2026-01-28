import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Modal,
} from 'react-native';
import IonIcons from 'react-native-vector-icons/Ionicons';

const TrophyCabinet = ({ trophies = [] }) => {
  const [cabinetWidth, setCabinetWidth] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const shelf1 = trophies.filter((_, i) => i % 2 === 0);
  const shelf2 = trophies.filter((_, i) => i % 2 !== 0);

  const maxCount = Math.max(shelf1.length, shelf2.length);
  const trophyWidth = 100;
  const gap = 8;

  const totalTrophyWidth = maxCount * trophyWidth + (maxCount - 1) * gap;
  const FRAME_PADDING = 20; // breathing room inside the frame

  const minShelfWidth = cabinetWidth > 0 ? cabinetWidth - FRAME_PADDING * 2 : 0;

  const shelfWidth = Math.max(totalTrophyWidth, minShelfWidth);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTrophy, setSelectedTrophy] = useState(null);

  const openModal = (trophy) => {
    setSelectedTrophy(trophy);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  // Toggle door open/close when tapping the glass overlay
  const toggleDoor = () => {
    const toValue = isOpen ? 0 : screenWidth;
    Animated.timing(slideAnim, {
      toValue,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setIsOpen(!isOpen));
  };

  // Close door only if open when tapping the plaque
  const closeDoorIfOpen = () => {
    if (isOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIsOpen(false));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.woodFrameWrapper}>
        <View
          onLayout={(e) => {
            setCabinetWidth(e.nativeEvent.layout.width);
          }}
          style={styles.woodFrame}>
          {(!Array.isArray(trophies) || trophies.length === 0) && (
            <Image
              source={require('@assets/cobweb.png')} // your cobweb asset
              style={{
                position: 'absolute',
                top: 79,
                left: 12,
                width: 64,
                height: 64,
                zIndex: 5,
                opacity: 0.6, // subtle effect
              }}
              resizeMode="contain"
            />
          )}
          {(!Array.isArray(trophies) || trophies.length < 2) && (
            <Image
              source={require('@assets/cobweb.png')} // your cobweb asset
              style={{
                //flip horizontally
                transform: [{ scaleX: -1 }],
                position: 'absolute',
                top: 242,
                right: 12,
                width: 64,
                height: 64,
                zIndex: 5,
                opacity: 0.6, // subtle effect
              }}
              resizeMode="contain"
            />
          )}
          {/* Touchable Plaque */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={closeDoorIfOpen}
            style={{
              marginBottom: 16,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: '#fde68a',
              paddingVertical: 6,
              paddingHorizontal: 12,
            }}>
            <Text className="font-saira-semibold" style={[styles.title, { fontSize: 24 }]}>
              🏆 Trophy Cabinet 🏆
            </Text>
          </TouchableOpacity>

          <View style={styles.shelfContainer}>
            {/* Top shelf */}
            <View style={[styles.shelfBase, { width: shelfWidth }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap }}>
                {shelf1.map((trophy) => (
                  <TouchableOpacity
                    key={trophy.id}
                    style={styles.trophyCard}
                    onPress={() => openModal(trophy)}>
                    <Image source={trophy.image} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Bottom shelf */}
            <View style={[styles.shelfBase, { width: shelfWidth }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap }}>
                {shelf2.map((trophy) => (
                  <TouchableOpacity
                    key={trophy.id}
                    style={styles.trophyCard}
                    onPress={() => openModal(trophy)}>
                    <Image source={trophy.image} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Glass overlay with tap to toggle */}
        <TouchableWithoutFeedback onPress={toggleDoor}>
          <Animated.View
            style={[
              styles.simpleGlassOverlay,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}>
          <View style={styles.modalOverlay}>
            <View
              className="overflow-hidden rounded-xl bg-bg-grouped-2 p-1"
              style={styles.modalContent}>
              {/* Close button */}
              <TouchableOpacity
                onPress={closeModal}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  borderRadius: 14,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <IonIcons name="close" size={30} color="#fff" />
              </TouchableOpacity>

              <View
                style={styles.trophyBackground}
                className="w-full items-end border-b border-theme-gray-4 bg-bg-2">
                {selectedTrophy && (
                  <Image
                    source={selectedTrophy.image}
                    style={styles.modalImage}
                    resizeMode="contain"
                    className="my-8"
                  />
                )}
              </View>

              <View className="flex w-full flex-row py-4 pl-4">
                {/* your existing content */}
                <View className="flex flex-1 flex-col gap-4">
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">DISTRICT</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {selectedTrophy?.district_name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">SEASON</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {selectedTrophy?.season_name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">SEASON START</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {new Date(selectedTrophy?.season_start).toLocaleDateString('en-GB') || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View className="flex flex-1 flex-col gap-4">
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">DIVISION</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {selectedTrophy?.division_name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">POSITION</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {selectedTrophy?.result === '1'
                        ? 'Winners'
                        : selectedTrophy?.result === '2'
                          ? 'Runners Up'
                          : 'N/A'}
                    </Text>
                  </View>
                  <View className="flex w-full flex-col gap-1">
                    <Text className="font-saira text-lg text-text-2">SEASON END</Text>
                    <Text className="font-saira-semibold text-xl text-text-1">
                      {new Date(selectedTrophy?.season_end).toLocaleDateString('en-GB') || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default TrophyCabinet;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  woodFrameWrapper: {
    position: 'relative',
  },
  woodFrame: {
    borderRadius: 16,
    borderWidth: 8,
    borderColor: '#5a3c2d',
    backgroundColor: '#3a2415',
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    overflow: 'hidden',
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  shelfContainer: {
    flexDirection: 'column',
    gap: 24,
  },
  shelfBase: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    backgroundColor: '#5a3c2d',
    height: 140,
    borderRadius: 8,
    gap: 8,
    paddingHorizontal: 8,
  },
  trophyCard: {
    height: 120,
    width: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: 10,
  },
  image: {
    width: 80,
    height: 120,
  },
  simpleGlassOverlay: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    color: '#4b4b4b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // dark transparent background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: '90%',
    width: '100%',
    // optional shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // optional elevation for Android
    elevation: 5,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  trophyBackground: {
    width: '100%',
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
});
