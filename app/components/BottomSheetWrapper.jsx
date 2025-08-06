import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import colors from '@lib/colors';

const BottomSheetWrapper = forwardRef(
  ({ children, snapPoints = ['75%'], initialIndex = -1 }, ref) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const colorScheme = useColorScheme();
    const themeColors = colors[colorScheme] || colors.light;

    // 👇 Render backdrop that closes on press
    const renderBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close" // 👈 tap backdrop to close
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={ref}
        index={initialIndex}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: themeColors.bgGrouped2 }}
        handleIndicatorStyle={{ backgroundColor: themeColors.themeGray4 }}
        backdropComponent={renderBackdrop} // 👈 pass the backdrop
      >
        <BottomSheetView className="flex-1">
          <View className="flex-1">{children}</View>
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

export default BottomSheetWrapper;
