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
    <View className="flex-1">
      {useTopInset && <View style={{ height: insets.top }} className={topColor} />}
      <View className={`flex-1 ${contentClassName}`}>{children}</View>
      {useBottomInset && <View style={{ height: insets.bottom }} className={bottomColor} />}
    </View>
  );
};

export default SafeViewWrapper;
