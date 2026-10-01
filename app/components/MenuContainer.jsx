import { Text, View } from 'react-native';

const MenuContainer = ({ children, className, title, footer }) => {
  return (
    <View className="mb-10 w-full">
      {title && <Text className="pb-3 pl-1 font-saira-bold text-xl text-text-1">{title}</Text>}
      <View className={`w-full overflow-hidden rounded-3xl bg-bg-grouped-2 ${className}`}>
        <View className="items-center justify-center overflow-hidden rounded-2xl">{children}</View>
      </View>
      {footer && (
        <View>
          <Text className="pl-2 pt-2 font-tektur text-sm text-text-2">{footer}</Text>
        </View>
      )}
    </View>
  );
};

export default MenuContainer;
