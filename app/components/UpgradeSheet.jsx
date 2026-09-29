import { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Gem } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { useTheme } from '@contexts/ThemeProvider';

// @gorhom/bottom-sheet modal that slides up to tell the user a feature is
// paid and offer the upgrade. Needs BottomSheetModalProvider (set up in the
// root layout). `visible` drives it; `onClose` fires however it gets
// dismissed (backdrop tap, swipe down, "Maybe later", back button).
const UpgradeSheet = ({
  visible,
  onClose,
  onUpgrade,
  title = 'Exclusive Feature',
  planName = 'Core',
  description,
}) => {
  const { colors: themeColors } = useTheme();
  const sheetRef = useRef(null);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: themeColors.bg2,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
      }}
      handleIndicatorStyle={{ backgroundColor: themeColors.themeGray3 }}>
      <BottomSheetView className="gap-5 px-6 pb-10 pt-2">
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
      </BottomSheetView>
    </BottomSheetModal>
  );
};

export default UpgradeSheet;
