import { Text, View } from 'react-native';

const MenuContainer = ({ children, className, title }) => {
  return (
    <View className="w-full">
      {title && <Text className="pb-3 pl-1 font-saira-bold text-xl">{title}</Text>}
      <View className={`mb-10 w-full overflow-hidden rounded-3xl bg-bg-grouped-2 ${className}`}>
        <View className="items-center justify-center overflow-hidden rounded-2xl">{children}</View>
      </View>
    </View>
  );
};

export default MenuContainer;
