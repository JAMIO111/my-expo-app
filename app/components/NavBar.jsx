import { View, Text, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import GradientBall from './GradientBall'; // adjust if needed

const NAV_ITEMS = [
  { name: 'My Team', href: '/teams', icon: 'people-outline', activeIcon: 'people' },
  { name: 'Fixtures', href: '/fixtures', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'Home', href: '/home', icon: 'home' },
  {
    name: 'Rankings',
    href: '/rankings',
    icon: 'bar-chart-outline',
    activeIcon: 'bar-chart',
  },
  { name: 'Settings', href: '/settings', icon: 'settings-outline', activeIcon: 'settings' },
];

const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValues = useRef(NAV_ITEMS.map(() => new Animated.Value(1))).current;

  const spin = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const scaleDown = (index) => {
    Animated.timing(scaleValues[index], {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const scaleUp = (index) => {
    Animated.spring(scaleValues[index], {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const spinInterpolate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      className={`relative h-28 w-full flex-row items-center justify-around border-t border-brand-light bg-brand`}>
      {NAV_ITEMS.map((item, index) => {
        const isActive = pathname === item.href;
        const isCenter = index === 2;

        const handleNavigate = () => {
          if (isCenter) spin();
          if (!isActive) {
            router.replace(item.href, { reset: true });
          }
        };

        const pressableProps = {
          onPressIn: () => scaleDown(index),
          onPressOut: () => {
            scaleUp(index);
            handleNavigate();
          },
          disabled: isActive,
        };

        if (isCenter) {
          return (
            <View key={item.href} className="absolute -top-6 h-28 items-center justify-between">
              <Pressable
                {...pressableProps}
                className="h-20 w-20 items-center justify-center rounded-full bg-black pb-3 shadow-lg"
                style={{ alignSelf: 'center' }}>
                <Animated.View
                  style={{
                    transform: [{ rotate: spinInterpolate }, { scale: scaleValues[index] }],
                  }}
                  className="h-10 w-10 items-center justify-center rounded-full bg-white">
                  <Text className="text-4xl text-black">8</Text>
                </Animated.View>
              </Pressable>
              <Text className="font-semibold text-white">{item.name}</Text>
            </View>
          );
        }

        return (
          <View key={item.href} className="h-24 items-center justify-center">
            <Pressable
              {...pressableProps}
              className={`${index === 1 && 'mr-10'} ${index === 3 && 'ml-10'} h-full flex-1 items-center justify-center`}>
              <Animated.View style={{ transform: [{ scale: scaleValues[index] }] }}>
                <GradientBall color={isActive ? '#ffbf00' : '#FF2919'} size={56}>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={22}
                    color={isActive ? 'black' : 'white'}
                  />
                </GradientBall>
              </Animated.View>
            </Pressable>
            <Text
              className={`${index === 1 && 'mr-10'} ${index === 3 && 'ml-10'} text-sm font-semibold text-white`}>
              {item.name}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default NavBar;
