import { Pressable, Text, View, Linking } from 'react-native';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import Avatar from './Avatar';
import {
  User,
  Users,
  Bell,
  CircleQuestionMark,
  Info,
  IdCard,
  KeyRound,
  ChevronRight,
  ExternalLink,
  FileText,
  Eye,
  LogOut,
  MessageCircleQuestionMark,
  Trash,
  Wallet,
  CalendarCog,
  Scale,
  UserCog,
  RefreshCw,
  Save,
  ImagePlus,
  Image,
  Hexagon,
  Trees,
  Building2,
  Mailbox,
  MapPin,
  RectangleEllipsis,
  UserPen,
} from 'lucide-react-native';

export const iconMap = {
  user: User,
  userCog: UserCog,
  users: Users,
  imagePlus: ImagePlus,
  bell: Bell,
  question: CircleQuestionMark,
  info: Info,
  idCard: IdCard,
  keyRound: KeyRound,
  fileText: FileText,
  save: Save,
  eye: Eye,
  logout: LogOut,
  messageCircleQuestionMark: MessageCircleQuestionMark,
  trash: Trash,
  wallet: Wallet,
  calendarCog: CalendarCog,
  scale: Scale,
  refresh: RefreshCw,
  image: Image,
  hexagon: Hexagon,
  trees: Trees,
  building2: Building2,
  mailbox: Mailbox,
  mapPin: MapPin,
  rectangleEllipsis: RectangleEllipsis,
  userPen: UserPen,
};

const SettingsItem = ({
  title,
  titleColor,
  icon,
  text,
  textColor,
  routerPath,
  iconColor = '#333',
  disabled = false,
  callbackFn,
  player,
  link,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme];
  const router = useRouter();
  const hasNavigated = useRef(false);

  const Icon = icon ? iconMap[icon] : null;

  const handlePress = () => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    setTimeout(() => {
      hasNavigated.current = false;
    }, 750); // Reset navigation state after 750ms
    if (routerPath) {
      router.push(routerPath);
    } else if (link) {
      Linking.openURL(link);
    }
  };

  return (
    <Pressable
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      disabled={disabled}
      onPress={routerPath || link ? handlePress : callbackFn}
      className="w-full">
      {({ pressed }) => (
        <View className="w-full">
          <View
            className={`flex-row items-center gap-3 px-4 py-4 ${
              pressed ? 'bg-theme-gray-5' : 'bg-bg-grouped-2'
            }`}>
            {Icon ? (
              <Icon size={24} color={iconColor} strokeWidth={2} />
            ) : player ? (
              <Avatar size={40} player={player} />
            ) : null}

            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ flexShrink: 0 }}
              className={`${text ? '' : 'flex-1'} pl-2 text-lg font-medium ${titleColor ? titleColor : 'text-text-1'}`}>
              {title}
            </Text>

            {text && (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                adjustsFontSizeToFit={true}
                className={`text ml-2 flex-1 text-right text-lg ${textColor ? textColor : 'text-text-2'}`}>
                {text}
              </Text>
            )}

            {routerPath && <ChevronRight size={18} color={themeColors?.icon} />}
            {link && <ExternalLink size={24} color="#444" />}
          </View>
        </View>
      )}
    </Pressable>
  );
};

export default SettingsItem;
