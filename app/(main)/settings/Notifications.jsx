import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ExpoNotifications from 'expo-notifications';
import { BellOff } from 'lucide-react-native';
import MenuContainer from '@components/MenuContainer';
import SafeViewWrapper from '@components/SafeViewWrapper';
import CustomHeader from '@components/CustomHeader';
import CTAButton from '@components/CTAButton';
import { useUser } from '@contexts/UserProvider';
import { useTheme } from '@contexts/ThemeProvider';
import {
  useNotificationPreferences,
  useSetNotificationPreference,
} from '@hooks/useNotificationPreferences';
import { syncPushToken } from '@/lib/pushNotifications';

// Shown when this device can't receive pushes. Category switches below still
// save; they just won't reach this phone until the OS permission is granted.
const PushPermissionBanner = ({ playerId }) => {
  const { colors: themeColors } = useTheme();
  const [permission, setPermission] = useState(null);

  const refresh = useCallback(async () => {
    const result = await ExpoNotifications.getPermissionsAsync();
    setPermission({ granted: result.granted, canAskAgain: result.canAskAgain });
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  if (!permission || permission.granted) return null;

  const handlePress = async () => {
    if (permission.canAskAgain) {
      const result = await ExpoNotifications.requestPermissionsAsync();
      if (result.granted && playerId) await syncPushToken(playerId);
      await refresh();
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View className="mb-8 gap-3 rounded-3xl border border-theme-gray-5 bg-bg-grouped-2 p-4">
      <View className="flex-row items-center gap-3">
        <BellOff size={24} color={themeColors.icon} />
        <Text className="flex-1 font-saira-semibold text-lg text-text-1">
          Push notifications are off on this device
        </Text>
      </View>
      <Text className="font-saira text-base text-text-2">
        Turn them on to get the alerts you choose below. In-app notifications work either way.
      </Text>
      <CTAButton
        type="yellow"
        textColor="black"
        text={permission.canAskAgain ? 'Turn on push notifications' : 'Open device settings'}
        callbackFn={handlePress}
      />
    </View>
  );
};

const ChannelToggle = ({ label, value, locked, onValueChange }) => (
  <View className="flex-row items-center gap-2">
    <Text className="font-saira-medium text-base text-text-2">{label}</Text>
    <Switch
      value={value}
      disabled={locked}
      onValueChange={onValueChange}
      thumbColor="white"
      trackColor={{ false: 'gray', true: '#4CAF50' }}
      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
    />
  </View>
);

// w-full matters: MenuContainer centres its children, so a row without an
// explicit width shrinks to its content.
const PreferenceRow = ({ item, isLast, onChange }) => (
  <View className="w-full">
    <View className="w-full gap-2 bg-bg-grouped-2 px-4 py-3">
      <View className="flex-row items-center gap-3">
        <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
        <View className="flex-1">
          <Text className="font-saira-medium text-lg text-text-1">{item.label}</Text>
          <Text className="font-saira text-sm text-text-2">{item.description}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-6 pl-10">
        <ChannelToggle
          label="In-app"
          value={item.in_app}
          locked={item.locked_in_app}
          onValueChange={(enabled) => onChange(item.key, 'in_app', enabled)}
        />
        <ChannelToggle
          label="Push"
          value={item.push}
          locked={item.locked_push}
          onValueChange={(enabled) => onChange(item.key, 'push', enabled)}
        />
      </View>
    </View>
    {!isLast && <View className="h-[0.5px] w-full bg-separator" style={{ marginLeft: 16 }} />}
  </View>
);

const Notifications = () => {
  const { colors: themeColors } = useTheme();
  const { player } = useUser();
  const { data: preferences, isLoading, isError, refetch } = useNotificationPreferences(player?.id);
  const { mutate: setPreference } = useSetNotificationPreference(player?.id);

  // Keep the catalog's order, grouped under its section headings.
  const sections = useMemo(() => {
    const grouped = [];
    (preferences ?? []).forEach((item) => {
      let section = grouped.find((s) => s.title === item.section);
      if (!section) {
        section = { title: item.section, items: [] };
        grouped.push(section);
      }
      section.items.push(item);
    });
    return grouped;
  }, [preferences]);

  const handleChange = (category, channel, enabled) =>
    setPreference({ category, channel, enabled });

  return (
    <SafeViewWrapper topColor="bg-brand" useBottomInset={false}>
      <Stack.Screen
        options={{
          header: () => (
            <SafeViewWrapper useBottomInset={false}>
              <CustomHeader title="Notifications" />
            </SafeViewWrapper>
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }}
        className="mt-16 flex-1 bg-bg-grouped-1 p-5">
        <PushPermissionBanner playerId={player?.id} />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={themeColors.primaryText} />
          </View>
        ) : isError ? (
          <Pressable onPress={() => refetch()} className="rounded-2xl bg-theme-red/15 px-4 py-3">
            <Text className="font-saira-medium text-base text-theme-red">
              Couldn't load your notification settings. Tap to retry.
            </Text>
          </Pressable>
        ) : (
          <>
            {sections.map((section) => (
              <MenuContainer key={section.title} title={section.title}>
                {section.items.map((item, index) => (
                  <PreferenceRow
                    key={item.key}
                    item={item}
                    isLast={index === section.items.length - 1}
                    onChange={handleChange}
                  />
                ))}
              </MenuContainer>
            ))}
            <Text className="px-2 font-saira text-sm text-text-2">
              In-app notifications appear in your notification centre inside Break Room. Push
              notifications are sent to your devices. Important account notifications can't be
              turned off.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeViewWrapper>
  );
};

export default Notifications;
