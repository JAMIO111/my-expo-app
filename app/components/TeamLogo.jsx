import { StyleSheet, View } from 'react-native';

const TeamLogo = ({
  type = 'Horizontal Stripe',
  size = 40,
  color1 = 'white',
  color2 = 'red',
  thickness = 3,
  borderThickness = 0.5,
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
            }}
          />
        );

      case 'Vertical Stripe':
        return (
          <View
            style={{
              width: size / thickness,
              height: size,
              backgroundColor: color2 || '#000',
            }}
          />
        );

      case 'Diagonal Stripe':
        return (
          <View
            style={{
              position: 'absolute',
              width: size * 1.5,
              height: size / thickness,
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
              width: size * 1.5,
              height: size / thickness,
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
            }}
          />
        );

      case 'Checkerboard':
        const squares = [];
        const squareSize = size / (thickness * 2);
        for (let y = 0; y < thickness * 2; y++) {
          for (let x = 0; x < thickness * 2; x++) {
            if ((x + y) % 2 === 0) {
              squares.push(
                <View
                  key={`${x}-${y}`}
                  style={{
                    position: 'absolute',
                    top: y * squareSize,
                    left: x * squareSize,
                    width: squareSize,
                    height: squareSize,
                    backgroundColor: color2 || '#000',
                  }}
                />
              );
            }
          }
        }
        return <>{squares}</>;

      case 'Polka Dots':
        const dots = [];
        const dotSize = size / (thickness * 3);
        const gap = dotSize * 1.5;
        for (let y = 0; y < thickness * 2; y++) {
          for (let x = 0; x < thickness * 2; x++) {
            dots.push(
              <View
                key={`${x}-${y}`}
                style={{
                  position: 'absolute',
                  top: y * gap,
                  left: x * gap,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: color2 || '#000',
                  opacity: 0.9,
                }}
              />
            );
          }
        }
        return <>{dots}</>;

      case 'Border':
        return (
          <View
            style={{
              position: 'absolute',
              top: borderThickness,
              left: borderThickness,
              right: borderThickness,
              bottom: borderThickness,
              borderWidth: size / (4 * thickness),
              borderColor: color2 || '#000',
              borderRadius: size / 2 - borderThickness,
            }}
          />
        );

      case 'Quartered':
        return (
          <>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: size / 2,
                height: size / 2,
                backgroundColor: color2 || '#000',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: size / 2,
                left: size / 2,
                width: size / 2,
                height: size / 2,
                backgroundColor: color2 || '#000',
              }}
            />
          </>
        );

      case 'Cross':
        return (
          <>
            {/* Vertical stripe */}
            <View
              style={{
                position: 'absolute',
                width: (size / thickness) * 0.75,
                height: size,
                backgroundColor: color2 || '#000',
              }}
            />
            {/* Horizontal stripe */}
            <View
              style={{
                position: 'absolute',
                height: (size / thickness) * 0.75,
                width: size,
                backgroundColor: color2 || '#000',
              }}
            />
          </>
        );
      case 'Diagonal Cross':
        return (
          <>
            {/* Diagonal stripe 45deg */}
            <View
              style={{
                position: 'absolute',
                width: size * 1.5,
                height: (size / thickness) * 0.75,
                backgroundColor: color2 || '#000',
                transform: [{ rotate: '45deg' }],
              }}
            />
            {/* Diagonal stripe 135deg */}
            <View
              style={{
                position: 'absolute',
                width: size * 1.5,
                height: (size / thickness) * 0.75,
                backgroundColor: color2 || '#000',
                transform: [{ rotate: '135deg' }],
              }}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={{
        height: size,
        width: size,
        backgroundColor: color1,
        borderWidth: borderThickness,
      }}
      className="items-center justify-center overflow-hidden rounded-full border border-theme-gray-3">
      {innerView(type, color2, thickness)}
    </View>
  );
};

export default TeamLogo;

const styles = StyleSheet.create({});
