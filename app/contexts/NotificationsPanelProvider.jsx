import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mail,
  MailX,
  MailCheck,
  UserPlus,
  UserMinus,
  Trophy,
  Info,
  Award,
  PanelRightClose,
  BellOff,
  ClipboardClock,
  AlarmClockCheck,
  UserStar,
  MailMinus,
} from 'lucide-react-native';
import { useNotifications } from '@hooks/useNotifications';
import { useUser } from '@contexts/UserProvider';
import SafeViewWrapper from '@components/SafeViewWrapper';
import { supabase } from '@lib/supabase';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PANEL_WIDTH = SCREEN_WIDTH;

// ─── Context ──────────────────────────────────────────────────────────────────

const NotificationsPanelContext = createContext(null);

// ─── Icon map ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  team_invite: { icon: Mail, color: '#000ac4' },
  invite_revoked: { icon: MailMinus, color: '#f52c2c' },
  player_joined: { icon: UserPlus, color: '#0c7f23' },
  player_left_team: { icon: UserMinus, color: '#f52c2c' },
  result: { icon: Trophy, color: '#FCD34D' },
  system: { icon: Info, color: '#000ac4' },
  award: { icon: Award, color: '#F9A8D4' },
  request_rejected: { icon: MailX, color: '#f52c2c' },
  request_accepted: { icon: MailCheck, color: '#0c7f23' },
  match_reminder: { icon: AlarmClockCheck, color: '#e8850c' },
  result_submission_pending: { icon: ClipboardClock, color: '#e8850c' },
  result_approval_pending: { icon: ClipboardClock, color: '#e8850c' },
  result_amendment_pending: { icon: ClipboardClock, color: '#e8850c' },
  role_change: { icon: UserStar, color: '#000ac4' },
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

function NotificationRow({ item, onPress, onMarkAsRead, onMarkAsUnread }) {
  const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system;
  const Icon = cfg.icon;

  return (
    <Pressable
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      className={`mx-3 flex-row items-start justify-center rounded-2xl ${item?.read ? 'bg-bg-1' : 'border border-theme-blue/50  bg-theme-blue/5'} px-4 py-3`}>
      {/* Unread dot + icon */}
      <View className="mr-3 mt-1 items-center justify-center">
        {!item.read && (
          <View className="absolute -left-6 -top-6 z-10 rounded-full bg-bg-2 p-1">
            <View className="h-3 w-3 rounded-full bg-red-500" />
          </View>
        )}
        <View
          className="h-10 w-10 items-center justify-center"
          style={{
            backgroundColor: cfg.color + '11',
            borderColor: cfg.color + '88',
            borderWidth: 1,
            borderRadius: 8,
          }}>
          <Icon size={22} color={cfg.color} />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="mb-0.5 flex-row items-center justify-between">
          <Text
            className="mr-2 flex-1 text-sm font-semibold text-text-1"
            style={{ fontFamily: 'Tektur_600SemiBold' }}
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            className={`text-xs ${item?.read ? 'text-text-2' : 'text-theme-blue'}`}
            style={{ fontFamily: 'Tektur_400Regular' }}>
            {timeAgo(item.created_at)}
          </Text>
        </View>

        <Text className="text-sm leading-5 text-text-2" style={{ fontFamily: 'Tektur_400Regular' }}>
          {item.message}
        </Text>

        <View className="flex-row justify-start gap-3 pt-2">
          <Pressable
            onPress={() => (item?.read ? onMarkAsUnread(item) : onMarkAsRead(item))}
            className="mt-2 w-32 rounded-lg bg-theme-blue/10 px-2 py-2">
            <Text
              className="text-center text-sm text-theme-blue"
              style={{ fontFamily: 'Tektur_500Medium' }}>
              {item?.read ? 'Mark as unread' : 'Mark as read'}
            </Text>
          </Pressable>
          {item?.data && (
            <Pressable
              onPress={() => onPress(item)}
              className="mt-2 w-32 rounded-lg bg-theme-blue/10 px-2 py-2">
              <Text
                className="text-center text-sm text-theme-blue"
                style={{ fontFamily: 'Tektur_500Medium' }}>
                {item?.data?.button_text || 'View Details'}
              </Text>
            </Pressable>
          )}
        </View>

        {item.meta?.competitionName && (
          <View className="bg-brand/20 mt-1.5 self-start rounded-full px-2 py-0.5">
            <Text className="text-xs text-brand" style={{ fontFamily: 'Tektur_500Medium' }}>
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
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-text-1">
        <BellOff size={28} color="rgba(255,255,255,0.25)" />
      </View>
      <Text className="text-base text-text-2" style={{ fontFamily: 'Tektur_500Medium' }}>
        No notifications yet
      </Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <View className="px-4 pt-4">
      <Text
        className="text-sm uppercase tracking-widest text-text-2"
        style={{ fontFamily: 'Tektur_600SemiBold' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

function NotificationsPanelInner({
  notifications = [],
  onNotificationPress,
  onMarkAllRead,
  onMarkAsRead,
  onMarkAsUnread,
}) {
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
    return (
      <NotificationRow
        item={item}
        onPress={onNotificationPress}
        onMarkAsRead={onMarkAsRead}
        onMarkAsUnread={onMarkAsUnread}
      />
    );
  };

  return (
    <SafeViewWrapper topColor="bg-brand">
      {/* FIX 3: pointerEvents='none' when closed so the invisible backdrop
          never intercepts touches after the panel has animated away. */}
      <Animated.View
        collapsable={false}
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
        pointerEvents={isOpen ? 'auto' : 'none'}
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
          className="flex-1 bg-bg-2"
          style={{ borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.07)' }}>
          <SafeAreaView style={{ flex: 1, paddingTop: insets.top > 0 ? 0 : 12 }}>
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-6 pb-3 pt-4"
              style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl text-text-1" style={{ fontFamily: 'Tektur_700Bold' }}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-theme-red/80 shadow-sm">
                    <Text
                      className="text-sm text-white"
                      style={{ fontFamily: 'Tektur_600SemiBold' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-5">
                {unreadCount > 0 && (
                  <Pressable
                    onPress={onMarkAllRead}
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text className="text-text-2" style={{ fontFamily: 'Tektur_500Medium' }}>
                      Mark all read
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={close}
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  className="items-center justify-center rounded-full">
                  <PanelRightClose size={30} color="#666" />
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
                contentContainerStyle={{ paddingBottom: insets.bottom + 16, gap: 8 }}
                ItemSeparatorComponent={() => (
                  <View
                    className="mx-4"
                    style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.04)' }}
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
  const { player, currentRole } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // FIX 2: Keep a local copy of notifications so onNotificationPress /
  // onMarkAllRead have a setState to call. Previously they called
  // setNotifications which was never declared, causing silent throws.
  const { data: rawNotifications } = useNotifications(player?.id);
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  console.log('NotificationsPanelProvider notifications:', rawNotifications);

  // 🆕 keep the app icon badge in sync with in-app unread count
  useEffect(() => {
    Notifications.setBadgeCountAsync(unreadCount);
  }, [unreadCount]);

  // 🆕 re-sync the badge whenever the app is foregrounded, in case a push
  // arrived (with its own badge count) while the app wasn't running
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        Notifications.setBadgeCountAsync(unreadCount);
      }
    });

    return () => subscription.remove();
  }, [unreadCount]);

  useEffect(() => {
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.link) {
        close(); // dismiss the panel if it happened to be open
        const segments = data.link.split('/').filter(Boolean);
        const paths = segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));
        for (const path of paths) {
          router.push(path);
        }
      }
    });

    return () => {
      responseListener.remove();
    };
  }, [router, close]);

  useEffect(() => {
    const response = Notifications.getLastNotificationResponse();

    if (!response) return; // app wasn't opened via a notification tap

    const data = response.notification.request.content.data;
    if (data?.link) {
      const segments = data.link.split('/').filter(Boolean);
      const paths = segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));
      for (const path of paths) {
        router.push(path);
      }
    }
  }, []);

  useEffect(() => {
    if (!rawNotifications) return;
    const filtered = rawNotifications.filter(
      (n) => n.role_id === null || n.role_id === currentRole?.id
    );
    setNotifications(filtered);
  }, [rawNotifications, currentRole?.id]);

  const onNotificationPress = useCallback(
    async (notification) => {
      if (notification.data?.link) {
        close();
        const segments = notification.data.link.split('/').filter(Boolean);
        const paths = segments.map((_, i) => '/' + segments.slice(0, i + 1).join('/'));
        for (const path of paths) {
          router.push(path);
        }
      }
    },
    [router, close]
  );

  const onMarkAsUnread = useCallback(async (notification) => {
    // optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: false } : n))
    );
    const { error } = await supabase
      .from('Notifications')
      .update({ read: false, read_at: null })
      .eq('id', notification.id);
    if (error) {
      // rollback if it fails
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
    }
  }, []);

  const onMarkAsRead = useCallback(async (notification) => {
    // optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    const { error } = await supabase
      .from('Notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notification.id);
    if (error) {
      // rollback if it fails
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: false } : n))
      );
    }
  }, []);

  const onMarkAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    await supabase
      .from('Notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('player_id', player?.id);
  }, [player?.id]);

  return (
    <NotificationsPanelContext.Provider value={{ isOpen, open, close, toggle, unreadCount }}>
      <View style={{ flex: 1 }}>
        {children}
        <NotificationsPanelInner
          notifications={notifications}
          onNotificationPress={onNotificationPress}
          onMarkAllRead={onMarkAllRead}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
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
