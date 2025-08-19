import { View, Text, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomHeader({
  title,
  showBack = true,
  onRightPress,
  rightIcon = 'ellipsis-vertical',
  backgroundColor = 'bg-brand',
}) {
  const router = useRouter();
  const segments = useSegments();
  const isFocused = useIsFocused();

  const filteredSegments = segments.filter((s) => !(s.startsWith('(') && s.endsWith(')')));

  const canGoBack = filteredSegments.length > 1 && isFocused;

  // Define fixed width for side containers
  const sideWidth = 48; // or any fixed size matching your buttons

  return (
    <View className={`h-16 flex-row items-center px-4 ${backgroundColor}`}>
      {/* Left container: fixed width */}
      <View style={{ width: sideWidth }}>
        {showBack ? (
          <TouchableOpacity
            className="h-12 w-12 rounded-full bg-black p-3"
            onPress={() => router.back()}>
            <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <Ionicons name="arrow-back" size={20} color="black" />
            </View>
          </TouchableOpacity>
        ) : (
          // Invisible placeholder keeps space when no button
          <View style={{ width: 24, height: 24, opacity: 0 }} />
        )}
      </View>

      {/* Title container: flex-1 to take remaining space and centered */}
      <View className="flex-1 items-center">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit={true}
          style={{ fontSize: 26 }}
          className="font-saira text-white">
          {title}
        </Text>
      </View>

      {/* Right container: fixed width */}
      <View style={{ width: sideWidth, alignItems: 'flex-end' }}>
        {onRightPress ? (
          <TouchableOpacity
            className="rounded-full bg-white p-3"
            onPress={() => {
              onRightPress();
            }}>
            <View className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <Ionicons name={rightIcon} size={22} color="black" />
            </View>
          </TouchableOpacity>
        ) : (
          // Invisible placeholder keeps space when no button
          <View style={{ width: 24, height: 24, opacity: 0 }} />
        )}
      </View>
    </View>
  );
}
