import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, SafeAreaView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@hooks/useNotifications';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH * 0.88;

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationsPanelContext = createContext(null);

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  invite: { icon: 'people', color: '#6EE7B7' },
  result: { icon: 'trophy', color: '#FCD34D' },
  system: { icon: 'information-circle', color: '#93C5FD' },
  award: { icon: 'ribbon', color: '#F9A8D4' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Notification Row ─────────────────────────────────────────────────────────

function NotificationRow({ item, onPress }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className="mx-3 flex-row items-start rounded-xl bg-brand px-4 py-3">
      {/* Unread dot + icon */}
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
            {timeAgo(item.created_at)}
          </Text>
        </View>

        <Text
          className="text-sm leading-5 text-white/60"
          style={{ fontFamily: 'Saira_400Regular' }}
          numberOfLines={2}>
          {item.message}
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

  // FIX 1: Track mounted state separately so we never unmount mid-animation.
  // Mount immediately when opening; only unmount after the close animation
  // fully completes — prevents the invisible touch-eating frozen backdrop.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true); // ensure rendered before animating in
    }

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
    ]).start(({ finished }) => {
      // Only unmount after the close animation fully completes.
      // If interrupted (e.g. re-opened mid-close) finished=false — don't unmount.
      if (finished && !isOpen) {
        setMounted(false);
      }
    });
  }, [isOpen]);

  if (!mounted) return null;

  // Split into today vs earlier
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today = notifications.filter((n) => new Date(n.created_at) >= todayStart);
  const earlier = notifications.filter((n) => new Date(n.created_at) < todayStart);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const sections = [
    ...(today.length ? [{ type: 'header', id: 'h1', label: 'Today' }, ...today] : []),
    ...(earlier.length ? [{ type: 'header', id: 'h2', label: 'Earlier' }, ...earlier] : []),
  ];

  const renderItem = ({ item }) => {
    if (item.type === 'header') return <SectionHeader label={item.label} />;
    return <NotificationRow item={item} onPress={onNotificationPress} />;
  };

  return (
    <SafeViewWrapper topColor="bg-brand">
      {/* FIX 3: pointerEvents='none' when closed so the invisible backdrop
          never intercepts touches after the panel has animated away. */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          },
          { opacity: backdropOpacity },
        ]}>
        <Pressable style={{ flex: 1 }} onPress={close} />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: PANEL_WIDTH,
          zIndex: 51,
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
          overflow: 'hidden',
          transform: [{ translateX }],
        }}>
        <View
          className="flex-1 bg-brand-dark"
          style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' }}>
          <SafeAreaView style={{ flex: 1, paddingTop: insets.top > 0 ? 0 : 12 }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-6 pb-3 pt-4"
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
                  <Pressable
                    onPress={onMarkAllRead}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text
                      className="text-sm text-text-on-brand-2"
                      style={{ fontFamily: 'Saira_500Medium' }}>
                      Mark all read
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={close}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  className="h-8 w-8 items-center justify-center rounded-full bg-white/10">
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
                // FIX 4: safe keyExtractor — never produces undefined keys
                keyExtractor={(item, index) => item.id?.toString() ?? `item-${index}`}
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
    </SafeViewWrapper>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationsPanelProvider({ children }) {
  const { player } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // FIX 2: Keep a local copy of notifications so onNotificationPress /
  // onMarkAllRead have a setState to call. Previously they called
  // setNotifications which was never declared, causing silent throws.
  const { data: rawNotifications } = useNotifications(player?.id);
  const [notifications, setNotifications] = useState([]);

  console.log('NotificationsPanelProvider notifications:', rawNotifications);

  useEffect(() => {
    if (rawNotifications) setNotifications(rawNotifications);
  }, [rawNotifications]);

  const onNotificationPress = useCallback((notification) => {
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
