import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import GradientBall from './GradientBall'; // adjust this import path to where your GradientBall component is

const NAV_ITEMS = [
  { name: 'My Team', href: '/teams', icon: 'people-outline' },
  { name: 'Fixtures', href: '/fixtures', icon: 'calendar-outline' },
  { name: 'Home', href: '/home', icon: 'home' },
  { name: 'League', href: '/league', icon: 'trophy-outline' },
  { name: 'Results', href: '/results', icon: 'list' },
];

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="bg-brand border-border-color relative h-28 w-full flex-row items-center justify-around border-t">
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.href;
        const isCenter = index === 2;

        if (isCenter) {
          return (
            <View key={item.href} className="absolute -top-6 h-28 items-center justify-between">
              <TouchableOpacity
                onPress={() => {
                  if (pathname !== item.href) {
                    router.replace(`/(main)${item.href}`);
                  }
                }}
                key={item.href}
                className=" h-20 w-20 items-center justify-center rounded-full bg-black pb-3 shadow-lg"
                style={{ alignSelf: 'center' }}>
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                  <Text className="text-4xl text-black">8</Text>
                </View>
              </TouchableOpacity>
              <Text className="font-semibold text-white" style={{ marginTop: 0 }}>
                {item.name}
              </Text>
            </View>
          );
        }

        return (
          <View key={item.href} className="h-24 items-center justify-center">
            <TouchableOpacity
              onPress={() => {
                if (pathname !== item.href) {
                  router.replace(`/(main)${item.href}`);
                }
              }}
              key={item.href}
              className={`${index === 1 && 'mr-10'} ${index === 3 && 'ml-10'} h-full flex-1 items-center justify-center`}>
              <GradientBall color={isActive ? '#ffbf00' : '#FF2919'} size={56}>
                <Ionicons name={item.icon} size={22} color={isActive ? 'black' : 'white'} />
              </GradientBall>
            </TouchableOpacity>
            <Text
              className={`${index === 1 && 'mr-10'} ${index === 3 && 'ml-10'} text-sm font-semibold text-white`}
              style={{ marginTop: 0 }}>
              {item.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default NavBar;
