import { StyleSheet, View } from 'react-native';

const TeamLogo = ({
  type = 'Horizontal Stripe',
  size = 40,
  color1 = 'white',
  color2 = 'red',
  thickness = 3,
}) => {
  const innerView = (type, color2, thickness) => {
    switch (type) {
      case 'Solid':
        return null;
      case 'Horizontal Stripe':
        return (
          <View
            style={{
              height: size / thickness,
              width: size,
              backgroundColor: color2 || '#000',
            }}></View>
        );
      case 'Vertical Stripe':
        return (
          <View
            style={{
              width: size / thickness,
              height: size,
              backgroundColor: color2 || '#000',
            }}></View>
        );
      case 'Diagonal Stripe':
        return (
          <View
            style={{
              position: 'absolute',
              width: size * 1.5, // Make it long enough to span diagonally
              height: size / thickness, // Thin stripe
              backgroundColor: color2 || '#000',
              transform: [{ rotate: '45deg' }],
            }}
          />
        );
      case 'Diagonal Stripe Reverse':
        return (
          <View
            style={{
              position: 'absolute',

              width: size * 1.5, // Make it long enough to span diagonally
              height: size / thickness, // Thin stripe
              backgroundColor: color2 || '#000',
              transform: [{ rotate: '320deg' }],
            }}
          />
        );
      case 'Spots':
        return (
          <View
            style={{
              width: size / thickness,
              height: size / thickness,
              backgroundColor: color2 || '#000',
              borderRadius: size / thickness / 2,
            }}></View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={{ height: size, width: size, backgroundColor: color1 }}
      className="items-center justify-center overflow-hidden rounded-full border border-theme-gray-3">
      {innerView(type, color2, thickness)}
    </View>
  );
};

export default TeamLogo;

const styles = StyleSheet.create({});
