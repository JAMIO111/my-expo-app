import { View } from 'react-native';

const MenuContainer = ({ children, className }) => {
  return (
    <View className={`mb-10 w-full rounded-2xl bg-bg-grouped-2 shadow-sm ${className}`}>
      <View className="items-center justify-center overflow-hidden rounded-2xl">{children}</View>
    </View>
  );
};

export default MenuContainer;
