import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SafeViewWrapper = ({
  children,
  topColor = 'bg-transparent',
  bottomColor = 'bg-transparent',
  contentClassName = '',
  useTopInset = true,
  useBottomInset = true,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        elevation: 9999, // Android
      }}>
      {useTopInset && <View style={{ height: insets.top }} className={topColor} />}

      <View className={`flex-1 ${contentClassName}`}>{children}</View>

      {useBottomInset && <View style={{ height: insets.bottom }} className={bottomColor} />}
    </View>
  );
};

export default SafeViewWrapper;
