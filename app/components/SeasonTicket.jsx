import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { hexWithAlpha } from '@components/TicketCard';
import { shiftLightness } from '@lib/helperFunctions';
import Svg, { Line } from 'react-native-svg';
import { Barcode } from '@components/TicketCard';
import FloatingBottomSheet from '@components/FloatingBottomSheet';
import {
  CalendarX,
  CalendarPlus,
  CalendarClock,
  CirclePlay,
  CalendarCheck,
  Scissors,
} from 'lucide-react-native';

const NOTCH_DEFAULT = 18;

export default function SeasonTicketCard({ season, district, onStart, onEnd, style }) {
  const notchSize = NOTCH_DEFAULT;

  const status = season?.status || 'upcoming';

  const accentColor = (() => {
    switch (status) {
      case 'upcoming':
        return '#A95032';
      case 'active':
        return '#354A52';
      case 'complete':
        return '#356B57';
      default:
        return '#354A52';
    }
  })();
  const fg = '#F7F5F0';
  const darkenedAccent = shiftLightness(accentColor, -8);
  const dashColor = hexWithAlpha(fg, 0.35);

  const statusConfig = {
    upcoming: {
      label: 'UPCOMING',
      icon: 'CalendarClock',
    },
    active: {
      label: 'ACTIVE',
      icon: 'CirclePlay',
    },
    complete: {
      label: 'COMPLETED',
      icon: 'CalendarCheck',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.upcoming;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [handling, setHandling] = useState(false);

  const isOpen = status === 'active';

  const openConfirmModal = () => {
    const action = isOpen ? 'end' : 'start';

    setModalConfig({
      action,
      title: isOpen ? `End ${season?.name || 'Current'} Season?` : 'Start New Season?',
      message: isOpen
        ? 'This will close the current season and all results, competitions, and stats will be finalised. This cannot be undone.'
        : 'This will start a new season and enable league activity.',
      confirmText: isOpen ? 'End Season' : 'Start Season',
      confirmType: isOpen ? 'error' : 'success',
    });

    setModalVisible(true);
  };

  const handleConfirm = async () => {
    try {
      setHandling(true);
      if (modalConfig.action === 'end') {
        await onEnd(season.id);
      } else {
        await onStart();
      }
    } finally {
      setHandling(false);
      setModalVisible(false);
    }
  };

  return (
    <>
      <View
        className="w-full overflow-hidden rounded-[18px]"
        style={[
          {
            backgroundColor: accentColor,
            height: 200,
          },
          style,
        ]}>
        <View className="flex-1 flex-row">
          {/* ------------------------------------------------------------ */}
          {/* LEFT — SEASON INFORMATION */}
          {/* ------------------------------------------------------------ */}

          <View style={{ flex: 5 }} className="">
            {/* Header */}
            <View className="px-[18px] pb-2 pt-2" style={{ backgroundColor: darkenedAccent }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text
                    className="font-tektur-semibold text-[11px] tracking-[1px]"
                    style={{ color: hexWithAlpha(fg, 0.65) }}>
                    SEASON
                  </Text>

                  <Text className="font-tektur-semibold text-[15px]" style={{ color: fg }}>
                    {season?.name || 'Current'}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  {currentStatus.icon === 'CalendarClock' && <CalendarClock size={20} color={fg} />}
                  {currentStatus.icon === 'CirclePlay' && <CirclePlay size={20} color={fg} />}
                  {currentStatus.icon === 'CalendarCheck' && <CalendarCheck size={20} color={fg} />}

                  <Text
                    className="font-tektur-semibold text-[15px] tracking-wide"
                    style={{ color: fg }}>
                    {currentStatus.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Main information */}
            <View className="flex-1 justify-between gap-3 p-3">
              <Text className="font-tektur text-xl" style={{ color: fg }}>
                {district?.name}
              </Text>

              <View className="mt-1 flex-row gap-8">
                <View>
                  <Text
                    className="font-saira text-[10px]"
                    style={{ color: hexWithAlpha(fg, 0.55) }}>
                    START
                  </Text>

                  <Text className="font-saira-semibold text-[13px]" style={{ color: fg }}>
                    {formatDate(season?.start_date)}
                  </Text>
                </View>

                <View>
                  <Text
                    className="font-saira text-[10px]"
                    style={{ color: hexWithAlpha(fg, 0.55) }}>
                    END
                  </Text>

                  <Text className="font-saira-semibold text-[13px]" style={{ color: fg }}>
                    {formatDate(season?.end_date)}
                  </Text>
                </View>
              </View>
              <Pressable
                className="flex-1 flex-row items-center justify-center gap-3 rounded-xl border border-white/50 bg-bg-1/10 px-4"
                onPress={() => {
                  setHandling(false);
                  openConfirmModal();
                }}>
                {season?.status === 'active' ? (
                  <CalendarX size={18} color={'white'} />
                ) : (
                  <CalendarPlus size={18} color={'white'} />
                )}
                <Text className="text-center font-tektur-medium text-[14px]" style={{ color: fg }}>
                  {season?.status === 'active' ? 'End Current Season' : 'Start New Season'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ------------------------------------------------------------ */}
          {/* PERFORATED DIVIDER */}
          {/* ------------------------------------------------------------ */}

          <View
            style={{
              width: 1,
              position: 'relative',
              marginVertical: 14,
            }}>
            {/* Top notch */}
            <View
              className="absolute z-10 bg-bg-1"
              style={{
                width: notchSize,
                height: notchSize,
                borderRadius: notchSize / 2,
                top: -notchSize / 2 - 14,
                left: -notchSize / 2 + 0.5,
              }}
            />

            {/* Bottom notch */}
            <View
              className="absolute z-10 bg-bg-1"
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
          {/* RIGHT — ADMIN CONTROLS */}
          {/* ------------------------------------------------------------ */}

          <View
            className="relative flex-row items-stretch justify-end pr-4"
            style={{ backgroundColor: darkenedAccent, flex: 1 }}>
            <Barcode value="breakroomisgoated" vertical length={200} thickness={32} color={fg} />
            <Scissors
              size={18}
              color={fg}
              style={{
                transform: [{ rotate: '-90deg' }],
                position: 'absolute',
                bottom: 15,
                left: 2,
              }}
            />
          </View>
        </View>
      </View>
      <FloatingBottomSheet
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        title={modalConfig?.title}
        message={modalConfig?.message}
        topButtonText="Cancel"
        topButtonType="default"
        topButtonFn={() => setModalVisible(false)}
        bottomButtonText={modalConfig?.confirmText}
        bottomButtonType={modalConfig?.confirmType}
        bottomButtonFn={handleConfirm}
        onAnimationEnd={() => {
          if (!modalVisible) setModalConfig(null);
        }}
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
