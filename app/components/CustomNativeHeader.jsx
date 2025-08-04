import { View, Text, Pressable } from 'react-native';
import { useNavigationState } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function CustomNativeHeader({ navigation, options }) {
  const nav = useNavigation();
  const routes = useNavigationState((state) => state.routes);

  const previousRoute = routes[routes.length - 2];
  const previousTitle =
    previousRoute?.name?.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) ??
    'Back';

  return (
    <View
      className="bg-brand"
      style={{
        paddingHorizontal: 8,
        justifyContent: 'center',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 40,
        }}>
        {/* Left: Back button */}
        <View style={{ minWidth: 80 }}>
          <Pressable
            onPress={() => nav.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-back-outline" size={24} color="white" />
            <Text style={{ fontSize: 16, color: 'white' }}>{previousTitle}</Text>
          </Pressable>
        </View>

        {/* Center: Title */}
        <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
            }}>
            {options.title}
          </Text>
        </View>

        {/* Right: Spacer for symmetry */}
        <View style={{ minWidth: 80 }} />
      </View>
    </View>
  );
}
