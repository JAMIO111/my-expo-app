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
import CTAButton from '@components/CTAButton';

const TrophyCabinet = ({ trophies }) => {
  const screenWidth = Dimensions.get('window').width;
  const shelf1 = trophies.filter((_, i) => i % 2 === 0);
  const shelf2 = trophies.filter((_, i) => i % 2 !== 0);

  const maxCount = Math.max(shelf1.length, shelf2.length);
  const trophyWidth = 100;
  const gap = 8;

  const totalTrophyWidth = maxCount * trophyWidth + (maxCount - 1) * gap;
  const minShelfWidth = screenWidth - 62;
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
        <View style={styles.woodFrame}>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ ...styles.scrollContainer, minWidth: screenWidth }}>
            <View style={styles.shelfContainer}>
              <View style={[styles.shelfBase, { width: shelfWidth }]}>
                {shelf1.map((trophy) => (
                  <TouchableOpacity
                    key={trophy.id}
                    style={styles.trophyCard}
                    onPress={() => openModal(trophy)}>
                    <Image source={trophy.image} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.shelfBase, { width: shelfWidth }]}>
                {shelf2.map((trophy) => (
                  <TouchableOpacity
                    key={trophy.id}
                    style={styles.trophyCard}
                    onPress={() => openModal(trophy)}>
                    <Image source={trophy.image} style={styles.image} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
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
              className="border border-theme-gray-5 bg-bg-grouped-2"
              style={styles.modalContent}>
              <View className="mb-8 w-full">
                <Text className="w-full rounded-xl bg-theme-gray-3 p-2 text-center font-saira-semibold text-lg text-text-1">
                  {selectedTrophy?.description || 'Super League Winners 2023'}
                </Text>
              </View>
              {selectedTrophy && (
                <Image
                  source={selectedTrophy.image}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              <View className="mt-16 w-full">
                <CTAButton text="Dismiss" type="success" callbackFn={closeModal} />
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
    marginBottom: 32,
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
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    // optional shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // optional elevation for Android
    elevation: 5,
  },
});
