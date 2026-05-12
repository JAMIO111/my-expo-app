import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

const ON = '#FF7A00';
const OFF = '#1e1a14';

const DIGITS = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};

// All geometry uses a fixed internal coordinate space — scale is applied
// only at the SVG level via width/height vs a fixed viewBox, so the
// segment math stays simple and unscaled.
const BASE_W = 54;
const BASE_H = 94;
const T = 9;
const G = 3;
const C = 4;
const DIGIT_GAP = 10;
const VIEWBOX_W = BASE_W * 2 + DIGIT_GAP;

function hPoints(x, y) {
  const w = BASE_W - 2 * T - 2 * G;
  const ox = x + T + G;
  return [
    `${ox + C},${y}`,
    `${ox + w - C},${y}`,
    `${ox + w},${y + T / 2}`,
    `${ox + w - C},${y + T}`,
    `${ox + C},${y + T}`,
    `${ox},${y + T / 2}`,
  ].join(' ');
}

function vPoints(x, y) {
  const h = (BASE_H - T) / 2 - 2 * G;
  return [
    `${x},${y + C}`,
    `${x + T / 2},${y}`,
    `${x + T},${y + C}`,
    `${x + T},${y + h - C}`,
    `${x + T / 2},${y + h}`,
    `${x},${y + h - C}`,
  ].join(' ');
}

function Digit({ value, offsetX }) {
  const segs = DIGITS[value] ?? DIGITS[0];
  const vtop = T + G;
  const vbot = (BASE_H + T) / 2 + G;

  const segments = [
    hPoints(offsetX, 0),
    vPoints(offsetX + BASE_W - T, vtop),
    vPoints(offsetX + BASE_W - T, vbot),
    hPoints(offsetX, BASE_H - T),
    vPoints(offsetX, vbot),
    vPoints(offsetX, vtop),
    hPoints(offsetX, (BASE_H - T) / 2),
  ];

  return (
    <>
      {segments.map((pts, i) => (
        <Polygon key={i} points={pts} fill={segs[i] ? ON : OFF} />
      ))}
    </>
  );
}

function ScoreDisplay({ score, scale }) {
  const clamped = Math.max(0, Math.min(99, Math.floor(score)));
  const tens = Math.floor(clamped / 10);
  const ones = clamped % 10;

  // SVG renders into a scaled width/height but keeps the same viewBox,
  // so all the polygon coordinates need no changes.
  const svgW = VIEWBOX_W * scale;
  const svgH = BASE_H * scale;

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${VIEWBOX_W} ${BASE_H}`}>
      <Digit value={tens} offsetX={0} />
      <Digit value={ones} offsetX={BASE_W + DIGIT_GAP} />
    </Svg>
  );
}

export default function SevenSegmentScoreboard({ homeScore = 0, awayScore = 0, scale = 1 }) {
  const s = scale;
  const dotSize = Math.round(8 * s);
  const dotRadius = dotSize / 2;

  return (
    <View
      style={{
        backgroundColor: '#0c0c0c',
        borderRadius: 20 * s,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28 * s,
        padding: 24 * s,
      }}>
      <View style={{ alignItems: 'center', gap: 12 * s }}>
        <Text style={{ fontSize: 14 * s, letterSpacing: 2 * s, color: '#888', fontWeight: '500' }}>
          HOME
        </Text>
        <ScoreDisplay score={homeScore} scale={s} />
      </View>

      <View style={{ flexDirection: 'column', gap: 14 * s }}>
        <View
          style={{ width: dotSize, height: dotSize, borderRadius: dotRadius, backgroundColor: ON }}
        />
        <View
          style={{ width: dotSize, height: dotSize, borderRadius: dotRadius, backgroundColor: ON }}
        />
      </View>

      <View style={{ alignItems: 'center', gap: 12 * s }}>
        <Text style={{ fontSize: 14 * s, letterSpacing: 2 * s, color: '#888', fontWeight: '500' }}>
          AWAY
        </Text>
        <ScoreDisplay score={awayScore} scale={s} />
      </View>
    </View>
  );
}

// Usage:
// <SevenSegmentScoreboard homeScore={3} awayScore={1} />
// <SevenSegmentScoreboard homeScore={3} awayScore={1} scale={0.5} />
