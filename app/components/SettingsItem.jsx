import { Pressable, Text, View, Linking } from 'react-native';
import { useRef } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import colors from '@lib/colors';
import Avatar from './Avatar';
import TeamLogo from './TeamLogo';
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
  EyeOff,
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
  DoorOpen,
  DoorClosed,
  CircleCheck,
  ShieldCheck,
  FolderPen,
  MapPinHouse,
  HousePlus,
  Unlink,
  Link,
  UserRoundPlus,
  AlarmClockCheck,
  ClipboardClock,
  MessagesSquare,
  UserMinus,
  UserStar,
  Star,
  UserX,
  UserCheck,
  VenusAndMars,
  Calendar,
  Handshake,
  MailQuestionMark,
  MailX,
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
  eyeOff: EyeOff,
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
  doorOpen: DoorOpen,
  doorClosed: DoorClosed,
  circleCheck: CircleCheck,
  shieldCheck: ShieldCheck,
  folderPen: FolderPen,
  mapPinHouse: MapPinHouse,
  housePlus: HousePlus,
  unlink: Unlink,
  link: Link,
  userRoundPlus: UserRoundPlus,
  alarmClockCheck: AlarmClockCheck,
  clipboardClock: ClipboardClock,
  messagesSquare: MessagesSquare,
  userMinus: UserMinus,
  userStar: UserStar,
  star: Star,
  userX: UserX,
  userCheck: UserCheck,
  venusAndMars: VenusAndMars,
  calendar: Calendar,
  handshake: Handshake,
  mailQuestionMark: MailQuestionMark,
  mailX: MailX,
};

const SettingsItem = ({
  title,
  titleColor,
  icon,
  text,
  textColor,
  routerPath,
  routerParams,
  iconColor = '#333',
  disabled = false,
  callbackFn,
  player,
  team,
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
      router.push({ pathname: routerPath, params: routerParams });
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
              <Avatar size={32} player={player} />
            ) : team ? (
              <TeamLogo size={26} {...team.crest} />
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
                className={`text mx-2 flex-1 text-right text-lg ${textColor ? textColor : 'text-text-2'}`}>
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
