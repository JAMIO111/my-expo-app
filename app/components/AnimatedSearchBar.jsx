import { View, TextInput, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useEffect } from 'react';

const AnimatedSearchBar = ({ searchActive, setSearchActive, searchQuery, setSearchQuery }) => {
  const searchInputRef = useRef(null);

  // Animated value for Cancel button
  const cancelOpacity = useRef(new Animated.Value(0)).current;
  const cancelTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cancelOpacity, {
        toValue: searchActive ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cancelTranslate, {
        toValue: searchActive ? 0 : 20,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [searchActive]);

  return (
    <View className="h-20 w-full flex-row items-center bg-brand px-3">
      {/* Search input container */}
      <View className="flex-1 flex-row items-center rounded-xl bg-bg-grouped-2 px-3">
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          ref={searchInputRef}
          placeholder="Search for teams..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          className="h-12 flex-1 pl-3 font-saira text-lg text-text-1 placeholder:text-text-3"
          onFocus={() => setSearchActive(true)}
        />
      </View>

      {/* Cancel button */}
      {searchActive && (
        <Animated.View
          style={{
            opacity: cancelOpacity,
            transform: [{ translateX: cancelTranslate }],
            marginLeft: 10,
          }}>
          <TouchableOpacity
            onPress={() => {
              setSearchActive(false);
              setSearchQuery('');
              searchInputRef.current?.blur();
            }}>
            <Text className="pr-2 text-lg text-white">Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

export default AnimatedSearchBar;
