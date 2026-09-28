import { forwardRef, useMemo, useCallback } from 'react';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Keyboard } from 'react-native';
import { useTheme } from '@contexts/ThemeProvider';

const BottomSheetWrapper = forwardRef(
  (
    {
      children,
      footerComponent = null,
      snapPoints = ['75%'],
      initialIndex = -1,
      marginTop = 100,
      backgroundColor,
      indicatorColor = 'themeGray3',
      onChange = () => {},
      onBackdropPress = null, // ✅ new — lets the parent own the close path
    },
    ref
  ) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const { colors: themeColors } = useTheme();

    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior={onBackdropPress ? 'close' : 'close'} // ✅ hand off control when a handler is given
          onPress={onBackdropPress ?? undefined} // ✅ BottomSheetBackdrop forwards onPress through its internal Pressable
        />
      ),
      []
    );

    return (
      <BottomSheet
        enableContentPanningGesture={false} // allow drag from scroll area
        enableHandlePanningGesture={true} // allow drag from handle
        style={{ marginTop }}
        ref={ref}
        index={initialIndex}
        snapPoints={memoizedSnapPoints}
        onChange={(index) => {
          if (index === -1) {
            // sheet is closed
            Keyboard.dismiss();
          }
          onChange(index);
        }}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: backgroundColor ? backgroundColor : themeColors.bg2,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
        }}
        handleIndicatorStyle={{ backgroundColor: themeColors[indicatorColor] }}
        backdropComponent={renderBackdrop}
        footerComponent={footerComponent}>
        {children}
      </BottomSheet>
    );
  }
);

export default BottomSheetWrapper;
