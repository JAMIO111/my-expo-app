import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { hexWithAlpha } from '@components/TicketCard';
import { shiftLightness } from '@lib/helperFunctions';
import Svg, { Line } from 'react-native-svg';
import { Barcode } from '@components/TicketCard';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import { LockOpen, Lock, DoorOpen, DoorClosed, Stamp } from 'lucide-react-native';

const NOTCH_DEFAULT = 18;

export default function AdminTransferToggle({
  isOpen,
  district,
  lastToggledAt,
  onToggle,
  loading,
  style,
}) {
  const notchSize = NOTCH_DEFAULT;

  const accentColor = isOpen ? '#d99a09' : '#1f1805';
  const fg = !isOpen ? '#f0b20a' : '#000';
  const darkenedAccent = shiftLightness(accentColor, isOpen ? -10 : 2);
  const dashColor = hexWithAlpha(fg, 0.35);

  const [modalVisible, setModalVisible] = useState(false);
  const [handling, setHandling] = useState(false);

  const openConfirmModal = () => setModalVisible(true);

  const modalConfig = isOpen
    ? {
        title: 'Close Transfer Window?',
        message:
          'Players and teams will no longer be able to submit or action transfer requests until it reopens.',
        confirmText: 'Close Window',
        confirmType: 'error',
      }
    : {
        title: 'Open Transfer Window?',
        message: 'This will allow players and teams to submit and action transfer requests.',
        confirmText: 'Open Window',
        confirmType: 'success',
      };

  const handleConfirm = async () => {
    try {
      setHandling(true);
      await onToggle();
    } finally {
      setHandling(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <View
        className="w-full overflow-hidden rounded-[18px]"
        style={[{ backgroundColor: accentColor, height: 200 }, style]}>
        <View className="flex-1 flex-row">
          {/* ------------------------------------------------------------ */}
          {/* LEFT — WINDOW INFORMATION */}
          {/* ------------------------------------------------------------ */}

          <View style={{ flex: 5 }}>
            {/* Header */}
            <View className="px-[18px] pb-2 pt-2" style={{ backgroundColor: darkenedAccent }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="font-tektur-semibold text-[11px] tracking-[1px]"
                    style={{ color: hexWithAlpha(fg, 0.65) }}>
                    TRANSFER WINDOW
                  </Text>

                  <Text className="font-tektur-semibold text-[15px]" style={{ color: fg }}>
                    {district?.name || 'League'}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {isOpen ? <LockOpen size={20} color={fg} /> : <Lock size={20} color={fg} />}

                  <Text
                    className="font-tektur-semibold text-[15px] tracking-wide"
                    style={{ color: fg }}>
                    {isOpen ? 'OPEN' : 'CLOSED'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Main information */}
            <View className="flex-1 justify-between gap-3 p-3">
              <Text className="font-tektur text-xl" style={{ color: fg }}>
                {isOpen ? 'Requests are being accepted' : 'Requests are on hold'}
              </Text>

              <View className="mt-1 flex-row gap-8">
                <View>
                  <Text
                    className="font-saira text-[10px]"
                    style={{ color: hexWithAlpha(fg, 0.55) }}>
                    STATUS
                  </Text>

                  <Text className="font-saira-semibold text-[13px]" style={{ color: fg }}>
                    {isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>

                <View>
                  <Text
                    className="font-saira text-[10px]"
                    style={{ color: hexWithAlpha(fg, 0.55) }}>
                    SINCE
                  </Text>

                  <Text className="font-saira-semibold text-[13px]" style={{ color: fg }}>
                    {formatDate(lastToggledAt)} - {formatTime(lastToggledAt)}
                  </Text>
                </View>
              </View>

              <Pressable
                className="flex-1 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4"
                onPress={() => {
                  setHandling(false);
                  openConfirmModal();
                }}>
                {isOpen ? <DoorClosed size={18} color={fg} /> : <DoorOpen size={18} color={fg} />}
                <Text className="text-center font-tektur-medium text-[14px]" style={{ color: fg }}>
                  {isOpen ? 'Close Transfer Window' : 'Open Transfer Window'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ------------------------------------------------------------ */}
          {/* PERFORATED DIVIDER */}
          {/* ------------------------------------------------------------ */}

          <View style={{ width: 1, position: 'relative', marginVertical: 14 }}>
            <View
              className="absolute z-10 bg-bg-2"
              style={{
                width: notchSize,
                height: notchSize,
                borderRadius: notchSize / 2,
                top: -notchSize / 2 - 14,
                left: -notchSize / 2 + 0.5,
              }}
            />
            <View
              className="absolute z-10 bg-bg-2"
              style={{
                width: notchSize,
                height: notchSize,
                borderRadius: notchSize / 2,
                bottom: -notchSize / 2 - 14,
                left: -notchSize / 2 + 0.5,
              }}
            />

            <Svg width="2" height="100%">
              <Line
                x1="1"
                y1="0"
                x2="1"
                y2="100%"
                stroke={dashColor}
                strokeWidth={1.5}
                strokeDasharray="8, 8"
              />
            </Svg>
          </View>

          {/* ------------------------------------------------------------ */}
          {/* RIGHT — STAMP + BARCODE */}
          {/* ------------------------------------------------------------ */}

          <View
            className="relative flex-row items-stretch justify-end pr-4"
            style={{ backgroundColor: darkenedAccent, flex: 1 }}>
            <Barcode
              value={isOpen ? 'windowopen' : 'windowclosed'}
              vertical
              length={200}
              thickness={32}
              color={fg}
            />

            {/* Stamp */}
            <View
              className="absolute items-center justify-center rounded-full border-2"
              style={{
                width: 56,
                height: 56,
                top: 18,
                left: -2,
                borderColor: hexWithAlpha(fg, 0.55),
                borderStyle: 'dashed',
                transform: [{ rotate: '-16deg' }],
              }}>
              <Stamp size={14} color={hexWithAlpha(fg, 0.75)} />
              <Text
                className="font-tektur-semibold text-[8px] tracking-[0.5px]"
                style={{ color: hexWithAlpha(fg, 0.85) }}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <FloatingBottomSheet
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        topButtonText="Cancel"
        topButtonType="default"
        topButtonFn={() => setModalVisible(false)}
        bottomButtonText={modalConfig.confirmText}
        bottomButtonType={modalConfig.confirmType}
        bottomButtonFn={handleConfirm}
        onAnimationEnd={() => {}}
      />
    </>
  );
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date) {
  if (!date) return '—';

  return new Date(date)
    .toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .toUpperCase();
}
