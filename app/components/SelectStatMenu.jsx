import { View, Text, Pressable, ScrollView, useColorScheme } from 'react-native';
import { supabase } from '@/lib/supabase';
import Toast from 'react-native-toast-message';
import { useQueryClient } from '@tanstack/react-query';

const SelectStatMenu = ({
  context,
  statOptions,
  statSlots,
  editingSlotIndex,
  setStatSlots,
  setStatModalVisible,
  profile,
}) => {
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  return (
    <View className="flex-1 rounded-3xl bg-bg-grouped-2">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 32, paddingTop: 16 }}>
        <View className="flex-row flex-wrap">
          {statOptions.map((stat) => {
            const isSelected = statSlots.includes(stat.key);
            const isDisabled = isSelected && statSlots[editingSlotIndex] !== stat.key;
            const slotIndexes = statSlots
              .map((k, i) => (k === stat.key ? i : -1))
              .filter((i) => i !== -1);
            return (
              <Pressable
                key={stat.key}
                disabled={isDisabled}
                onPress={async () => {
                  const updated = [...statSlots];
                  updated[editingSlotIndex] = stat.key;
                  setStatSlots(updated);
                  setStatModalVisible(false);

                  try {
                    const { error } = await supabase
                      .from(context === 'player' ? 'Players' : 'Teams')
                      .update({ displayed_stats: updated })
                      .eq('id', profile.id);

                    if (error) throw error;

                    Toast.show({
                      type: 'success',
                      text1: 'Stats Updated',
                      text2: 'Your displayed stats have been saved successfully.',
                      props: { colorScheme },
                    });

                    queryClient.invalidateQueries([
                      context === 'player' ? 'PlayerStats' : 'TeamStats',
                      profile.id,
                    ]);
                  } catch (err) {
                    console.error('Error updating displayed stats:', err);
                    Toast.show({
                      type: 'error',
                      text1: 'Update Failed',
                      text2: 'There was a problem saving your stats. Please try again.',
                      props: { colorScheme },
                    });
                  }
                }}
                className="w-1/2 p-2">
                <View
                  className={`relative items-center justify-center rounded-2xl border-2 bg-bg-2 py-6 shadow-sm ${
                    isSelected ? 'border-brand' : 'border-transparent'
                  }`}>
                  {/* SLOT BADGES */}
                  {slotIndexes.map((slotIdx) => (
                    <View
                      key={slotIdx}
                      className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-brand">
                      <Text className="font-saira-bold text-sm text-white">{slotIdx + 1}</Text>
                    </View>
                  ))}
                  {/* BIG STAT VALUE */}
                  <Text style={{ lineHeight: 48 }} className="font-saira-bold text-4xl text-text-1">
                    {stat.value}
                    {stat.label.includes('%') ? '%' : ''}
                  </Text>

                  {/* LABEL UNDERNEATH */}
                  <Text className="mt-1 text-center font-saira-medium text-lg text-text-2">
                    {stat.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default SelectStatMenu;
