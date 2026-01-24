import React, { useRef, useEffect, useState, memo } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated, Easing } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const AnimatedSearchBar = memo(({ searchActive, setSearchActive, onDebouncedChange }) => {
  const [localQuery, setLocalQuery] = useState('');
  const searchInputRef = useRef(null);
  const debounceTimeout = useRef(null);

  const handleChangeText = (text) => {
    setLocalQuery(text);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      onDebouncedChange(text); // call parent after 500ms
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  // Cancel button animation
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

  const handleFocus = () => setSearchActive(true);

  const handleCancel = () => {
    setSearchActive(false);
    setLocalQuery('');
    onDebouncedChange(''); // clear parent
    searchInputRef.current?.blur();
  };

  return (
    <View className="h-20 w-full flex-row items-center bg-brand px-3">
      <View className="flex-1 flex-row items-center rounded-xl bg-bg-grouped-2 px-3">
        <Ionicons name="search" size={20} color="#ccc" />
        <TextInput
          ref={searchInputRef}
          placeholder="Search for teams..."
          value={localQuery}
          onChangeText={handleChangeText}
          clearButtonMode="while-editing"
          className="h-12 flex-1 pl-3 font-saira text-lg text-text-1 placeholder:text-text-3"
          onFocus={handleFocus}
        />
      </View>

      {searchActive && (
        <Animated.View
          style={{
            opacity: cancelOpacity,
            transform: [{ translateX: cancelTranslate }],
            marginLeft: 10,
          }}>
          <TouchableOpacity onPress={handleCancel}>
            <Text className="pr-2 text-lg text-white">Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
});

export default AnimatedSearchBar;
