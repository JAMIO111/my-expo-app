import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Platform,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import IonIcons from 'react-native-vector-icons/Ionicons';
import colors from '@lib/colors'; // Ensure you have a colors.js file with your color definitions
import CTAButton from '@components/CTAButton';

export default function ModalWrappedDatePicker({ value, minDate, maxDate, onChangeDate }) {
  const [tempDate, setTempDate] = useState(value ?? new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    setTempDate(value ?? new Date());
  }, [value]);

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setModalVisible(false);
      if (selectedDate) {
        onChangeDate?.(selectedDate);
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  const onCancel = () => {
    setTempDate(value ?? new Date());
    setModalVisible(false);
  };

  const onConfirm = () => {
    onChangeDate?.(tempDate);
    setModalVisible(false);
  };

  return (
    <View
      className="bg-input-background"
      style={[
        styles.container,
        {
          borderColor: colors[colorScheme].border,
        },
      ]}>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
        }}>
        <IonIcons name="calendar-outline" size={24} color={colors[colorScheme].icon} />
        <Text className="text-xl text-text-3">{value ? value.toDateString() : 'Pick a date'}</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View className="bg-background-light" style={styles.modalContent}>
            <DateTimePicker
              value={tempDate}
              minimumDate={minDate}
              maximumDate={maxDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChange}
              style={{ width: '100%' }}
            />

            {Platform.OS === 'ios' && (
              <View style={styles.buttonsRow}>
                <View className="flex-1">
                  <CTAButton type="error" text="Cancel" callbackFn={onCancel} />
                </View>
                <View className="flex-1">
                  <CTAButton type="success" text="Confirm" callbackFn={onConfirm} />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    gap: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
});
