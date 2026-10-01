import { forwardRef, useCallback } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Gem } from 'lucide-react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import CTAButton from '@components/CTAButton';
import { useTheme } from '@contexts/ThemeProvider';

// Presentational @gorhom/bottom-sheet modal telling the user a feature is
// paid. It's mounted once at the app root by UpgradeSheetProvider (which owns
// the ref and the config); open it with useUpgradeSheet().openUpgradeSheet().
// Note: className is ignored on gorhom components (NativeWind only maps it on
// core RN components), so BottomSheetView is styled inline.
const UpgradeSheet = forwardRef(function UpgradeSheet(
  { title, planName, description, onUpgrade, onClose },
  ref
) {
  const { colors: themeColors } = useTheme();

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
      ref={ref}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: themeColors.bg2,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
      }}
      handleIndicatorStyle={{ backgroundColor: themeColors.themeGray3 }}>
      <BottomSheetView style={{ gap: 20, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 40 }}>
        <View className="flex-row items-center gap-3">
          <Ionicons name="star" size={26} color="#FFD700" />
          <Text className="flex-1 font-saira-semibold text-2xl text-text-1">
            {title ?? 'Exclusive Feature'}
          </Text>
        </View>
        <Text className="font-saira text-lg text-text-2">
          {description ??
            `This is a paid feature. Upgrade to the ${planName ?? 'Core'} plan to unlock it and get more out of Break Room.`}
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
});

export default UpgradeSheet;
