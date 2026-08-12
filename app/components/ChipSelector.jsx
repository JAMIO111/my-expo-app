import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';

/**
 * ChipSelector
 * Generic horizontal chip/filter selector, styled to match Break Room's
 * design system (Saira font, dark green brand, gold accent).
 *
 * Supports single-select or multi-select.
 *
 * Props:
 * - options: Array<{ label: string, value: string | number, icon?: ReactNode }>
 * - value: selected value (single) or array of values (multi)
 * - onChange: (value) => void — receives new selection (string/number, or array in multi mode)
 * - multi: boolean — allow multiple selections (default false)
 * - contentContainerClassName: optional extra classes for the scroll content wrapper
 */
export default function ChipSelector({
  options = [],
  value,
  onChange,
  multi = false,
  contentContainerClassName = '',
}) {
  const isSelected = (optionValue) =>
    multi ? Array.isArray(value) && value.includes(optionValue) : value === optionValue;

  const handlePress = (optionValue) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      onChange?.(next);
    } else {
      onChange?.(optionValue);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="flex-grow-0 pb-3"
      contentContainerClassName={`flex-row w-full py-1 px-4 gap-3 ${contentContainerClassName}`}>
      {options.map((option) => {
        const selected = isSelected(option.value);

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => handlePress(option.value)}
            className={`flex-1 flex-row items-center justify-center rounded-full border px-4 py-2 ${
              selected ? 'border-brand bg-brand' : 'border-theme-gray-5 bg-bg-grouped-2'
            }`}>
            {option.icon ? (
              <View className="mr-2">
                {selected && option.selectedIcon ? option.selectedIcon : option.icon}
              </View>
            ) : null}
            <Text
              className={`font-saira-semibold text-sm ${selected ? 'text-white' : 'text-text-2'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Example usage — single select:
 *
 * const [status, setStatus] = useState("all");
 *
 * <ChipSelector
 *   options={[
 *     { value: "all", label: "All" },
 *     { value: "upcoming", label: "Upcoming" },
 *     { value: "live", label: "Live" },
 *     { value: "completed", label: "Completed" },
 *   ]}
 *   value={status}
 *   onChange={setStatus}
 * />
 *
 * Example usage — multi select with icons:
 *
 * const [days, setDays] = useState(["mon", "wed"]);
 *
 * <ChipSelector
 *   multi
 *   options={[
 *     { value: "mon", label: "Mon" },
 *     { value: "tue", label: "Tue" },
 *     { value: "wed", label: "Wed" },
 *   ]}
 *   value={days}
 *   onChange={setDays}
 * />
 */
