import { View } from 'react-native';

const MenuContainer = ({ children, className }) => {
  return (
    <View
      className={`mb-10 w-full items-center justify-center overflow-hidden rounded-2xl bg-bg-grouped-2 shadow-[2px_2px_4px_rgba(0,0,0,0.1)] ${className}`}>
      {children}
    </View>
  );
};

export default MenuContainer;
