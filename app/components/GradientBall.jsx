import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';

const GradientBall = ({ color = '#5cabff', size = 300, children }) => {
  const radius = size / 2;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg height={size} width={size}>
        <Defs>
          <RadialGradient id="grad" cx="0.4" cy="0.4" r="0.7" fx="0.3" fy="0.3">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor="#222" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill="url(#grad)" />
      </Svg>

      {children && (
        <View
          style={{
            position: 'absolute',
            top: radius,
            left: radius,
            transform: [{ translateX: -radius }, { translateY: -radius }],
            width: size,
            height: size,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      )}
    </View>
  );
};

export default GradientBall;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
});
