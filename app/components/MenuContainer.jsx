import { View } from 'react-native';

const MenuContainer = ({ children }) => {
  return (
    <View className="bg-bg-grouped-2 mb-10 w-full items-center justify-center overflow-hidden rounded-2xl shadow-[2px_2px_4px_rgba(0,0,0,0.1)]">
      {children}
    </View>
  );
};

export default MenuContainer;
