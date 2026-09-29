import { Modal, Pressable, Text, View } from 'react-native';
import { Gem } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';

// Bottom sheet that slides up to tell the user a feature is paid and offer the
// upgrade. Tapping the dimmed backdrop, "Maybe later" or the system back
// button dismisses it.
const UpgradeSheet = ({
  visible,
  onClose,
  onUpgrade,
  title = 'Exclusive Feature',
  planName = 'Core',
  description,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onClose}>
    <View className="flex-1 justify-end">
      <Pressable className="absolute inset-0 bg-black/50" onPress={onClose} />
      <View
        style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
        className="gap-5 bg-bg-2 px-6 pb-10 pt-3">
        <View className="h-1 w-12 self-center rounded-full bg-theme-gray-3" />
        <View className="flex-row items-center gap-3">
          <Ionicons name="star" size={26} color="#FFD700" />
          <Text className="flex-1 font-saira-semibold text-2xl text-text-1">{title}</Text>
        </View>
        <Text className="font-saira text-lg text-text-2">
          {description ??
            `This is a paid feature. Upgrade to the ${planName} plan to unlock it and get more out of Break Room.`}
        </Text>
        <View className="gap-3">
          <CTAButton
            type="yellow"
            text="Upgrade Now"
            lucideIcon={<Gem size={20} color="black" />}
            callbackFn={onUpgrade}
          />
          <CTAButton type="default" text="Maybe later" callbackFn={onClose} />
        </View>
      </View>
    </View>
  </Modal>
);

export default UpgradeSheet;
