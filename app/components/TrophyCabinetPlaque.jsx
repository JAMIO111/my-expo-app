import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, useColorScheme } from 'react-native';

/**
 * TrophyCabinetPlaque — pure RN primitives, no SVG
 *
 * @param {string}   leagueName  - Top legend text    (default: "Break Room Awards")
 * @param {string}   title       - Main title          (default: "Trophy Cabinet")
 * @param {string}   subtitle    - Sub-line            (default: "Honours & Achievements")
 * @param {function} onPress
 * @param {object}   style       - Extra style for outer wrapper
 */
export default function TrophyCabinetPlaque({
  leagueName = 'Break Room Awards',
  title = 'Trophy Cabinet',
  subtitle = 'Honours & Achievements',
  onPress,
  style,
}) {
  const dark = useColorScheme() === 'dark';

  const gold = dark ? '#c49a2a' : '#b8860b';
  const goldFaint = dark ? '#5a4510' : '#daa520';
  const bg = dark ? '#2a1f06' : '#fef0c0';
  const textDark = dark ? '#f0c84a' : '#5a3a00';
  const textMid = dark ? '#c49a2a' : '#7a5200';
  const textFaint = dark ? '#8a6a2a' : '#a07030';

  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={[styles.wrapper, style]}>
      {/* Outer border */}
      <View style={[styles.outerBorder, { borderColor: gold, backgroundColor: bg }]}>
        {/* Inner border inset */}
        <View style={[styles.innerBorder, { borderColor: goldFaint }]}>
          {/* League name */}
          <Text style={[styles.legend, { color: textFaint }]}>{leagueName}</Text>

          {/* Thin rule */}
          <View style={[styles.rule, { backgroundColor: goldFaint }]} />

          {/* Title */}
          <Text style={[styles.title, { color: textDark }]}>{title}</Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: textMid }]}>{subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  outerBorder: {
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 3,
  },
  innerBorder: {
    borderWidth: 0.5,
    borderRadius: 2,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  legend: {
    fontFamily: 'Georgia',
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  rule: {
    width: '40%',
    height: 0.5,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Georgia',
    fontSize: 11,
    fontStyle: 'italic',
    letterSpacing: 3,
    textAlign: 'center',
  },
  trophyRow: {
    fontSize: 14,
    letterSpacing: 8,
  },
});
