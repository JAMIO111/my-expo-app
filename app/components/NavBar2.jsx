import { View, Text, Animated, Pressable } from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import {
  TeamIcon,
  ChartIcon,
  TrophyIcon,
  UserIcon,
  DiamondIcon,
  SearchIcon,
} from '@components/svgs';
import { useUser } from '@contexts/UserProvider';

const NavBar = ({ type = 'main' }) => {
  const { currentRole } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  console.log(pathname, 'Current Pathname');

  const NAV_ITEMS = [
    {
      name: `My ${currentRole?.type === 'admin' ? 'League' : 'Team'}`,
      href: `/${currentRole?.type === 'admin' ? 'my-leagues' : 'teams'}`,
      icon: TeamIcon,
    },
    { name: 'Comps', href: '/competitions', icon: TrophyIcon },
    { name: 'Home', href: '/home' }, // Center item — spinner
    { name: 'Rankings', href: '/rankings', icon: ChartIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const ONBOARDING_NAV_ITEMS = [
    { name: 'My Team', href: '/onboarding/my-team', icon: TeamIcon },
    { name: 'Upgrade', href: '/onboarding/upgrade', icon: DiamondIcon },
    { name: 'Season', href: '/onboarding/season' },
    { name: 'Explore', href: '/onboarding/explore', icon: SearchIcon },
    { name: 'Profile', href: '/onboarding/profile', icon: UserIcon },
  ];

  const ACTIVE_NAV_ITEMS = type === 'onboarding' ? ONBOARDING_NAV_ITEMS : NAV_ITEMS;

  const leftItems = ACTIVE_NAV_ITEMS.slice(0, 2);
  const centerItem = ACTIVE_NAV_ITEMS[2];
  const rightItems = ACTIVE_NAV_ITEMS.slice(3);

  const spinValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const scaleValues = useRef(NAV_ITEMS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (pathname === '/home' || pathname === '/onboarding/season') {
      // On /home: fade in and spin
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // On other routes: only fade in (no spin)
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [opacityValue, spinValue, pathname]);

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
    <View className={`relative h-28 w-full flex-row items-center justify-around bg-brand pt-11`}>
      {/* Decorative top bar */}
      <View className="absolute top-0 h-6 w-full flex-row items-center justify-around bg-red-950">
        {[...Array(4)].map((_, i) => (
          <View key={i} className="h-1.5 w-1.5 rounded-full bg-gray-500" />
        ))}
      </View>

      <View className="absolute top-6 h-4 w-full bg-brand-light" />

      {/* LEFT SIDE */}
      <View className="flex-1 flex-row items-center justify-evenly gap-3 pl-2">
        {leftItems.map(({ name, href, icon: Icon }, index) => {
          const isActive = pathname === href;

          return (
            <Pressable
              key={href}
              onPress={() => !isActive && router.replace(href)}
              className="flex-1 items-center">
              <Animated.View style={{ transform: [{ scale: scaleValues[index] }] }}>
                <Icon width={28} height={28} color="white" strokeWidth={isActive ? 2 : 1} />
              </Animated.View>
              <Text className="font-saira text-white">{name}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* CENTER BUTTON SPACE (fixed position) */}
      <View style={{ paddingBottom: 70 }} className="h-40 w-20 items-center justify-center">
        <Pressable
          onPress={() => {
            if (pathname !== centerItem.href) {
              router.replace(centerItem.href);
            }
          }}
          onPressIn={() => scaleDown(2)}
          onPressOut={() => scaleUp(2)}
          className="h-16 w-16 items-center justify-center rounded-full bg-black shadow-lg">
          <Animated.View
            style={{
              opacity: opacityValue,
              transform: [{ rotate: spinInterpolate }, { scale: scaleValues[2] }],
            }}
            className="h-8 w-8 items-center justify-center rounded-full bg-white">
            <Text className="text-2xl text-black">8</Text>
          </Animated.View>
        </Pressable>

        <Text className="font-saira text-white">{centerItem.name}</Text>
      </View>

      {/* RIGHT SIDE */}
      <View className="flex-1 flex-row items-center justify-evenly gap-3 pr-2">
        {rightItems.map(({ name, href, icon: Icon }, i) => {
          const realIndex = i + 3;
          const isActive = pathname === href;

          return (
            <Pressable
              key={href}
              onPress={() => !isActive && router.replace(href)}
              className="flex-1 items-center">
              <Animated.View style={{ transform: [{ scale: scaleValues[realIndex] }] }}>
                <Icon width={28} height={28} color="white" strokeWidth={isActive ? 2 : 1} />
              </Animated.View>
              <Text className="font-saira text-white">{name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default NavBar;
