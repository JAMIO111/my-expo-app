import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle as SvgCircle } from 'react-native-svg';

const PatternedCircle = ({
  size = 100,
  pattern = 'dots', // 'dots', 'horizontal-stripes', 'vertical-stripes', or 'none'
  patternColor = '#000',
  backgroundColor = '#eee',
  borderColor = '#222',
  borderWidth = 2,
  patternDensity = 6, // how many tiles across the circle
}) => {
  const radius = size / 2;
  const tileSize = size / patternDensity;
  const halfTile = tileSize / 2;
  const stripeThickness = tileSize / 2;
  const dotRadius = tileSize / 4;

  const patternId = `${pattern}-pattern`;

  const renderPattern = () => {
    switch (pattern) {
      case 'dots':
        return (
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize}>
            <SvgCircle cx={halfTile} cy={halfTile} r={dotRadius} fill={patternColor} />
          </Pattern>
        );
      case 'vertical-stripes':
        return (
          <View className="rounded-full">
            <View className="w-[50%] bg-yellow-400"></View>
          </View>
        );
      case 'horizontal-stripes':
        return (
          <Pattern id={patternId} patternUnits="userSpaceOnUse" width={tileSize} height={tileSize}>
            <Rect x="0" y="0" width={tileSize} height={stripeThickness} fill={patternColor} />
          </Pattern>
        );
      default:
        return null;
    }
  };

  const fillValue = pattern === 'none' ? backgroundColor : `url(#${patternId})`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>{renderPattern()}</Defs>
        <SvgCircle
          cx={radius}
          cy={radius}
          r={radius - borderWidth / 2}
          fill={fillValue}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
      </Svg>
    </View>
  );
};

export default PatternedCircle;
