import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@hooks/useNotifications'; // Your custom hook to fetch notifications
import { useUser } from '@contexts/UserProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.88;

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationsPanelContext = createContext(null);

// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * Notification shape:
 * {
 *   id: string
 *   type: 'invite' | 'result' | 'system' | 'award'
 *   title: string
 *   body: string
 *   timestamp: Date | string
 *   read: boolean
 *   meta?: { competitionName?: string, avatarUrl?: string }
 * }
 */

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  invite: { icon: 'people', color: '#6EE7B7' }, // green
  result: { icon: 'trophy', color: '#FCD34D' }, // amber
  system: { icon: 'information-circle', color: '#93C5FD' }, // blue
  award: { icon: 'ribbon', color: '#F9A8D4' }, // pink
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, onPress, onMarkRead }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;

  return (
    <Pressable
      onPress={() => onPress(item)}
      className="flex-row items-start px-4 py-3 active:opacity-70"
      style={({ pressed }) => pressed && { opacity: 0.7 }}>
      {/* Unread dot */}
      <View className="mr-3 mt-1 items-center justify-center">
        {!item.read && <View className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-brand" />}
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: cfg.color + '22' }}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="mb-0.5 flex-row items-center justify-between">
          <Text
            className="mr-2 flex-1 text-sm font-semibold text-white"
            style={{ fontFamily: 'Saira_600SemiBold' }}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-xs text-white/40" style={{ fontFamily: 'Saira_400Regular' }}>
            {timeAgo(item.timestamp)}
          </Text>
        </View>

        <Text
          className="text-sm leading-5 text-white/60"
          style={{ fontFamily: 'Saira_400Regular' }}
          numberOfLines={2}>
          {item.body}
        </Text>

        {item.meta?.competitionName && (
          <View className="bg-brand/20 mt-1.5 self-start rounded-full px-2 py-0.5">
            <Text className="text-xs text-brand" style={{ fontFamily: 'Saira_500Medium' }}>
              {item.meta.competitionName}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyNotifications() {
  return (
    <View className="flex-1 items-center justify-center pb-20">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/5">
        <Ionicons name="notifications-off-outline" size={28} color="rgba(255,255,255,0.25)" />
      </View>
      <Text className="text-base text-white/30" style={{ fontFamily: 'Saira_500Medium' }}>
        No notifications yet
      </Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <View className="px-4 pb-1 pt-4">
      <Text
        className="text-xs uppercase tracking-widest text-white/30"
        style={{ fontFamily: 'Saira_600SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

function NotificationsPanelInner({ notifications = [], onNotificationPress, onMarkAllRead }) {
  const insets = useSafeAreaInsets();
  const { isOpen, close } = useContext(NotificationsPanelContext);

  const translateX = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Drive animation from isOpen
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: isOpen ? 0 : PANEL_WIDTH,
        damping: 22,
        stiffness: 220,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  // Split into today vs earlier
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const today = notifications?.filter((n) => new Date(n.timestamp) >= todayStart) || [];
  const earlier = notifications?.filter((n) => new Date(n.timestamp) < todayStart) || [];

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const sections = [
    ...(today.length ? [{ type: 'header', id: 'h1', label: 'Today' }, ...today] : []),
    ...(earlier.length ? [{ type: 'header', id: 'h2', label: 'Earlier' }, ...earlier] : []),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'header') return <SectionHeader label={item.label} />;
    return <NotificationRow item={item} onPress={onNotificationPress ?? (() => {})} />;
  };

  if (!isOpen && translateX._value === PANEL_WIDTH) return null;

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            zIndex: 50,
          },
          { opacity: backdropOpacity },
        ]}>
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: PANEL_WIDTH,
            zIndex: 51,
            transform: [{ translateX }],
          },
        ]}>
        {/* Glass-style dark panel */}
        <View
          className="flex-1 bg-zinc-900"
          style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' }}>
          <SafeAreaView style={{ flex: 1, paddingTop: insets.top > 0 ? 0 : 12 }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-4 pb-3 pt-2"
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl text-white" style={{ fontFamily: 'Saira_700Bold' }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View className="rounded-full bg-brand px-2 py-0.5">
                    <Text
                      className="text-xs text-white"
                      style={{ fontFamily: 'Saira_600SemiBold' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-3">
                {unreadCount > 0 && (
                  <Pressable onPress={onMarkAllRead} className="active:opacity-60">
                    <Text className="text-sm text-brand" style={{ fontFamily: 'Saira_500Medium' }}>
                      Mark all read
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={close}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/10 active:opacity-60">
                  <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>
            </View>

            {/* List */}
            {sections.length === 0 ? (
              <EmptyNotifications />
            ) : (
              <FlatList
                data={sections}
                keyExtractor={(item) => item.id ?? item.type + item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
                ItemSeparatorComponent={() => (
                  <View
                    className="mx-4"
                    style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }}
                  />
                )}
              />
            )}
          </SafeAreaView>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsPanelProvider({ children }) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const { data: notifications } = useNotifications(user?.id); // Replace with your actual data fetching logic

  const onNotificationPress = useCallback((notification) => {
    // Mark as read locally for instant feedback
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
  }, []);

  const onMarkAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <NotificationsPanelContext.Provider value={{ isOpen, open, close, toggle }}>
      <View style={{ flex: 1 }}>
        {children}
        <NotificationsPanelInner
          notifications={notifications}
          onNotificationPress={onNotificationPress}
          onMarkAllRead={onMarkAllRead}
        />
      </View>
    </NotificationsPanelContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotificationsPanel() {
  const ctx = useContext(NotificationsPanelContext);
  if (!ctx)
    throw new Error('useNotificationsPanel() must be used inside <NotificationsPanelProvider>');
  return ctx;
}

export default NotificationsPanelProvider;
