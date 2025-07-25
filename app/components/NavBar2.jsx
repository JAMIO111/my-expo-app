import { View, Text, Animated, Pressable } from 'react-native';
import { useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { TeamIcon, ChartIcon, TrophyIcon, UserIcon } from '@components/svgs';

const NAV_ITEMS = [
  { name: 'My Team', href: '/teams', icon: TeamIcon },
  { name: 'Comps', href: '/onboarding/profile-creation-team', icon: TrophyIcon },
  { name: 'Home', href: '/home' }, // Center item — spinner
  { name: 'Rankings', href: '/rankings', icon: ChartIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
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
    <View className="relative h-28 w-full flex-row items-center justify-around bg-brand pt-11">
      {/* Decorative top bar */}
      <View className="absolute top-0 h-6 w-full flex-row items-center justify-around bg-red-950">
        {[...Array(4)].map((_, i) => (
          <View key={i} className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        ))}
      </View>

      <View className="absolute top-6 h-4 w-full bg-brand-light" />

      {NAV_ITEMS.map(({ name, href, icon: Icon }, index) => {
        const isActive = pathname === href;
        const isCenter = index === 2;

        const handleNavigate = () => {
          if (isCenter) spin();
          if (!isActive && href) {
            router.replace(href);
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
            <View key={href || index} className="absolute h-20 items-center justify-between">
              <Pressable
                {...pressableProps}
                className="-top-2 h-16 w-16 items-center justify-center rounded-full bg-black pb-2 shadow-lg"
                style={{ alignSelf: 'center' }}>
                <Animated.View
                  style={{
                    transform: [{ rotate: spinInterpolate }, { scale: scaleValues[index] }],
                  }}
                  className="h-9 w-9 items-center justify-center rounded-full bg-white">
                  <Text className="text-[26px] text-black">8</Text>
                </Animated.View>
              </Pressable>
              <Text className="font-medium text-white">{name}</Text>
            </View>
          );
        }

        return (
          <View key={href} className="items-center justify-center">
            <Pressable
              {...pressableProps}
              className={`${
                index === 1 ? 'mr-10' : index === 3 ? 'ml-10' : ''
              } h-full flex-1 items-center justify-center`}>
              <Animated.View style={{ transform: [{ scale: scaleValues[index] }] }}>
                {Icon && (
                  <Icon width={28} height={28} color="white" strokeWidth={isActive ? 2 : 1} />
                )}
              </Animated.View>
              <Text className="mt-1 font-medium text-white">{name}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
};

export default NavBar;
