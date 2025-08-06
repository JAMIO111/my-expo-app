import React, { forwardRef, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import colors from '@lib/colors';
import { Text, View } from 'react-native';

const BottomSheetWrapper = forwardRef(
  ({ children, footerComponent = null, snapPoints = ['75%'], initialIndex = -1 }, ref) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const colorScheme = useColorScheme();
    const themeColors = colors[colorScheme] || colors.light;

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
      <BottomSheet
        enableContentPanningGesture={false} // allow drag from scroll area
        enableHandlePanningGesture={true} // allow drag from handle
        style={{ marginTop: 50 }}
        ref={ref}
        index={initialIndex}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: themeColors.bgGrouped2 }}
        handleIndicatorStyle={{ backgroundColor: themeColors.themeGray4 }}
        backdropComponent={renderBackdrop}
        footerComponent={footerComponent}>
        {children}
      </BottomSheet>
    );
  }
);

export default BottomSheetWrapper;
