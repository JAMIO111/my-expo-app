import { useState } from 'react';
import { View, Text, ViewStyle, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { shiftLightness } from '@lib/helperFunctions';

const NOTCH_DEFAULT = 22;

export default function TicketCard({
  eyebrow = 'Breakroom Invitation',
  eyebrowSub = 'From John Dryden',
  title = 'You have been invited to join Shankhouse B Team!',
  stubLabel = 'Click the button below to handle the invitation.',
  requirements = [],
  footerLabel = 'Invitation issued 16/04/2026',
  barcodeValue = '06a83fab-122b-4ad8-ae34-73f7c6b3b839',
  accentColor = '#A886AF',
  textColor,
  notchSize = NOTCH_DEFAULT,
  notchColor = 'bg-bg-2',
  onAccept = () => {},
  onDecline = () => {},
  width = 300,
  style,
}) {
  const fg = textColor ?? getContrastText(accentColor);
  const dashColor = hexWithAlpha(fg, 0.35);
  const darkenedAccent = shiftLightness(accentColor, -6);

  const [handling, setHandling] = useState(false);

  const [fontsLoaded] = useFonts({
    Barcode128: require('../assets/fonts/LibreBarcode128-Regular.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <View
      className="w-full overflow-hidden rounded-[18px] shadow-sm"
      style={[{ backgroundColor: accentColor, height: 510 }, style]}>
      {/* ---- Top stub ---- */}
      <View style={[{ backgroundColor: darkenedAccent }]} className="px-[18px] pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="font-saira-bold text-[14px] tracking-wide"
              style={{ color: hexWithAlpha(fg, 0.7) }}>
              {eyebrow}
            </Text>
            <Text
              className="font-saira-medium text-[12px]"
              style={{ color: hexWithAlpha(fg, 0.55) }}>
              {eyebrowSub}
            </Text>
          </View>
          <Image
            source={require('../assets/BR-Logo-1024-No-Background.png')}
            style={{ width: 40, height: 40 }}
          />
        </View>
      </View>

      <View className="flex-1 px-4 py-4">
        <Text className="flex-1 font-michroma" style={{ color: fg, fontSize: 26, lineHeight: 40 }}>
          {title}
        </Text>
      </View>

      {/* ---- Perforation with tear notches ---- */}
      <View style={{ height: notchSize }} className="justify-center">
        <View
          className={`absolute top-1/2 z-10 ${notchColor}`}
          style={{
            width: notchSize,
            height: notchSize,
            borderRadius: notchSize / 2,
            marginLeft: -notchSize / 2,
            marginTop: -notchSize / 2,
            left: 0,
          }}
        />

        <Svg width="100%" height={2} className="ml-[18px]">
          <Line
            x1="0"
            y1="1"
            x2="100%"
            y2="1"
            stroke={dashColor}
            strokeWidth={1.5}
            strokeDasharray="16, 14"
          />
        </Svg>

        <View
          className={`absolute top-1/2 z-10 ${notchColor}`}
          style={{
            width: notchSize,
            height: notchSize,
            borderRadius: notchSize / 2,
            marginRight: -notchSize / 2,
            marginTop: -notchSize / 2,
            right: 0,
          }}
        />
      </View>

      {/* ---- Bottom section ---- */}
      <View className="px-[18px] pb-[18px] pt-[18px]">
        <Text className="font-saira text-[11px]" style={{ color: hexWithAlpha(fg, 0.75) }}>
          {stubLabel}
        </Text>
        <View className="pb-6">
          {!handling && (
            <Pressable
              className="mt-4 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3 pr-8"
              onPress={() => setHandling(true)}>
              <Ionicons name="ticket-outline" size={20} color={fg} />
              <Text className="text-center font-saira-semibold text-[14px]" style={{ color: fg }}>
                Handle Invitation
              </Text>
            </Pressable>
          )}
          {handling && (
            <View className="flex-row items-center justify-between gap-3">
              <Pressable
                className="mt-4 flex-1 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3 pr-8"
                onPress={() => {
                  setHandling(false);
                  onDecline();
                }}>
                <Ionicons name="close-outline" size={20} color={'red'} />
                <Text className="text-center font-saira-semibold text-[14px]" style={{ color: fg }}>
                  Decline
                </Text>
              </Pressable>
              <Pressable
                className="mt-4 flex-1 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4 py-3 pr-8"
                onPress={() => {
                  setHandling(false);
                  onAccept();
                }}>
                <Ionicons name="checkmark-outline" size={20} color={'green'} />
                <Text className="text-center font-saira-semibold text-[14px]" style={{ color: fg }}>
                  Accept
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {requirements.length > 0 && (
          <View className="mb-4">
            <Text
              className="mb-1 font-saira-bold text-[11px]"
              style={{ color: hexWithAlpha(fg, 0.6) }}>
              Requirements
            </Text>
            {requirements.map((line, i) => (
              <Text key={i} className="font-saira text-[13px] leading-[19px]" style={{ color: fg }}>
                {line}
              </Text>
            ))}
          </View>
        )}

        <Barcode value={barcodeValue} color={fg} height={30} />
        <Text
          className="mt-2 font-saira text-[11px] tracking-wide"
          style={{ color: hexWithAlpha(fg, 0.55) }}>
          {footerLabel}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Barcode                                                             */
/* ------------------------------------------------------------------ */

function Barcode({ value, color = '#111', height = 28 }) {
  return (
    <View className="flex-row items-center justify-center" style={{ height }}>
      <Text style={{ fontFamily: 'Barcode128', fontSize: 80, color }}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

function hexWithAlpha(hex, alpha) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastText(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean,
    16
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#181818' : '#F7F5F0';
}
