import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

// HSL → HEX helper
const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
  else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
  else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
  else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
  else if (h >= 300 && h < 360) [r, g, b] = [c, 0, x];

  const toHex = (n) => {
    let hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Generate colors
const generateColors = () => {
  const colors = [];

  // Top row: grayscale (black → white)
  const graySteps = 6; // match your column width
  for (let i = 0; i < graySteps; i++) {
    const l = Math.round((i / (graySteps - 1)) * 100); // lightness 0–100
    colors.push(hslToHex(0, 0, l));
  }

  // Main color grid: hue changes by row, lightness by column
  const rows = 16; // hues
  const cols = 6; // match top row
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const h = Math.round((row / rows) * 360); // hue per row
      const s = 100;
      const l = 15 + col * 12; // lightness per column
      colors.push(hslToHex(h, s, l));
    }
  }

  return colors;
};

const ColorPickerGrid = ({ onSelect }) => {
  const colors = generateColors();
  const [selected, setSelected] = useState(null);

  const handleSelect = (color) => {
    setSelected(color);
    onSelect?.(color);
  };

  return (
    <View style={styles.grid}>
      {colors.map((color, idx) => (
        <Pressable
          key={idx}
          onPress={() => handleSelect(color)}
          style={[
            styles.colorBox,
            { backgroundColor: color },
            selected === color && styles.selected,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 7 * 50, // 8 columns * box size
  },
  colorBox: {
    width: 50,
    height: 50,
    margin: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selected: {
    borderWidth: 3,
    borderColor: '#000',
  },
});

export default ColorPickerGrid;
