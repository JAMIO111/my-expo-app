import { Text, View } from 'react-native';

const MenuContainer = ({ children, className, title }) => {
  return (
    <View
      className={`mb-10 w-full rounded-2xl border border-theme-gray-5 bg-bg-grouped-2 ${className}`}>
      {title && (
        <View className="border-b border-theme-gray-5 px-4 py-2">
          <Text className="text-lg font-semibold">{title}</Text>
        </View>
      )}
      <View className="items-center justify-center overflow-hidden rounded-2xl">{children}</View>
    </View>
  );
};

export default MenuContainer;
