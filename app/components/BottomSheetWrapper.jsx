import { forwardRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

// Using forwardRef to expose control to parent
const BottomSheetWrapper = forwardRef(
  ({ children, snapPoints = ['25%', '50%'], initialIndex = -1 }, ref) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    useEffect(() => {
      if (ref && typeof ref !== 'function' && ref.current) {
        console.log('✅ BottomSheet ref received in wrapper:', ref.current);
      } else {
        console.warn('❌ BottomSheet ref not available yet');
      }
    }, [ref]);
    return (
      <BottomSheet
        ref={ref}
        index={0}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}>
        <View style={{ flex: 1, backgroundColor: 'red', borderWidth: 2 }}>{children}</View>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  sheetBackground: {
    backgroundColor: 'white',
  },
  handle: {
    backgroundColor: '#ccc',
  },
});

export default BottomSheetWrapper;
