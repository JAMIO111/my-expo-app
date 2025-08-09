import { forwardRef, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import colors from '@lib/colors';

const BottomSheetWrapper = forwardRef(
  (
    { children, footerComponent = null, snapPoints = ['75%'], initialIndex = -1, marginTop = 50 },
    ref
  ) => {
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
        style={{ marginTop }}
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
