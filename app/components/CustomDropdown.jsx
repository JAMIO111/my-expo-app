import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  Keyboard,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const SHEET_HEIGHT = 480;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ─── Option row ─────────────────────────────────────────────── */
const OptionRow = ({ item, isSelected, onPress, index }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`mb-1.5 flex-row items-center rounded-xl border-2 px-4 py-3 shadow-sm ${
          isSelected ? 'border-brand bg-bg-2' : 'border-transparent bg-bg-2'
        }`}>
        <View className="flex-1">
          <Text
            className={`text-xl ${
              isSelected ? 'font-saira-semibold text-brand' : 'font-saira-medium text-text-1'
            }`}>
            {item.label}
          </Text>
          {item.subLabel && <Text className="font-saira-medium text-text-2">{item.subLabel}</Text>}
        </View>

        {/* Checkmark circle */}
        <View
          className={`h-8 w-8 items-center justify-center rounded-full ${
            isSelected ? 'bg-brand' : 'border border-theme-gray-3 bg-transparent'
          }`}>
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ─── Main component ─────────────────────────────────────────── */
const CustomDropdown = ({
  title,
  titleColor = 'text-text-on-brand',
  placeholder = 'Select option',
  value,
  options = [],
  onChange,
  leftIconName,
  leftIconSize = 24,
  iconColor = '#9CA3AF',
  disabled = false,
  searchable = true,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const slideY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const triggerScale = useRef(new Animated.Value(1)).current;

  const selectedLabel = options.find((o) => o.value === value)?.label;
  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.subLabel?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const openSheet = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        damping: 20,
        mass: 0.8,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: SHEET_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setQuery('');
    });
  }, []);

  const handleSelect = (itemValue) => {
    onChange(itemValue === value ? null : itemValue);
    closeSheet();
  };

  return (
    <View>
      {/* Label */}
      {title && (
        <Text className={`pb-1 pl-2 font-saira-medium text-xl ${titleColor}`}>{title}</Text>
      )}

      {/* Trigger */}
      <AnimatedPressable
        disabled={disabled}
        onPress={openSheet}
        onPressIn={() =>
          Animated.spring(triggerScale, { toValue: 0.98, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(triggerScale, { toValue: 1, useNativeDriver: true }).start()
        }
        style={{ transform: [{ scale: triggerScale }] }}
        className={`h-14 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background pr-3 ${
          disabled ? 'opacity-50' : ''
        }`}>
        {/* Icon pill */}
        <View className="h-full justify-center rounded-l-xl border-r border-theme-gray-3 bg-bg-grouped-1 pl-3 pr-4">
          <Ionicons name={leftIconName} size={leftIconSize} color={iconColor} />
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className={`flex-1 pl-3 pr-2 font-saira text-xl ${
            value ? 'font-saira-medium text-text-1' : 'text-gray-400'
          }`}>
          {selectedLabel ?? placeholder}
        </Text>

        {/* Clear button when value is selected */}
        {value && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="mr-2">
            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </AnimatedPressable>

      {/* Bottom Sheet Modal */}
      <Modal transparent visible={open} onRequestClose={closeSheet} statusBarTranslucent>
        <AnimatedPressable
          onPress={closeSheet}
          style={{ opacity: backdropOpacity }}
          className="flex-1 justify-end bg-black/60">
          <Animated.View
            style={{ transform: [{ translateY: slideY }], maxHeight: SHEET_HEIGHT }}
            className="overflow-hidden rounded-t-3xl border border-b-0 border-theme-gray-3 bg-bg-1">
            {/* Stop tap-through to backdrop */}
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Handle bar */}
              <View className="items-center pb-1 pt-3">
                <View className="h-1 w-9 rounded-full bg-theme-gray-3" />
              </View>

              {/* Header */}
              <View className="flex-row items-center border-b border-theme-gray-3 px-5 py-3">
                <Text className="flex-1 font-saira-medium text-xl text-text-1">
                  {title || 'Choose an option'}
                </Text>
                <TouchableOpacity
                  onPress={closeSheet}
                  className="h-8 w-8 items-center justify-center rounded-full bg-bg-grouped-1">
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Search bar — only shown when searchable and enough options */}
              {searchable && options.length > 4 && (
                <View className="mx-3 mb-1 mt-3 h-12 flex-row items-center rounded-xl border border-theme-gray-3 bg-input-background px-3">
                  <Ionicons name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search…"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 font-saira text-base text-text-1"
                    autoCorrect={false}
                  />
                  {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Pressable>

            {/* Option list */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ padding: 12, paddingBottom: 64, gap: 6 }}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Ionicons name="search-outline" size={30} color="#9CA3AF" />
                  <Text className="mt-2 font-saira text-base text-text-2">
                    No results for "{query}"
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <OptionRow
                  item={item}
                  index={index}
                  isSelected={item.value === value}
                  onPress={() => handleSelect(item.value)}
                />
              )}
            />
          </Animated.View>
        </AnimatedPressable>
      </Modal>
    </View>
  );
};

export default CustomDropdown;
